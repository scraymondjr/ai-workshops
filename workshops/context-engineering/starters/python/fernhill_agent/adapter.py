"""JSONL-over-stdio adapter. Echo reference agent, for the harness contract."""

from __future__ import annotations

import json
import sys


def echo_reply(turn: dict) -> dict:
    text = "" if turn.get("type") == "newSession" else turn.get("text") or ""
    return {"answer": text, "contextSnapshot": [], "handoff": None}


def main() -> None:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        sys.stdout.write(json.dumps(echo_reply(json.loads(line))) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
