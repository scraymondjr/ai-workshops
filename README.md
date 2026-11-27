# Fernhill workshops

Hands-on workshops for engineers who have to make an AI agent answer from company data. One monorepo, one fictional SaaS dataset, one eval harness. Local-first. Open models. **$0 by default** (Ollama or Workers AI, DuckDB, `wrangler dev`).

Fernhill schedules field-service work. Plans are Starter, Team, and Business. The seed has 60 accounts, 180 invoices, 2,400 tickets (400 of them for the customer Halcyon), 30 SKUs, and 80 knowledge-base articles. Halcyon is a field-service customer. The earlier design said "Halcyon Dental Group"; this repo keeps the name and drops the clinical framing.

Two workshops are teachable. Three are reserved folders.

| Workshop | Status |
| --- | --- |
| [Metrics, not SQL](workshops/data-engineering/) | D0–D9, game day, capstone |
| [Context, memory, safety, evals](workshops/context-engineering/) | M0–M8, three languages, three tracks |
| Production-grade agents | Stub |
| Dynamic UI and MCP apps | Stub |
| Evals and fine-tuning | Stub |

## Setup

One command, from a clone:

```bash
./setup.sh
```

That installs the Node workspace, a Python virtualenv (`pytest`, `duckdb`, `PyYAML`), and writes `shared/fernhill/seed/`. You need Node 22, pnpm 9, Python 3.12, and Go 1.22. The script does not install dbt, Dagster, MetricFlow, Elementary, or Ollama.

Then:

```bash
pnpm test:smoke
pnpm ws eval --module m0 --agent-builtin oracle
pnpm ws eval --module m0 --agent-builtin echo
pnpm site:build
```

`pnpm test:smoke` runs the harness and also checks that the learner exercises still fail with `LEARNER_TODO`. That is the starter. After you solve an exercise, that check fails until the solution stays off `main`.

Learner checks, which fail on a fresh clone:

```bash
pnpm test:learner
.venv/bin/python -m pytest workshops/data-engineering -m learner -q
.venv/bin/python -m pytest workshops/context-engineering/starters/python -m learner -q
cd workshops/context-engineering/starters/go && go test -run TestM
```

Regenerate the dataset:

```bash
pnpm ws generate
pnpm ws generate --drops 90 --landing workshops/data-engineering/landing
```

Data scorecard, including the delta after a module:

```bash
cd workshops/data-engineering
../../.venv/bin/python -m evals.score_module --module d0
```

The checked-in naive baseline is 2 of 40 correct, confidently-wrong rate 0.95. It does not call a model.

## Layout

```
shared/                         TypeScript harness, Fernhill generator, mock MCP
  src/fernhill/                 generator, golden metrics, scorecard formula
  src/world/                    clock, patch, advance
  src/mcp/                      CRM, billing, tickets, catalog, KB, ops, mail
  src/harness/                  runner, scorers, lexical judge, scorecard
  fernhill/seed/                JSON, CSV, and Markdown exports
workshops/context-engineering/  scenarios, starters (ts, python, go), tracks, modules
workshops/data-engineering/     dbt project, loader, game day, metrics MCP, adapters
workshops/production-agents/    stub
workshops/dynamic-ui-mcp-apps/  stub
workshops/evals-fine-tuning/    stub
site/                           Astro site, static files in site/dist
```

The agent never imports the harness. The wire is one JSON object per line, or `POST /turn`. Fernhill is reached only through the mock MCP servers. Reference agents `oracle` and `echo` are built in so M0 runs with no model.

## Teaching site

```bash
pnpm site:build          # site/dist, base /
BASE_PATH=/ai-workshops/ pnpm site:build
```

Cloudflare Pages: build command `pnpm install && pnpm site:build`, output directory `site/dist`, no `BASE_PATH`.

GitHub Pages (project site): set `BASE_PATH` to `/<repo>/` and publish `site/dist`. `site/public/.nojekyll` is copied into the build so Pages does not run Jekyll. CI builds both bases and uploads `site/dist`.

## Solutions

Reference solutions are not on `main`. The public starter has the exercises, the checks, and the harness. Autograde expectations live next to the tests (`fixtures/checks.json`, `evals/test_learner.py`) because a check has to know the right answer. Full implementations of the agents and the dbt models do not.

## Decisions

These differ from a line in one of the source designs. Each one is named here so a reader can see it.

- Folder names follow this repo's brief (`workshops/context-engineering`, `workshops/data-engineering`) rather than the two designs' sketches (`01-data-engineering`, `ai-systems-workshop/`).
- Scenarios are JSON, not YAML. Same fields. One less parser.
- The five Fernhill MCP servers, plus ops and mail, listen on paths of one local process (`/mcp/crm`, `/mcp/billing`, …). Split processes are a one-line change.
- M0's runner, world, MCP servers, answer/trace/snapshot scorers, and a lexical judge ship working, so `pnpm ws eval` runs on day one. M1–M8 and D0–D9 exercises throw `LEARNER_TODO`.
- The lexical judge is the CI stand-in for the LLM judge. It agrees with 18 of the 20 hand labels (the design's bar is 17). It is not a claim about a live model.
- D6's design describes 60 questions. The generator ships 40 (30 answerable, 5 ambiguous, 5 unanswerable) in that same shape, so the scorecard runs offline. Add more rows in `questions.json` when you want the full set.
- `./setup.sh` does not install dbt, MetricFlow, Dagster, or Elementary. The dbt project, the Dagster entrypoint, and `packages.yml` are in the repo. Smoke tests do not need them.
- Snowflake, BigQuery, and Databricks profiles are documented and present. Nothing in CI connects to those warehouses.
- The positioning notes say a live cohort of about 24 hours, with D1–D3 as graded prework and live time on D0, D4, D5, D6, D8, D9, and the capstone. Those modules' lab hours add up to more than 24. The site says live time covers the checkpoints. It does not invent a new hour split.
- Game day has the design's 10 faults plus F11 (metric definition drift) and F12 (stale KB export). Those two are there to break the agent.
- The D6 agent must abstain when no governed metric exists. `answer_policy("unanswerable")` is the check.
- D8 includes three AI-written models with planted bugs. The review function is the exercise.
- The capstone scorecard accepts a question file in the same shape as the Fernhill questions, for a learner's own warehouse.
- Free core is D0–D2 plus the harness, called out in `FREE_CORE.md` and on the data landing page.
