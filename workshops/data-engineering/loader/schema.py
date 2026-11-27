from pathlib import Path


def apply_schema(con) -> None:
    sql = Path(__file__).with_name("schema.sql").read_text()
    for statement in sql.split(";"):
        if statement.strip():
            con.execute(statement)
