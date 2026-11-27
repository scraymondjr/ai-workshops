# D0 · Landing zone and baseline

Teaching page: `/workshops/data-engineering/d0/`.

Logic check (fails until you implement it):

```bash
cd workshops/data-engineering
python -m pytest -m learner -q
```

Implement load_file in loader/load.py

The dbt project under `dbt/` is where the same rule becomes SQL. `dbt` is not installed by `./setup.sh`.

After each module, re-run the scorecard:

```bash
python -m evals.score_module --module d0
```
