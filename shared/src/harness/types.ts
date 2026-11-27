import type { AgentReply, Principal } from "../contract.js";

export type ScenarioTurn =
  | { type: "user"; text: string; advanceMs?: number }
  | { type: "newSession"; advanceMs?: number };

export type Scenario = {
  id: string;
  module: string;
  session: string;
  principal: Principal;
  turns: ScenarioTurn[];
  gold: {
    answer: string;
    answerIncludes?: string[];
  };
};

export type ScoredCheck = {
  name: string;
  pass: boolean;
  detail: string;
};

export type ScenarioResult = {
  scenarioId: string;
  module: string;
  answer: string;
  checks: ScoredCheck[];
  pass: boolean;
};

export type RunRecord = {
  agent: string;
  module: string;
  seed: number;
  results: ScenarioResult[];
  score: number;
  replies: { scenarioId: string; reply: AgentReply }[];
};
