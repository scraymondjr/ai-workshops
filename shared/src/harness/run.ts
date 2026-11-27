import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { agentReplySchema, type AgentReply, type WireTurn } from "../contract.js";
import type { CallLogEntry } from "../mcp/server.js";
import { scoreAnswer, scoreContextSnapshot } from "./score.js";
import type { RunRecord, Scenario, ScenarioResult } from "./types.js";

export interface AgentProcess {
  ask(turn: WireTurn): Promise<AgentReply>;
  close(): Promise<void>;
}

export function builtinAgent(kind: "oracle" | "echo", scenarios: Scenario[]): AgentProcess {
  const byId = new Map(scenarios.map((s) => [s.id, s]));
  return {
    async ask(turn) {
      if (turn.type === "newSession") return { answer: "", contextSnapshot: [], handoff: null };
      if (kind === "echo") return { answer: turn.text ?? "", contextSnapshot: [], handoff: null };
      const scenario = byId.get(turn.scenarioId);
      return { answer: scenario?.gold.answer ?? "", contextSnapshot: [], handoff: null };
    },
    async close() {},
  };
}

export function spawnAgent(command: string, cwd?: string): AgentProcess {
  const child = spawn(command, { shell: true, cwd, stdio: ["pipe", "pipe", "inherit"] });
  const lines = createInterface({ input: child.stdout! });
  const pending: ((line: string) => void)[] = [];
  const buffered: string[] = [];
  lines.on("line", (line) => {
    const wait = pending.shift();
    if (wait) wait(line);
    else buffered.push(line);
  });
  return {
    ask(turn) {
      child.stdin!.write(`${JSON.stringify(turn)}\n`);
      const next = buffered.shift();
      if (next) return Promise.resolve(agentReplySchema.parse(JSON.parse(next)));
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("agent timed out")), 15000);
        pending.push((line) => {
          clearTimeout(timer);
          resolve(agentReplySchema.parse(JSON.parse(line)));
        });
      });
    },
    async close() {
      child.stdin!.end();
      await new Promise<void>((resolve) => child.once("exit", () => resolve()));
    },
  };
}

export async function runScenarios(options: {
  agentName: string;
  module: string;
  scenarios: Scenario[];
  agent: AgentProcess;
  mcpUrl?: string;
  log?: CallLogEntry[];
  requireGrounded?: boolean;
}): Promise<RunRecord> {
  const results: ScenarioResult[] = [];
  const replies: RunRecord["replies"] = [];
  for (const scenario of options.scenarios) {
    let session = scenario.session;
    let answer = "";
    let last: AgentReply = { answer: "", contextSnapshot: [] };
    for (const turn of scenario.turns) {
      if (turn.type === "newSession") session = `${session}-next`;
      const wire: WireTurn = {
        type: turn.type === "newSession" ? "newSession" : "turn",
        scenarioId: scenario.id,
        session,
        text: turn.type === "user" ? turn.text : undefined,
        mcpUrl: options.mcpUrl,
        principal: scenario.principal,
        now: Date.parse("2026-11-26T15:00:00.000Z") + (turn.advanceMs ?? 0),
      };
      last = await options.agent.ask(wire);
      if (turn.type === "user") answer = last.answer;
    }
    const checks = [scoreAnswer(scenario, last)];
    if (options.requireGrounded) checks.push(scoreContextSnapshot(last, options.log ?? []));
    results.push({
      scenarioId: scenario.id,
      module: scenario.module,
      answer,
      checks,
      pass: checks.every((c) => c.pass),
    });
    replies.push({ scenarioId: scenario.id, reply: last });
  }
  const score = results.length === 0 ? 0 : results.filter((r) => r.pass).length / results.length;
  return { agent: options.agentName, module: options.module, seed: 20261126, results, score, replies };
}
