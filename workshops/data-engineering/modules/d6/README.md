# D6 · Agents ask for metrics

Teaching page: `/workshops/data-engineering/d6/`.

Logic check (fails until you implement it):

```bash
cd workshops/data-engineering
python -m pytest -m learner -q
```

Implement query_metrics and answer_policy. Abstain when no governed metric exists.

The dbt project under `dbt/` is where the same rule becomes SQL. `dbt` is not installed by `./setup.sh`.

After each module, re-run the scorecard:

```bash
python -m evals.score_module --module d6
```
