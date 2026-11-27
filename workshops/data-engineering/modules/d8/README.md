# D8 · CI and AI-written PRs

Teaching page: `/workshops/data-engineering/d8/`.

Logic check (fails until you implement it):

```bash
cd workshops/data-engineering
python -m pytest -m learner -q
```

Implement find_planted_bugs

The dbt project under `dbt/` is where the same rule becomes SQL. `dbt` is not installed by `./setup.sh`.

After each module, re-run the scorecard:

```bash
python -m evals.score_module --module d8
```
