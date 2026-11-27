"""Order-independent table fingerprint. Provided with the harness."""

from __future__ import annotations

import hashlib
import json
from datetime import date, datetime
from decimal import Decimal


def _norm(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    return value


def table_fingerprint(con, relation: str, exclude: list[str] | None = None) -> dict:
    skipped = set(exclude or [])
    columns = [row[0] for row in con.execute(f"describe {relation}").fetchall()]
    kept = [name for name in columns if name not in skipped]
    if not kept:
        raise ValueError(f"{relation} has no columns left to fingerprint")
    rows = con.execute(f"select {', '.join(kept)} from {relation}").fetchall()
    lines = sorted(json.dumps({key: _norm(value) for key, value in zip(kept, row)}, sort_keys=True) for row in rows)
    digest = hashlib.md5("\n".join(lines).encode()).hexdigest()
    return {"n": len(rows), "fp": digest}
