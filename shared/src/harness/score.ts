import type { AgentReply } from "../contract.js";
import type { CallLogEntry } from "../mcp/server.js";
import type { Scenario, ScoredCheck } from "./types.js";

export function scoreAnswer(scenario: Scenario, reply: AgentReply): ScoredCheck {
  const includes = scenario.gold.answerIncludes ?? [];
  const exact = reply.answer.trim() === scenario.gold.answer.trim();
  const covered = includes.every((part) => reply.answer.toLowerCase().includes(part.toLowerCase()));
  const pass = exact || (includes.length > 0 && covered);
  return {
    name: "answer",
    pass,
    detail: pass ? "answer matched gold" : `got ${JSON.stringify(reply.answer)}`,
  };
}

export function scoreToolTrace(required: string[], log: CallLogEntry[]): ScoredCheck {
  const names = new Set(log.map((entry) => entry.tool));
  const missing = required.filter((tool) => !names.has(tool));
  return {
    name: "tool-trace",
    pass: missing.length === 0,
    detail: missing.length === 0 ? "required tools were called" : `missing ${missing.join(", ")}`,
  };
}

export function scoreContextSnapshot(reply: AgentReply, log: CallLogEntry[]): ScoredCheck {
  const ids = new Set(log.map((entry) => entry.resultId).filter((id): id is string => !!id));
  const ungrounded = reply.contextSnapshot.filter((item) => !ids.has(item.id));
  return {
    name: "context-snapshot",
    pass: ungrounded.length === 0,
    detail: ungrounded.length === 0 ? "snapshot items came from the tool log" : `ungrounded ${ungrounded.map((i) => i.id).join(", ")}`,
  };
}

export function fractionPassed(checks: ScoredCheck[]): number {
  if (checks.length === 0) return 0;
  return checks.filter((c) => c.pass).length / checks.length;
}
