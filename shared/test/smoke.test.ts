import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { canonical } from "../src/canonical.js";
import { generateDataset, priceAt, writeDrops, writeSeed } from "../src/fernhill/generate.js";
import { naiveBaseline, buildQuestions } from "../src/fernhill/generate.js";
import { scoreAnswers } from "../src/fernhill/scorecard.js";
import { judgeAgreement } from "../src/harness/judge.js";
import { diffBaseline, markdownScorecard } from "../src/harness/reporters.js";
import { builtinAgent, runScenarios, spawnAgent } from "../src/harness/run.js";
import { scoreContextSnapshot, scoreToolTrace } from "../src/harness/score.js";
import type { Scenario } from "../src/harness/types.js";
import { mcpCall, startMcp } from "../src/mcp/server.js";
import { World } from "../src/world/world.js";

const scenarios = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../workshops/context-engineering/scenarios/m0.json"), "utf8"),
) as Scenario[];

describe("Fernhill generator", () => {
  it("matches the committed seed", () => {
    const dir = mkdtempSync(join(tmpdir(), "fernhill-seed-"));
    writeSeed(dir, generateDataset());
    const committed = resolve(import.meta.dirname, "../fernhill/seed/golden.json");
    expect(readFileSync(join(dir, "golden.json"), "utf8")).toBe(readFileSync(committed, "utf8"));
  });

  it("is deterministic and matches the published shape", () => {
    const a = canonical(generateDataset());
    const b = canonical(generateDataset());
    expect(a).toBe(b);
    const dataset = generateDataset();
    expect(dataset.accounts).toHaveLength(60);
    expect(dataset.accounts.filter((account) => account.conflict)).toHaveLength(6);
    expect(dataset.invoices).toHaveLength(180);
    expect(dataset.tickets).toHaveLength(2400);
    expect(dataset.tickets.filter((ticket) => ticket.tenant === "halcyon")).toHaveLength(400);
    expect(dataset.tickets.filter((ticket) => ticket.relevant)).toHaveLength(7);
    expect(dataset.articles).toHaveLength(80);
    expect(dataset.articles.filter((article) => article.outdated)).toHaveLength(2);
    expect(dataset.skus).toHaveLength(30);
    const halcyon = dataset.accounts.find((account) => account.tenant === "halcyon")!;
    expect(halcyon.crmPlan).toBe("business");
    expect(halcyon.crmSeats).toBe(25);
    expect(halcyon.billing.at(-1)?.plan).toBe("team");
    expect(halcyon.billing.at(-1)?.seats).toBe(18);
    expect(dataset.tickets.find((ticket) => ticket.ticketId === "T-1042")?.body).toContain("18 techs");
    expect(dataset.tickets.find((ticket) => ticket.ticketId === "T-0884")?.body).toContain("KB-031");
  });

  it("writes a seed and 90 drops with the planted traps", () => {
    const dir = mkdtempSync(join(tmpdir(), "fernhill-"));
    const dataset = generateDataset();
    writeSeed(join(dir, "seed"), dataset);
    const manifest = JSON.parse(readFileSync(join(dir, "seed", "manifest.json"), "utf8"));
    expect(manifest.tickets).toBe(2400);
    expect(manifest.questions).toBe(40);
    const again = canonical(JSON.parse(readFileSync(join(dir, "seed", "golden.json"), "utf8")));
    writeSeed(join(dir, "seed2"), dataset);
    expect(canonical(JSON.parse(readFileSync(join(dir, "seed2", "golden.json"), "utf8")))).toBe(again);
    const landing = join(dir, "landing");
    writeDrops(landing, dataset);
    expect(existsSync(join(landing, "2026-10-20", "crm", "accounts.jsonl"))).toBe(false);
    expect(existsSync(join(landing, "2026-10-21", "crm", "accounts.jsonl"))).toBe(true);
    const bad = readFileSync(join(landing, "2026-09-02", "crm", "accounts.jsonl"), "utf8");
    expect(bad).toContain("{bad");
    const original = readFileSync(join(landing, "2026-11-10", "billing", "invoices.csv"));
    const copy = readFileSync(join(landing, "2026-11-10", "billing", "invoices.redelivered.csv"));
    expect(Buffer.compare(original, copy)).toBe(0);
  });

  it("moves the Route Optimizer promo from v7 to v8 after 15:30", () => {
    const dataset = generateDataset();
    const before = priceAt(dataset, "route-optimizer", 25, "2026-11-26T15:00:00.000Z");
    const after = priceAt(dataset, "route-optimizer", 25, "2026-11-26T15:40:00.000Z");
    expect(before).toMatchObject({ priceVersion: 7, priceCents: 12500 });
    expect(after).toMatchObject({ priceVersion: 8, priceCents: 22500 });
  });
});

describe("baseline scorecard", () => {
  it("scores the naive agent as confidently wrong", () => {
    const dataset = generateDataset();
    const questions = buildQuestions(dataset);
    const answers = naiveBaseline(dataset, questions);
    const card = scoreAnswers(questions, answers);
    expect(questions.filter((q) => q.kind === "answerable")).toHaveLength(30);
    expect(questions.filter((q) => q.kind === "unanswerable")).toHaveLength(5);
    expect(card.accuracy).toBeLessThan(0.5);
    expect(card.confidentlyWrongRate).toBeGreaterThan(0.5);
    expect(card.questions).toBe(40);
  });
});

