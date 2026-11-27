import { createInterface } from "node:readline";

const lines = createInterface({ input: process.stdin });
for await (const line of lines) {
  const turn = JSON.parse(line) as { text?: string; type?: string };
  const reply = {
    answer: turn.type === "newSession" ? "" : (turn.text ?? ""),
    contextSnapshot: [],
    handoff: null,
  };
  process.stdout.write(`${JSON.stringify(reply)}\n`);
}
