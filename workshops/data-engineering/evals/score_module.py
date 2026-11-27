"""Print the D0 baseline and the delta for one module.

The starter ships the naive baseline only. Pass `--answers path.json` once you
have a new recorded run. Live model calls are not part of this command.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from evals.scorecard import delta, score_answers

REPO = Path(__file__).resolve().parents[3]
SEED = REPO / "shared" / "fernhill" / "seed"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--module", default="d0")
    parser.add_argument("--answers", type=Path)
    args = parser.parse_args()
    questions = json.loads((SEED / "questions.json").read_text())
    baseline_payload = json.loads((SEED / "baseline_naive.json").read_text())
    baseline = score_answers(questions, baseline_payload["answers"])
    current = baseline
    if args.answers:
        current = score_answers(questions, json.loads(args.answers.read_text()))
    change = delta(baseline, current)
    print(f"module {args.module}")
    print(f"baseline accuracy {baseline['accuracy']:.3f}  confidently-wrong {baseline['confidentlyWrongRate']:.3f}")
    print(f"current  accuracy {current['accuracy']:.3f}  confidently-wrong {current['confidentlyWrongRate']:.3f}")
    print(f"delta accuracy {change['accuracy']:+.3f}  confidently-wrong {change['confidentlyWrongRate']:+.3f}")


if __name__ == "__main__":
    main()
