# D5 · Semantic layer

Teaching page: `/workshops/data-engineering/d5/`.

Logic check (fails until you implement it):

```bash
cd workshops/data-engineering
python -m pytest -m learner -q
```

Implement mrr_grouped_by_day_is_valid

The dbt project under `dbt/` is where the same rule becomes SQL. `dbt` is not installed by `./setup.sh`.

After each module, re-run the scorecard:

```bash
python -m evals.score_module --module d5
```
