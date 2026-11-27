import { z } from "zod";

/** Wire types shared by every starter. JSON is camelCase. */

export const sources = ["crm", "billing", "tickets", "catalog", "kb", "memory"] as const;
export const sensitivities = ["public", "internal", "pii"] as const;
export const trusts = ["trusted", "untrusted"] as const;
export const roles = ["tier1", "billing", "admin"] as const;

export const contextItemSchema = z.object({
  id: z.string(),
  source: z.enum(sources),
  tenant: z.string(),
  sensitivity: z.enum(sensitivities),
  fetchedAt: z.number(),
  ttlMs: z.number().optional(),
  trust: z.enum(trusts),
  tokens: z.number(),
  content: z.string(),
});

export const principalSchema = z.object({
  tenant: z.string(),
  role: z.enum(roles),
  purpose: z.string().default("support"),
});

export const handoffFactSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  source: z.string(),
  fetchedAt: z.number(),
  ttlMs: z.number(),
});

export const handoffPacketSchema = z.object({
  ticketId: z.string(),
  tenant: z.string(),
  intent: z.string(),
  facts: z.array(handoffFactSchema),
  openQuestions: z.array(z.string()),
  untrustedSpans: z.array(z.string()),
  scope: z.object({
    tools: z.array(z.string()),
    maxCreditUsd: z.number(),
  }),
  summary: z.string(),
});

export const agentReplySchema = z.object({
  answer: z.string(),
  contextSnapshot: z.array(contextItemSchema),
  handoff: handoffPacketSchema.nullable().optional(),
});

export const wireTurnSchema = z.object({
  type: z.enum(["turn", "user", "newSession"]),
  scenarioId: z.string(),
  session: z.string(),
  text: z.string().optional(),
  mcpUrl: z.string().optional(),
  principal: principalSchema.optional(),
  now: z.number().optional(),
});

export type ContextItem = z.infer<typeof contextItemSchema>;
export type Principal = z.infer<typeof principalSchema>;
export type HandoffPacket = z.infer<typeof handoffPacketSchema>;
export type AgentReply = z.infer<typeof agentReplySchema>;
export type WireTurn = z.infer<typeof wireTurnSchema>;

export class NotImplementedError extends Error {
  constructor(message = "LEARNER_TODO") {
    super(message);
    this.name = "NotImplementedError";
  }
}

export function notImplemented(what: string): never {
  throw new NotImplementedError(`LEARNER_TODO: implement ${what}`);
}
