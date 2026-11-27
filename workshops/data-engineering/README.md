# Metrics, not SQL

dbt and a medallion model for Fernhill, then an agent that must use governed metrics or abstain.

Free core: D0–D2 and the harness (`FREE_CORE.md`).
Game day, packable on its own: `gameday/`.
Bring-your-own-data capstone: `capstone/`.

```bash
python -m pytest -m "not learner" -q
python -m pytest -m learner -q          # fails until the exercises are implemented
python -m evals.score_module --module d0
```

DuckDB profiles for Snowflake, BigQuery, and Databricks are under `adapters/`. They are not connected from CI.
