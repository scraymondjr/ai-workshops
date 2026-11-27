import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { World } from "../world/world.js";

export type CallLogEntry = {
  server: string;
  tool: string;
  args: Record<string, unknown>;
  resultId: string | null;
  ok: boolean;
};

type Tool = {
  name: string;
  description: string;
  call: (args: Record<string, unknown>, world: World) => { id: string; data: unknown };
};

const servers: Record<string, Tool[]> = {
  crm: [
    {
      name: "crm.get_account",
      description: "CRM account, contacts, and notes for the session tenant.",
      call: (args, world) => {
        const tenant = String(args.tenant ?? "");
        const id = String(args.id ?? "");
        const account = id ? world.accounts.get(id) : world.accountByTenant(tenant);
        if (!account || (tenant && account.tenant !== tenant)) {
          return { id: "crm:denied", data: { error: "cross_tenant" } };
        }
        return { id: `crm:${account.accountId}`, data: world.customerView(account) };
      },
    },
    {
      name: "ops.flag_data_issue",
      description: "Record a field-level conflict. Does not change the authoritative value.",
      call: (args, world) => {
        world.flags.push({
          accountId: String(args.accountId ?? ""),
          field: String(args.field ?? ""),
          values: args.values ?? null,
          at: world.nowMs,
        });
        return { id: `flag:${world.flags.length}`, data: { ok: true } };
      },
    },
  ],
  billing: [
    {
      name: "billing.get_subscription",
      description: "Billing subscription for an account. Plan, seats, and add-ons are authoritative.",
      call: (args, world) => {
        const accountId = String(args.accountId ?? args.id ?? "");
        const account = world.accounts.get(accountId) ?? world.accountByTenant(String(args.tenant ?? ""));
        if (!account) return { id: "billing:missing", data: { error: "not_found" } };
        const view = world.customerView(account);
        return {
          id: `billing:${account.accountId}`,
          data: {
            accountId: account.accountId,
            plan: view.plan,
            seats: view.seats,
            status: view.status,
            addOns: view.addOns,
            mrrCents: view.mrrCents,
            slaTier: view.slaTier,
          },
        };
      },
    },
    {
      name: "billing.issue_refund",
      description: "Dry-run unless approved=true. Records the attempt either way.",
      call: (args, world) => {
        const approved = args.approved === true;
        const entry = { accountId: String(args.accountId ?? ""), amountUsd: Number(args.amountUsd ?? 0), at: world.nowMs };
        if (!approved) return { id: `refund:denied:${world.refunds.length}`, data: { ok: false, error: "needs_approval" } };
        world.refunds.push(entry);
        return { id: `refund:${world.refunds.length}`, data: { ok: true } };
      },
    },
  ],
  tickets: [
    {
      name: "tickets.search",
      description: "Search one account's tickets. accountId is required and must match the session tenant's account.",
      call: (args, world) => {
        const accountId = String(args.accountId ?? "");
        const hits = world.searchTickets(accountId, String(args.query ?? ""));
        return {
          id: `tickets-search:${accountId}`,
          data: hits.slice(0, 20).map((t) => ({ ticketId: t.ticketId, subject: t.subject, openedAt: t.openedAt, status: t.status })),
        };
      },
    },
    {
      name: "tickets.get",
      description: "Fetch one ticket.",
      call: (args, world) => {
        const ticket = world.tickets.get(String(args.id ?? ""));
        if (!ticket) return { id: "ticket:missing", data: { error: "not_found" } };
        return { id: `ticket:${ticket.ticketId}`, data: ticket };
      },
    },
    {
      name: "tickets.add_internal_note",
      description: "Attach an internal note. Use this to log suspicious ticket text.",
      call: (args, world) => {
        world.internalNotes.push({ ticketId: String(args.id ?? ""), text: String(args.text ?? ""), at: world.nowMs });
        return { id: `note:${world.internalNotes.length}`, data: { ok: true } };
      },
    },
  ],
  catalog: [
    {
      name: "catalog.get_price",
      description: "Current price for a SKU at the world clock.",
      call: (args, world) => {
        const quote = world.quote(String(args.sku ?? ""), Number(args.seats ?? 1));
        if (!quote) return { id: "price:missing", data: { error: "not_found" } };
        return { id: `price:${quote.sku}:v${quote.priceVersion}`, data: quote };
      },
    },
    {
      name: "catalog.add_to_cart",
      description: "Add a SKU at the current price version.",
      call: (args, world) => {
        const cart = world.addToCart(String(args.tenant ?? ""), String(args.sku ?? ""), Number(args.seats ?? 1));
        return { id: cart.cartId, data: cart };
      },
    },
    {
      name: "catalog.checkout",
      description: "Checkout. Rejects a stale expectedPriceVersion.",
      call: (args, world) => {
        const result = world.checkout(String(args.cartId ?? ""), Number(args.expectedPriceVersion));
        return { id: `checkout:${args.cartId}`, data: result };
      },
    },
  ],
  kb: [
    {
      name: "kb.search",
      description: "Keyword search over Fernhill KB articles.",
      call: (args, world) => {
        const hits = world.searchKb(String(args.query ?? ""), Number(args.k ?? 5));
        return {
          id: `kb:${hits.map((h) => h.id).join("+") || "none"}`,
          data: hits.map((h) => ({ id: h.id, title: h.title, outdated: h.outdated, excerpt: h.body.slice(0, 280) })),
        };
      },
    },
  ],
  mail: [
    {
      name: "mail.send_email",
      description: "Sends only when the recipient is on the verified list passed by the host.",
      call: (args, world) => {
        const to = String(args.to ?? "");
        const verified = Array.isArray(args.verified) ? args.verified.map(String) : [];
        if (!verified.includes(to)) return { id: "mail:denied", data: { ok: false, error: "not_on_allow_list" } };
        world.emails.push({ to, subject: String(args.subject ?? ""), at: world.nowMs });
        return { id: `mail:${world.emails.length}`, data: { ok: true } };
      },
    },
  ],
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown) {
  const raw = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
  });
  res.end(raw);
}

