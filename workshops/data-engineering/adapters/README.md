# Warehouse adapters

DuckDB is the default and the only target the smoke tests run. The other profiles are for a team that already has a warehouse. They were not connected from the environment that built this repo. Check that `dbt debug` succeeds on your account before a cohort.

Each profile reads secrets from the environment. Nothing here is a live account.

| Warehouse | Profile | Notes |
| --- | --- | --- |
| DuckDB | `dbt/profiles.yml` | `$0`. `dev` and `audit` schemas in one file, for write-audit-publish. |
| Snowflake | `adapters/snowflake/profiles.yml` | Set `SNOWFLAKE_ACCOUNT`, `SNOWFLAKE_USER`, `SNOWFLAKE_PASSWORD`, `SNOWFLAKE_ROLE`. |
| BigQuery | `adapters/bigquery/profiles.yml` | Set `BIGQUERY_PROJECT` and `BIGQUERY_KEYFILE`. |
| Databricks | `adapters/databricks/profiles.yml` | Set `DATABRICKS_HOST`, `DATABRICKS_HTTP_PATH`, `DATABRICKS_TOKEN`. |

Copy the profile you need onto `dbt/profiles.yml`, keep the `audit` output beside `dev`, and rerun the scorecard. MetricFlow's local `mf` command is documented for DuckDB in the workshop design. On another warehouse, use that platform's MetricFlow path and keep the same metric YAML.

The structural check in `evals/test_smoke.py` only checks that these files exist.
