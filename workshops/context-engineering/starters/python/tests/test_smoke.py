import json
import subprocess
import sys
from pathlib import Path

from fernhill_agent.adapter import echo_reply


def test_echo_reply():
    reply = echo_reply({"type": "turn", "text": "hello"})
    assert reply["answer"] == "hello"
    assert reply["handoff"] is None


def test_stdio_adapter():
    root = Path(__file__).resolve().parents[1]
    proc = subprocess.run(
        [sys.executable, "-m", "fernhill_agent"],
        input='{"type":"turn","text":"hello"}\n',
        text=True,
        capture_output=True,
        cwd=root,
        check=False,
    )
    assert proc.returncode == 0, proc.stderr
    reply = json.loads(proc.stdout.strip())
    assert reply["answer"] == "hello"