export async function startMcp(world: World, port = 0) {
  const log: CallLogEntry[] = [];
  const server = createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, { "access-control-allow-origin": "*", "access-control-allow-headers": "*" });
      res.end();
      return;
    }
    const name = (req.url ?? "").split("?")[0]?.replace(/^\/mcp\//, "") ?? "";
    const tools = servers[name];
    if (!tools) {
      send(res, 404, { error: "unknown mcp server" });
      return;
    }
    const raw = await readBody(req);
    const msg = raw ? (JSON.parse(raw) as { id?: number; method?: string; params?: { name?: string; arguments?: Record<string, unknown> } }) : {};
    const id = msg.id ?? null;
    if (msg.method === "initialize") {
      send(res, 200, {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2025-06-18",
          capabilities: { tools: {} },
          serverInfo: { name: `fernhill-${name}`, version: "0.1.0" },
        },
      });
      return;
    }
    if (msg.method === "notifications/initialized") {
      res.writeHead(202);
      res.end();
      return;
    }
    if (msg.method === "tools/list") {
      send(res, 200, {
        jsonrpc: "2.0",
        id,
        result: {
          tools: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: { type: "object", additionalProperties: true },
          })),
        },
      });
      return;
    }
    if (msg.method === "tools/call") {
      const toolName = msg.params?.name ?? "";
      const tool = tools.find((t) => t.name === toolName);
      const args = msg.params?.arguments ?? {};
      if (!tool) {
        log.push({ server: name, tool: toolName, args, resultId: null, ok: false });
        send(res, 200, { jsonrpc: "2.0", id, result: { isError: true, content: [{ type: "text", text: "unknown tool" }] } });
        return;
      }
      const result = tool.call(args, world);
      const ok = !(result.data && typeof result.data === "object" && "error" in (result.data as object));
      log.push({ server: name, tool: tool.name, args, resultId: result.id, ok });
      send(res, 200, {
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: JSON.stringify({ id: result.id, ...((result.data as object) ?? {}) }) }], isError: !ok },
      });
      return;
    }
    send(res, 200, { jsonrpc: "2.0", id, error: { code: -32601, message: "method not found" } });
  });

  await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));
  const address = server.address();
  const bound = typeof address === "object" && address ? address.port : port;
  return {
    port: bound,
    baseUrl: `http://127.0.0.1:${bound}/mcp`,
    log,
    close: () => new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve()))),
  };
}

export async function mcpCall(baseUrl: string, server: string, tool: string, args: Record<string, unknown>) {
  const init = await fetch(`${baseUrl}/${server}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "fernhill-harness", version: "0.1.0" } } }),
  });
  if (!init.ok) throw new Error(`initialize failed ${init.status}`);
  const response = await fetch(`${baseUrl}/${server}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: tool, arguments: args } }),
  });
  const body = (await response.json()) as { result?: { content?: { text?: string }[]; isError?: boolean } };
  const text = body.result?.content?.[0]?.text ?? "{}";
  return JSON.parse(text) as Record<string, unknown>;
}
