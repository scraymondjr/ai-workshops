"""MCP tool names copied from dbt-mcp so a hosted semantic layer can replace this process.

The exercise is `query_metrics` in `exercises.py`. Unknown metrics return a
recoverable error. They never fall through to SQL.
"""

TOOL_NAMES = [
    "list_metrics",
    "get_dimensions",
    "get_dimension_values",
    "query_metrics",
    "get_metrics_compiled_sql",
]


def main() -> None:
    print("fernhill-metrics tools:")
    for name in TOOL_NAMES:
        print(f"  {name}")


if __name__ == "__main__":
    main()
