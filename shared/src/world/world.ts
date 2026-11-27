import { priceAt, type Account, type Article, type Dataset, type Invoice, type Sku, type Technician, type Ticket } from "../fernhill/generate.js";
import { mrrCents } from "../fernhill/metrics.js";

export type MemoryRecord = {
  id: string;
  tenant: string;
  subject: string;
  claim: string;
  claimType: string;
  sourceTurn: string;
  createdAt: number;
  supersedes?: string;
  tombstone?: boolean;
};

export class World {
  readonly dataset: Dataset;
  nowMs: number;
  readonly accounts: Map<string, Account>;
  readonly tickets: Map<string, Ticket>;
  readonly articles: Article[];
  readonly skus: Sku[];
  readonly invoices: Invoice[];
  readonly technicians: Technician[];
  readonly carts = new Map<string, { sku: string; seats: number; priceVersion: number; tenant: string }>();
  readonly memory: MemoryRecord[] = [];
  readonly internalNotes: { ticketId: string; text: string; at: number }[] = [];
  readonly refunds: { accountId: string; amountUsd: number; at: number }[] = [];
  readonly emails: { to: string; subject: string; at: number }[] = [];
  readonly flags: { accountId: string; field: string; values: unknown; at: number }[] = [];
  private cartSeq = 1;

  constructor(dataset: Dataset) {
    this.dataset = dataset;
    this.nowMs = Date.parse(dataset.now);
    this.accounts = new Map(dataset.accounts.map((a) => [a.accountId, structuredClone(a)]));
    this.tickets = new Map(dataset.tickets.map((t) => [t.ticketId, t]));
    this.articles = dataset.articles;
    this.skus = dataset.skus;
    this.invoices = dataset.invoices;
    this.technicians = dataset.technicians;
  }

  get nowIso(): string {
    return new Date(this.nowMs).toISOString();
  }

  advance(ms: number) {
    this.nowMs += ms;
  }

  patch(collection: "accounts", id: string, fields: Record<string, unknown>) {
    const row = this.accounts.get(id);
    if (!row) throw new Error(`unknown account ${id}`);
    Object.assign(row, fields);
  }

  accountByTenant(tenant: string): Account | undefined {
    return [...this.accounts.values()].find((a) => a.tenant === tenant);
  }

  billingNow(account: Account) {
    const t = this.nowMs;
    let current = account.billing[0]!;
    for (const event of account.billing) {
      if (Date.parse(event.at) <= t) current = event;
    }
    return current;
  }

  customerView(account: Account) {
    const billing = this.billingNow(account);
    return {
      accountId: account.accountId,
      tenant: account.tenant,
      name: account.name,
      segment: account.segment,
      region: account.region,
      ownerEmail: account.ownerEmail,
      crmPlan: account.crmPlan,
      crmSeats: account.crmSeats,
      notes: account.notes,
      plan: billing.plan,
      seats: billing.seats,
      status: billing.status,
      addOns: billing.addOns,
      slaTier: account.slaTier,
      activeTechs: account.activeTechs,
      mrrCents: mrrCents(billing.plan, billing.seats, billing.status),
      conflict: account.crmPlan !== billing.plan || account.crmSeats !== billing.seats,
    };
  }

  searchKb(query: string, k: number) {
    const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
    const scored = this.articles.map((article) => {
      const hay = `${article.title} ${article.body}`.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (hay.includes(term) ? (article.title.toLowerCase().includes(term) ? 3 : 1) : 0), 0);
      return { article, score };
    });
    scored.sort((a, b) => b.score - a.score || (a.article.id < b.article.id ? -1 : 1));
    return scored.filter((s) => s.score > 0).slice(0, k).map((s) => s.article);
  }

  searchTickets(accountId: string, query: string) {
    const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
    return [...this.tickets.values()].filter((t) => {
      if (t.accountId !== accountId) return false;
      const hay = `${t.subject} ${t.body}`.toLowerCase();
      return terms.every((term) => hay.includes(term));
    });
  }

  quote(sku: string, seats: number) {
    return priceAt(this.dataset, sku, seats, this.nowIso);
  }

  addToCart(tenant: string, sku: string, seats: number) {
    const quote = this.quote(sku, seats);
    if (!quote) throw new Error(`unknown sku ${sku}`);
    const cartId = `cart_${this.cartSeq++}`;
    this.carts.set(cartId, { sku, seats, priceVersion: quote.priceVersion, tenant });
    return { cartId, ...quote };
  }

  checkout(cartId: string, expectedPriceVersion: number) {
    const cart = this.carts.get(cartId);
    if (!cart) return { ok: false, error: "unknown_cart" };
    const quote = this.quote(cart.sku, cart.seats);
    if (!quote || quote.priceVersion !== expectedPriceVersion) {
      return { ok: false, error: "price_conflict", priceVersion: quote?.priceVersion ?? null, priceCents: quote?.priceCents ?? null };
    }
    this.carts.delete(cartId);
    return { ok: true, priceVersion: quote.priceVersion, priceCents: quote.priceCents };
  }
}
