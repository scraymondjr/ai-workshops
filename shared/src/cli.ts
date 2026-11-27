import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { canonical } from "./canonical.js";
import { generateDataset, writeDrops, writeSeed } from "./fernhill/generate.js";
import { builtinAgent, runScenarios, spawnAgent } from "./harness/run.js";
import { diffBaseline, markdownScorecard } from "./harness/reporters.js";
import { judgeAgreement } from "./harness/judge.js";
import { startMcp } from "./mcp/server.js";
import { World } from "./world/world.js";
import type { Scenario } from "./harness/types.js";

const repoRoot = resolve(import.meta.dirname, "../..");

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function has(name: string): boolean {
  return process.argv.includes(name);
}

function loadScenarios(moduleId: string): Scenario[] {
  const file = resolve(repoRoot, "workshops/context-engineering/scenarios", `${moduleId}.json`);
  return JSON.parse(readFileSync(file, "utf8")) as Scenario[];
}

async function evalCommand() {
  const moduleId = flag("--module") ?? "m0";
  const repeat = Number(flag("--repeat") ?? 1);
  const scenarios = loadScenarios(moduleId);
  const scores: number[] = [];
  let lastMarkdown = "";
  for (let i = 0; i < repeat; i++) {
    const builtin = flag("--agent-builtin");
    const command = flag("--agent");
    const agent = builtin
      ? builtinAgent(builtin as "oracle" | "echo", scenarios)
      : spawnAgent(command ?? "echo", flag("--cwd"));
    const run = await runScenarios({
      agentName: builtin ?? command ?? "agent",
      module: moduleId,
      scenarios,
      agent,
    });
    await agent.close();
    scores.push(run.score);
    lastMarkdown = markdownScorecard(run);
    if (i === 0 && has("--out")) writeFileSync(flag("--out")!, canonical(run) + "\n");
  }
  const varied = new Set(scores).size;
  console.log(lastMarkdown);
  console.log(`repeats ${repeat}, distinct scores ${varied}`);
  if (has("--baseline")) {
    const baseline = JSON.parse(readFileSync(flag("--baseline")!, "utf8")) as { score: number };
    const gate = diffBaseline(scores[0]!, baseline.score);
    console.log(`baseline gate ${gate.gate ? "pass" : "fail"} (drop ${gate.dropPoints.toFixed(2)} points)`);
    if (!gate.gate) process.exitCode = 1;
  }
}

async function main() {
  const command = process.argv[2];
  if (command === "generate") {
    const dataset = generateDataset();
    const out = resolve(flag("--out") ?? resolve(import.meta.dirname, "../fernhill/seed"));
    const manifest = writeSeed(out, dataset);
    console.log(`wrote seed to ${out}`);
    console.log(canonical(manifest));
    if (flag("--drops")) {
      const landing = resolve(flag("--landing") ?? resolve(repoRoot, "workshops/data-engineering/landing"));
      const report = writeDrops(landing, dataset);
      console.log(`wrote ${report.files} drop files across ${report.days} days to ${landing}`);
    }
    return;
  }
  if (command === "eval") {
    await evalCommand();
    return;
  }
  if (command === "judge") {
    const report = judgeAgreement();
    console.log(`agreement ${report.agree}/${report.total} (${(report.rate * 100).toFixed(1)}%) misses ${report.misses.join(", ") || "none"}`);
    if (report.rate < 0.85) process.exitCode = 1;
    return;
  }
  if (command === "mcp") {
    const world = new World(generateDataset());
    const mcp = await startMcp(world, Number(flag("--port") ?? 8790));
    console.log(mcp.baseUrl);
    await new Promise(() => {});
    return;
  }
  if (command === "score") {
    const file = process.argv[3];
    if (!file) throw new Error("usage: ws score run.json");
    const run = JSON.parse(readFileSync(file, "utf8"));
    console.log(markdownScorecard(run));
    return;
  }
  console.log(`Fernhill workshop CLI

  pnpm ws generate [--out dir] [--drops 90 --landing dir]
  pnpm ws eval --module m0 --agent-builtin oracle|echo [--repeat 5]
  pnpm ws eval --module m0 --agent "node ..."
  pnpm ws judge
  pnpm ws mcp [--port 8790]
  pnpm ws score run.json
`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
