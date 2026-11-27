import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import {
  admit,
  applyMemory,
  buildCustomerCard,
  checkToolPolicy,
  reviewHandoff,
  resolveField,
  selectTickets,
  shouldRefetch,
} from "./src/exercises.js";

const checks = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../fixtures/checks.json"), "utf8"),
);

it("M1 customer card uses billing for plan and seats", () => {
  const card = buildCustomerCard(checks.m1);
  expect(card.plan).toBe(checks.m1.expect.plan);
  expect(card.seats.billed).toBe(checks.m1.expect.billed);
  expect(card.seats.active).toBe(checks.m1.expect.active);
  expect(card.addOns).toEqual(checks.m1.expect.addOns);
  expect(card.region).toBe("us-east");
});

it("M2 shouldRefetch follows TTL and always revalidates commits", () => {
  for (const row of checks.m2) {
    expect(shouldRefetch(row, row.action, row.now), row.name).toBe(row.expect);
  }
});

it("M3 supersede keeps 28 and forget removes the mobile number", () => {
  const state = applyMemory(checks.m3.writes, checks.m3.forget);
  const claims = state.active.map((record: { claim: string }) => record.claim);
  for (const claim of checks.m3.expectClaims) expect(claims).toContain(claim);
  for (const claim of checks.m3.absent) {
    expect(claims).not.toContain(claim);
    expect(JSON.stringify(state.active)).not.toContain(claim);
  }
  expect(state.tombstones).toEqual([checks.m3.forget]);
});

it("M4 resolve uses the authority matrix and does not treat a note as a discount", () => {
  for (const row of checks.m4) {
    const got = resolveField(row.field, row.obs);
    expect(got.value, row.name).toEqual(row.value);
    expect(got.conflict, row.name).toBe(row.conflict);
  }
});

it("M5 selection keeps the old fix inside the token budget", () => {
  const got = selectTickets(checks.m5.tickets, "Route Optimizer greyed out", checks.m5.budget);
  expect(got.tokens).toBeLessThanOrEqual(checks.m5.budget);
  expect(got.verbatim.map((ticket: { id: string }) => ticket.id)).toContain(checks.m5.needleId);
  const chars = got.verbatim.map((ticket: { text: string }) => ticket.text).join("").length;
  expect(got.tokens).toBe(Math.ceil(chars / 4));
});

it("M6 admit enforces tenant and role before context", () => {
  for (const row of checks.m6) {
    const got = admit(row.item, row.who);
    expect(got !== null, row.name).toBe(row.keep);
    if (got) expect(got.content).not.toContain("CANARY_");
  }
});

it("M7 tool policy blocks untrusted refunds and off-list email", () => {
  for (const row of checks.m7) {
    expect(checkToolPolicy(row), row.name).toBe(row.expect);
  }
});

it("M8 handoff refetches expired facts and keeps untrusted spans labeled", () => {
  const got = reviewHandoff(checks.m8.packet, checks.m8.now);
  expect(got.refetch).toEqual(checks.m8.expectRefetch);
  expect(got.keep).toEqual(checks.m8.expectKeep);
  expect(got.carriesUntrusted).toBe(true);
  expect(got.summaryTokens).toBeLessThanOrEqual(checks.m8.maxSummaryTokens);
});
