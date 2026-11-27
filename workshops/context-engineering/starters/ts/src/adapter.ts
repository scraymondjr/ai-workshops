import { createInterface } from "node:readline";

/** Working stdio adapter. The harness never imports your agent; it only speaks this protocol. */
export type Turn = {
  type: "turn" | "user" | "newSession";
  scenarioId: string;
  session: string;
  text?: string;
  mcpUrl?: string;
  principal?: { tenant: string; role: string; purpose?: string };
  now?: number;
};

export type Reply = {
  answer: string;
  contextSnapshot: unknown[];
  handoff: unknown;
};

export function echoReply(turn: Turn): Reply {
  return {
    answer: turn.type === "newSession" ? "" : (turn.text ?? ""),
    contextSnapshot: [],
    handoff: null,
  };
}

async function main() {
  const lines = createInterface({ input: process.stdin });
  for await (const line of lines) {
    const reply = echoReply(JSON.parse(line) as Turn);
    process.stdout.write(`${JSON.stringify(reply)}\n`);
  }
}

if (process.argv[1]?.endsWith("adapter.ts")) {
  main();
}
