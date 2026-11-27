"""Check a bring-your-own-data question file without scoring a warehouse."""

from __future__ import annotations

import json
from pathlib import Path


def validate_questions(path: Path) -> list[str]:
    questions = json.loads(path.read_text())
    errors = []
    if not isinstance(questions, list) or not questions:
        return ["expected a non-empty list"]
    for question in questions:
        if "id" not in question or "kind" not in question or "text" not in question:
            errors.append(f"missing id, kind, or text: {question!r}")
            continue
        if question["kind"] not in {"answerable", "ambiguous", "unanswerable"}:
            errors.append(f"{question['id']}: bad kind")
        if question["kind"] == "answerable" and "metric" not in question:
            errors.append(f"{question['id']}: answerable questions need a metric")
    return errors
