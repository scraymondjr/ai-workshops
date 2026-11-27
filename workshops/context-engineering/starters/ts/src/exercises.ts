/**
 * Learner exercises for M1–M8. Each function throws until you implement it.
 * Rules for the checks live in workshops/context-engineering/fixtures/checks.json
 * and on the teaching site.
 */

export type FactType = "price" | "ticket_status" | "plan" | "company";
export type Action = "answer" | "quote" | "commit";
export type Decision = "allow" | "needs_approval" | "deny";

export type CustomerCard = {
  accountId: string;
  plan: "starter" | "team" | "business";
  seats: { billed: number; active: number };
  addOns: string[];
  slaTier: "standard" | "priority";
  region: string;
};

export type MemoryRecord = {
  id: string;
  tenant: string;
  subject: string;
  claim: string;
  claimType: string;
  sourceTurn: string;
  supersedes?: string;
};

export class NotImplementedError extends Error {
  constructor(what: string) {
    super(`LEARNER_TODO: implement ${what}`);
    this.name = "NotImplementedError";
  }
}

export function buildCustomerCard(_input: {
  accountId: string;
  region: string;
  crm: { plan: string; seats: number };
  billing: { plan: string; seats: number; addOns: string[]; slaTier: "standard" | "priority" };
  activeTechs: number;
}): CustomerCard {
  throw new NotImplementedError("buildCustomerCard");
}

export function shouldRefetch(
  _fact: { factType: FactType; fetchedAt: number; ttlMs: number },
  _action: Action,
  _now: number,
): boolean {
  throw new NotImplementedError("shouldRefetch");
}

export function applyMemory(
  _writes: MemoryRecord[],
  _forget: { subject: string; claimType: string } | null,
): { active: MemoryRecord[]; tombstones: { subject: string; claimType: string }[] } {
  throw new NotImplementedError("applyMemory");
}

export function resolveField(
  _field: string,
  _obs: { source: string; value: unknown }[],
): { value: unknown; conflict: boolean } {
  throw new NotImplementedError("resolveField");
}

export function selectTickets(
  _tickets: { id: string; text: string }[],
  _query: string,
  _budget: number,
): { verbatim: { id: string; text: string }[]; tokens: number } {
  throw new NotImplementedError("selectTickets");
}

export function admit(
  _item: { id: string; tenant: string; sensitivity: "public" | "internal" | "pii"; content: string },
  _who: { tenant: string; role: "tier1" | "billing" | "admin" },
): { id: string; tenant: string; sensitivity: string; content: string } | null {
  throw new NotImplementedError("admit");
}

export function checkToolPolicy(_call: {
  tool: string;
  provenance: string[];
  to?: string | null;
  verified?: string[];
}): Decision {
  throw new NotImplementedError("checkToolPolicy");
}

export function reviewHandoff(
  _packet: {
    facts: { key: string; fetchedAt: number; ttlMs: number }[];
    untrustedSpans: string[];
    summary: string;
  },
  _now: number,
): { refetch: string[]; keep: string[]; carriesUntrusted: boolean; summaryTokens: number } {
  throw new NotImplementedError("reviewHandoff");
}
