# Fernhill dbt project

Skeleton for D1–D9. Models are TODOs. The graded logic checks are the Python exercises, which name the rule the SQL has to match.

Default profile is DuckDB (`profiles.yml`, targets `dev` and `audit`). Other warehouses: `../adapters/`.

`packages.yml` lists dbt_utils, dbt_project_evaluator, Elementary, and dbt_expectations. `./setup.sh` does not run `dbt deps`. Install dbt-core and dbt-duckdb when you want `dbt parse` or `dbt build`. The design's main lane is dbt-core 1.12 with dbt-duckdb. dbt v2 is the portability lane, not the default here.

Dagster lives in `../orchestration/definitions.py` and is imported without installing Dagster. Call `build_definitions()` after you install it.