describe("eval harness", () => {
  it("scores oracle at 100% and echo under 20%, stable across repeats", async () => {
    const scores: number[] = [];
    for (let i = 0; i < 5; i++) {
      const oracle = await runScenarios({
        agentName: "oracle",
        module: "m0",
        scenarios,
        agent: builtinAgent("oracle", scenarios),
      });
      const echo = await runScenarios({
        agentName: "echo",
        module: "m0",
        scenarios,
        agent: builtinAgent("echo", scenarios),
      });
      expect(oracle.score).toBe(1);
      expect(echo.score).toBeLessThan(0.2);
      scores.push(oracle.score);
      if (i === 0) expect(markdownScorecard(oracle)).toContain("100.0%");
    }
    expect(new Set(scores).size).toBe(1);
    expect(diffBaseline(1, 1).gate).toBe(true);
    expect(diffBaseline(0.9, 1).gate).toBe(false);
  });

  it("talks to an echo process over stdio JSONL", async () => {
    const shared = resolve(import.meta.dirname, "..");
    const agent = spawnAgent(`pnpm exec tsx src/agents/echoStdio.ts`, shared);
    const run = await runScenarios({
      agentName: "echo-stdio",
      module: "m0",
      scenarios: scenarios.slice(0, 1),
      agent,
    });
    await agent.close();
    expect(run.results[0]?.answer).toBe("What plan is Halcyon billed on?");
    expect(run.score).toBe(0);
  });

  it("grounds a context snapshot in the MCP call log", async () => {
    const world = new World(generateDataset());
    const mcp = await startMcp(world);
    try {
      const account = await mcpCall(mcp.baseUrl, "crm", "crm.get_account", { tenant: "halcyon", id: "acc_halcyon" });
      expect(account.plan).toBe("team");
      expect(account.seats).toBe(18);
      const hits = await mcpCall(mcp.baseUrl, "kb", "kb.search", { query: "route optimizer greyed out", k: 5 });
      const ids = Object.values(hits).filter((value) => typeof value === "object");
      expect(JSON.stringify(hits)).toContain("KB-031");
      expect(ids).toBeTruthy();
      const quote = await mcpCall(mcp.baseUrl, "catalog", "catalog.get_price", { sku: "route-optimizer", seats: 25 });
      expect(quote.priceVersion).toBe(7);
      world.advance(40 * 60 * 1000);
      const cart = world.addToCart("halcyon", "route-optimizer", 25);
      const checkout = world.checkout(cart.cartId, 7);
      expect(checkout.ok).toBe(false);
      expect(scoreToolTrace(["crm.get_account", "kb.search", "catalog.get_price"], mcp.log).pass).toBe(true);
      const grounded = scoreContextSnapshot(
        {
          answer: "team",
          contextSnapshot: [
            {
              id: "billing:acc_halcyon",
              source: "billing",
              tenant: "halcyon",
              sensitivity: "internal",
              fetchedAt: world.nowMs,
              trust: "trusted",
              tokens: 10,
              content: "plan team",
            },
          ],
        },
        [{ server: "billing", tool: "billing.get_subscription", args: {}, resultId: "billing:acc_halcyon", ok: true }],
      );
      expect(grounded.pass).toBe(true);
      const lying = scoreContextSnapshot(
        {
          answer: "team",
          contextSnapshot: [
            {
              id: "invented",
              source: "memory",
              tenant: "halcyon",
              sensitivity: "internal",
              fetchedAt: 0,
              trust: "untrusted",
              tokens: 1,
              content: "nope",
            },
          ],
        },
        mcp.log,
      );
      expect(lying.pass).toBe(false);
    } finally {
      await mcp.close();
    }
  });

  it("runs a stdio agent that can only read Fernhill through MCP", async () => {
    const world = new World(generateDataset());
    const mcp = await startMcp(world);
    const scenario: Scenario = {
      id: "lookup-1",
      module: "m0",
      session: "s1",
      principal: { tenant: "halcyon", role: "tier1", purpose: "support" },
      turns: [{ type: "user", text: "What plan is Halcyon billed on?" }],
      gold: { answer: "Billing plan: team. Billed seats: 18." },
    };
    const shared = resolve(import.meta.dirname, "..");
    const agent = spawnAgent("pnpm exec tsx src/agents/mcpLookup.ts", shared);
    try {
      const run = await runScenarios({
        agentName: "mcp-lookup",
        module: "m0",
        scenarios: [scenario],
        agent,
        mcpUrl: mcp.baseUrl,
        log: mcp.log,
        requireGrounded: true,
      });
      expect(run.score).toBe(1);
      expect(mcp.log.map((entry) => entry.tool)).toContain("billing.get_subscription");
    } finally {
      await agent.close();
      await mcp.close();
    }
  });

  it("calibrates the lexical judge against the 20 hand labels", () => {
    const report = judgeAgreement();
    expect(report.total).toBe(20);
    expect(report.rate).toBeGreaterThanOrEqual(0.85);
    expect(report.agree).toBeGreaterThanOrEqual(17);
    const repeats = Array.from({ length: 5 }, () => judgeAgreement().agree);
    expect(new Set(repeats).size).toBe(1);
  });
});
