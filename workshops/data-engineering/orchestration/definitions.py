"""Dagster OSS skeleton for D9.

Importing this module does not import Dagster. Call build_definitions() after
`pip install dagster dagster-dbt`. One asset partition per daily drop is the
shape to fill in. Cron and a GitHub Actions schedule stay the $0 fallback.
"""


def build_definitions():
    from dagster import Definitions, asset

    @asset(description="One Fernhill daily drop. Partition this by landing date.")
    def daily_drop() -> str:
        return "TODO: read landing/<date> and run the audit build"

    return Definitions(assets=[daily_drop])
