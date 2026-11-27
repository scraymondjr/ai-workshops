# Runbook: customer-context export

Owner: the on-call named on the failing test.

1. Read the page. It should say what failed, whether the agent is still on the last good export, and the name of this runbook.
2. Do not publish `audit` to `main` while a critical test or the RAG gate is failing.
3. Check `as_of` on `mart_support__customer_context`. If it is older than the TTL, the agent must keep the previous export and say so.
4. If the fault is F11, diff the metric YAML before you look at row counts. Agent answers can move with no failed row test.
5. If the fault is F12, compare the KB export hash with the last good export. A fresh dbt run does not fix a stale file the agent is still reading.
6. Write an incident note. The action item is a new fault or a new test, not "be more careful".
