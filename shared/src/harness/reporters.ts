import type { RunRecord } from "./types.js";

export function markdownScorecard(run: RunRecord): string {
  const lines = [
    `# Fernhill scorecard`,
    ``,
    `- Agent: ${run.agent}`,
    `- Module: ${run.module}`,
    `- Score: ${(run.score * 100).toFixed(1)}%`,
    `- Cases: ${run.results.length}`,
    ``,
    `| Scenario | Pass | Detail |`,
    `| --- | --- | --- |`,
  ];
  for (const result of run.results) {
    const detail = result.checks.map((c) => `${c.name}: ${c.detail}`).join("; ");
    lines.push(`| ${result.scenarioId} | ${result.pass ? "yes" : "no"} | ${detail.replaceAll("|", "/")} |`);
  }
  lines.push("");
  return lines.join("\n");
}

export function diffBaseline(current: number, baseline: number) {
  const drop = (baseline - current) * 100;
  return {
    baseline,
    current,
    dropPoints: drop,
    gate: drop <= 5,
  };
}
