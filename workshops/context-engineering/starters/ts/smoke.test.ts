import { expect, it } from "vitest";
import { echoReply } from "./src/adapter.js";

it("echoes a turn on the stdio contract", () => {
  const reply = echoReply({
    type: "turn",
    scenarioId: "m0-01",
    session: "s1",
    text: "hello",
  });
  expect(reply.answer).toBe("hello");
  expect(reply.handoff).toBeNull();
});
