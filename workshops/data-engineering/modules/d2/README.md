# D2 · Contracts, unit tests, PII

Teaching page: `/workshops/data-engineering/d2/`.

Logic check (fails until you implement it):

```bash
cd workshops/data-engineering
python -m pytest -m learner -q
```

Implement columns_missing_pii and gold_direct_pii

The dbt project under `dbt/` is where the same rule becomes SQL. `dbt` is not installed by `./setup.sh`.

After each module, re-run the scorecard:

```bash
python -m evals.score_module --module d2
```
