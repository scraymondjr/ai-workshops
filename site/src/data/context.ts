import type { WorkshopModule } from "./types";
import { contextRest } from "./context-rest";

const checkpoint = (fn: string) =>
  `Implement ${fn} in the TypeScript, Python, and Go starters. Until you do, \`pnpm test:learner\`, \`pytest -m learner\` in the Python starter, and \`go test -run TestM\` fail with LEARNER_TODO. The shared harness smoke suite stays green.`;

const contextHead: WorkshopModule[] = [
  {
    id: "m0",
    workshop: "context-engineering",
    title: "M0 · Eval harness and world simulator",
    phase: "Foundation",
    hours: "6 h",
    builds: "nothing; every later module plugs in here",
    scenario: "You change one line of the support agent's prompt. Did Fernhill's answers get better or worse, and for which tickets? Right now you can't tell.",
    problem: [
      "Context bugs are stateful: a fact goes stale after a clock jump, a memory leaks into the next session, another tenant's ticket slips into retrieval.",
      "The harness drives a simulated world (virtual clock, mutable data) and inspects what entered the context, not just the answer, for an agent written in any language or framework.",
    ],
    provided: [
      "shared/fernhill/seed: the Fernhill dataset plus a seeded generator",
      "WorldSim: in-memory store, virtual clock, patch() and advance()",
      "Mock MCP servers (CRM, billing, tickets, catalog, KB, plus ops and mail) that log every call",
      "Reference agents: oracle (always right) and echo (always wrong)",
    ],
    build: [
      "The agent-side adapter in your language: read a turn, run your agent, return the reply. A working echo adapter ships so the contract is real.",
      "Three deterministic scorer families: answer checks, tool-trace assertions, context-snapshot assertions. The harness includes a first version.",
      "An LLM judge with a written rubric, calibrated against 20 answers labeled by hand. CI uses the lexical stand-in so it spends nothing.",
      "Reporters: JSONL per run, a Markdown scorecard, a baseline diff for CI.",
    ],
    tools: ["Tool calls are logged by the harness MCP servers, so the trace can't be misreported by the agent"],
    code: {
      ts: `type Turn =\n  | { type: "user"; text: string }\n  | { type: "newSession" };\n\ninterface ContextItem {\n  id: string; source: "crm" | "billing" | "tickets" | "catalog" | "kb" | "memory";\n  tenant: string; sensitivity: "public" | "internal" | "pii";\n  fetchedAt: number; ttlMs?: number; trust: "trusted" | "untrusted";\n  tokens: number; content: string;\n}\n\ninterface AgentReply {\n  answer: string;\n  contextSnapshot: ContextItem[];\n  handoff?: HandoffPacket;\n}`,
      py: `class ContextItem(CamelModel):\n    id: str\n    source: Literal["crm", "billing", "tickets", "catalog", "kb", "memory"]\n    tenant: str\n    sensitivity: Literal["public", "internal", "pii"]\n    fetched_at: int\n    ttl_ms: int | None = None\n    trust: Literal["trusted", "untrusted"]\n    tokens: int\n    content: str`,
      go: `type ContextItem struct {\n    ID string\n    Source string // crm|billing|tickets|catalog|kb|memory\n    Tenant string\n    Sensitivity string // public|internal|pii\n    FetchedAt int64\n    TTLms *int64\n    Trust string\n    Tokens int\n    Content string\n}`,
    },
    libs: {
      ts: "@modelcontextprotocol/sdk client; zod for the wire types. This repo validates the wire with zod and speaks a small MCP JSON-RPC subset.",
      py: "mcp client; pydantic. The starter uses dataclasses and the stdlib so the smoke test needs no extra packages.",
      go: "github.com/modelcontextprotocol/go-sdk/mcp; encoding/json. The starter's adapter is stdlib-only.",
    },
    criteria: [
      "pnpm ws eval --module m0 --agent-builtin oracle|echo runs the smoke suite",
      "Deterministic scores are identical across 5 repeats with the same seed",
      "oracle scores 100% and echo under 20%",
      "The judge agrees with the 20 hand labels on at least 17 (85%)",
      "CI passes on a PR using replayed fixtures (no model spend)",
    ],
    evals: [
      ["Smoke suite (8 cases)", "Deterministic", "oracle / echo score", "100% / under 20%"],
      ["Repeat 5x", "Deterministic", "Score variance", "0"],
      ["20 hand-labeled answers", "Judge vs labels", "Agreement", "85% or more"],
      ["Judge repeat 5x", "Judge", "Pass/fail flips", "Reported, under 10%"],
    ],
    tracks: {
      vercel: ["Wrap a ToolLoopAgent in the stdio adapter. MockLanguageModelV4 from ai/test for unit tests. OpenTelemetry via @ai-sdk/otel.", "No eval framework: the shared harness is the eval layer."],
      adk: ["adk eval evalsets with tool_trajectory_avg_score, response_match_score, final_response_match_v2, and rubric criteria.", "adk eval is Python-only. Use it beside the shared harness, not instead of it."],
      claude: ["Make a Grader project: rubric in project instructions plus a scoring prompt. Score 5 sample answers yourself, then let Claude score them.", "Rubric: the grader agrees with you on at least 4 of 5."],
    },
    stretch: ["Export traces to Langfuse (Hobby tier)", "Run the Python starter through an Inspect adapter and compare reports"],
    sotaNote: "Current practice: grade outcomes and transcripts separately, start from real failures, and calibrate LLM judges against human labels before trusting them.",
    links: [
      { title: "Demystifying evals for AI agents", site: "Anthropic Engineering", href: "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents" },
      { title: "Evaluating the effectiveness of LLM-evaluators", site: "eugeneyan.com", href: "https://eugeneyan.com/writing/llm-evaluators/" },
    ],
    diagram: `flowchart LR\n  sc["Scenario JSON"] --> run["Harness runner"]\n  run -->|"stdio JSONL or HTTP"| ag["Agent under test"]\n  ag -->|MCP| mcp["Mock MCP servers"]\n  mcp --> world["WorldSim"]\n  run -.-> world\n  ag -.-> run\n  run --> sco["Scorers"]\n  sco --> rep["Scorecard"]`,
    checkpoint: "Run pnpm ws eval --module m0 --agent-builtin oracle and the same command with echo. This module's harness is provided. Later modules are the failing exercises.",
  },
  {
    id: "m1",
    workshop: "context-engineering",
    title: "M1 · RAG and context engineering",
    phase: "Context basics",
    hours: "5 h",
    builds: "M0",
    scenario: "Ticket T-1042 from Halcyon: \"We're billed for 25 seats but only have 18 techs, and Route Optimizer is greyed out.\" The support agent needs the customer's plan, seats, add-ons and SLA tier, plus the right KB articles, before it answers.",
    problem: [
      "The naive baseline stuffs the whole CRM record, every invoice and 10 KB chunks into the prompt: expensive and often wrong.",
      "Goal: a compact, structured customer card as base context plus targeted retrieval, with citations.",
    ],
    provided: ["mcp-crm, mcp-billing, mcp-kb", "80 KB articles in the seed, including KB-031 and two outdated articles", "25 tickets is the design target; the seed marks 7 Halcyon tickets relevant to Route Optimizer, with gold KB ids", "A naive stuff-everything baseline is the thing you measure against"],
    build: ["A typed, size-capped customer card from CRM and billing", "Hybrid retrieval: keyword plus vector, then rerank (bge-reranker-base)", "Answers with KB citations like [KB-031]", "Token accounting per context block"],
    tools: ["crm.get_account(id)", "billing.get_subscription(accountId)", "kb.search(query, k)"],
    code: {
      ts: `type CustomerCard = {\n  accountId: string; plan: "starter" | "team" | "business";\n  seats: { billed: number; active: number }; addOns: string[];\n  slaTier: "standard" | "priority"; region: string;\n};`,
      py: `class CustomerCard(CamelModel):\n    account_id: str\n    plan: Literal["starter", "team", "business"]\n    seats_billed: int\n    seats_active: int\n    add_ons: list[str]\n    sla_tier: Literal["standard", "priority"]\n    region: str`,
      go: `type CustomerCard struct {\n    AccountID string\n    Plan string\n    SeatsBilled int\n    SeatsActive int\n    AddOns []string\n    SLATier string\n    Region string\n}`,
    },
    libs: {
      ts: "Workers AI binding or an OpenAI-compatible endpoint for embeddings. Vectorize in wrangler dev.",
      py: "openai client against Workers AI or Ollama /v1/embeddings.",
      go: "openai-go against the same endpoints. Vectorize via REST.",
    },
    criteria: ["Customer card always includes plan, billed seats, active seats and add-ons", "Every account claim matches the gold facts", "Each answer cites at least one gold KB article", "Median context at or under 6k tokens"],
    evals: [
      ["25 gold tickets", "Deterministic", "KB recall@5", "0.90"],
      ["25 gold tickets", "Deterministic", "Account-fact accuracy", "0.90"],
      ["25 gold tickets", "Deterministic", "Citation precision", "0.80"],
      ["25 gold tickets", "Judge (1–5 rubric)", "Groundedness", "Mean 4.0"],
      ["All", "Deterministic", "Median context tokens", "6k or less"],
    ],
    tracks: {
      vercel: ["Tools for CRM, billing, and KB. embed and embedMany with workers-ai-provider or the Ollama provider. MCP tools via @ai-sdk/mcp.", "Retrieval, rerank, and the customer card are yours."],
      adk: ["McpToolset for the Fernhill servers. ADK assembles session, tool outputs, and artifacts into context.", "Retrieval and rerank are yours. Managed RAG memory is a Google Cloud service, not on the $0 path."],
      claude: ["Create a Fernhill Support project. Instructions plus KB articles and a customer-card file as project knowledge. Ask T-1042 there and in a plain chat.", "Rubric: right KB article named, plan and seats correct, nothing invented. The project beats plain chat."],
    },
    stretch: ["Contextual retrieval: prepend chunk context before embedding and measure the recall change", "Expose the customer card as an MCP resource rather than a tool"],
    sotaNote: "The field has moved from retrieve-more to curating the smallest high-signal context. Prepending context to chunks before indexing is a documented recall gain.",
    links: [
      { title: "Effective context engineering for AI agents", site: "Anthropic Engineering", href: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" },
      { title: "Contextual retrieval", site: "Anthropic", href: "https://www.anthropic.com/news/contextual-retrieval" },
    ],
    checkpoint: checkpoint("buildCustomerCard"),
  },
  {
    id: "m2",
    workshop: "context-engineering",
    title: "M2 · Expiring facts: re-fetch vs trust the cache",
    phase: "Context basics",
    hours: "4 h",
    builds: "M0, M1",
    scenario: "Halcyon's admin asks Fernhill's in-app shopping agent for Route Optimizer for 25 seats. The agent quotes the promo price. The admin steps away for 40 minutes, the promo ends at minute 30, then the admin says \"OK, buy it.\"",
    problem: [
      "The quoted price is still in context, now wrong. Checking out at it is a real bug.",
      "Facts decay at different rates: price (minutes), ticket status (hours), plan tier (days), company name (rarely).",
    ],
    provided: ["mcp-catalog with a priceVersion per SKU and a promo that ends at 15:30 UTC on 26 Nov 2026", "Virtual clock so a scenario can jump 40 minutes", "checkout that rejects a stale expectedPriceVersion with a conflict error"],
    build: ["A fact store with value, fetchedAt, and TTL by fact type", "shouldRefetch(fact, action): reads may use a fresh cache; commits always revalidate", "A re-quote when the price changed (old and new price, ask to confirm)", "Handling of the checkout conflict as a backstop"],
    tools: ["catalog.get_price(sku, seats)", "catalog.add_to_cart", "catalog.checkout(cartId, expectedPriceVersion)"],
    code: {
      ts: `const TTL_MS = {\n  price: 15 * 60_000,\n  ticket_status: 60 * 60_000,\n  plan: 24 * 3_600_000,\n  company: 30 * 86_400_000,\n};\ntype Action = "answer" | "quote" | "commit";\nfunction shouldRefetch(f: Fact, a: Action, now: number): boolean;`,
      py: `TTL_MS = {"price": 15 * 60_000, "ticket_status": 60 * 60_000, "plan": 24 * 3_600_000, "company": 30 * 86_400_000}\n\ndef should_refetch(f: Fact, a: Action, now_ms: int) -> bool: ...`,
      go: `var TTL = map[string]time.Duration{\n    "price": 15 * time.Minute,\n    "ticket_status": time.Hour,\n    "plan": 24 * time.Hour,\n    "company": 30 * 24 * time.Hour,\n}\nfunc ShouldRefetch(f Fact, a Action, now time.Time) bool`,
    },
    libs: {
      ts: "MCP client resource subscriptions for the push-invalidation stretch.",
      py: "mcp client session. Store facts in SQLite.",
      go: "go-sdk/mcp client. time for TTLs.",
    },
    criteria: ["No checkout ever completes at a stale price", "A changed price is disclosed (both prices) before buying", "Within TTL, plain questions don't trigger a re-fetch", "If nothing changed, the agent completes without nagging"],
    evals: [
      ["Price changes during the gap (5)", "Tool trace", "Stale-commit rate", "0 (hard gate)"],
      ["Price changes during the gap (5)", "Both prices, plus judge", "Change disclosed", "95%"],
      ["No change during the gap (4)", "Deterministic", "Completed without extra confirmation", "90%"],
      ["Change after checkout (2)", "Deterministic", "No spurious refund or re-order", "100%"],
      ["Idle then unrelated question (4)", "Deterministic", "Unnecessary re-fetch rate", "20% or less"],
    ],
    tracks: {
      vercel: ["Tools plus toolApproval on checkout. MCP events in @ai-sdk/mcp for the push stretch.", "The fact store and TTL policy are yours."],
      adk: ["Session state holds facts with timestamps. A before-tool callback enforces the refresh policy.", "TTL semantics are yours."],
      claude: ["Install the Fernhill desktop extension. Ask the price, call advance_clock for 40 minutes, then say buy. Repeat after a project instruction to re-check prices before buying.", "Rubric: price re-checked before buying; old and new prices stated."],
    },
    stretch: ["Push invalidation via MCP resource subscriptions or MCP Events instead of TTL polling", "Expire the quote with a Durable Object alarm"],
    sotaNote: "MCP supports resource subscriptions with update notifications, and MCP Events (beta) lets servers push changes, so invalidation can move from guessed TTLs to the protocol.",
    links: [
      { title: "MCP spec: Resources", site: "modelcontextprotocol.io", href: "https://modelcontextprotocol.io/specification/2025-06-18/server/resources" },
      { title: "Two years of MCP (Events beta)", site: "MCP Blog", href: "https://blog.modelcontextprotocol.io/posts/mcp-turns-two/" },
    ],
    diagram: `flowchart TD\n  ask["Admin asks price"] --> get["get_price to v7"]\n  get --> idle["40 min idle. Promo ends. Now v8"]\n  idle --> buy["OK, buy it"]\n  buy --> stale{"Commit and fact older than TTL?"}\n  stale -->|yes| refetch["Re-fetch to v8"]\n  stale -.->|no| co["checkout expected version"]\n  refetch --> changed{"Price changed?"}\n  changed -->|yes| confirm["Re-quote and ask to confirm"]\n  changed -->|no| co\n  confirm --> co`,
    checkpoint: checkpoint("shouldRefetch. Commits always revalidate. Other actions re-fetch only when now - fetchedAt >= ttl."),
  },
];

export const contextModules: WorkshopModule[] = [...contextHead, ...contextRest];
