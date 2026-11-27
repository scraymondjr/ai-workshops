import { createInterface } from "node:readline";
import { agentReplySchema, wireTurnSchema, type ContextItem } from "../contract.js";
import { mcpCall } from "../mcp/server.js";

/** Small reference agent: answers a plan question from billing, via MCP. Not a module solution. */
export async function lookupTurn(raw: unknown) {
  const turn = wireTurnSchema.parse(raw);
  if (turn.type === "newSession" || !turn.mcpUrl || !turn.principal) {
    return { answer: "", contextSnapshot: [], handoff: null };
  }
  const account = await mcpCall(turn.mcpUrl, "crm", "crm.get_account", {
    tenant: turn.principal.tenant,
    id: `acc_${turn.principal.tenant}`,
  });
  const billing = await mcpCall(turn.mcpUrl, "billing", "billing.get_subscription", {
    accountId: account.accountId,
    tenant: turn.principal.tenant,
  });
  const item: ContextItem = {
    id: String(billing.id ?? `billing:${account.accountId}`),
    source: "billing",
    tenant: turn.principal.tenant,
    sensitivity: "internal",
    fetchedAt: turn.now ?? Date.now(),
    trust: "trusted",
    tokens: 40,
    content: `plan ${billing.plan} seats ${billing.seats}`,
  };
  return agentReplySchema.parse({
    answer: `Billing plan: ${billing.plan}. Billed seats: ${billing.seats}.`,
    contextSnapshot: [item],
    handoff: null,
  });
}

async function main() {
  const lines = createInterface({ input: process.stdin });
  for await (const line of lines) {
    const reply = await lookupTurn(JSON.parse(line));
    process.stdout.write(`${JSON.stringify(reply)}\n`);
  }
}

if (process.argv[1] && process.argv[1].endsWith("mcpLookup.ts")) {
  main();
}
