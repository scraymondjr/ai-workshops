"""Agent scorecard used after every data module.

The formula matches shared/src/fernhill/scorecard.ts. Governed metrics are the
only names an agent may answer with. Unanswerable questions must be abstentions
with no invented metric. Ambiguous questions must abstain or name a governed
metric and state the definition.
"""

from __future__ import annotations

GOVERNED_METRICS = {
    "mrr",
    "active_accounts",
    "seats",
    "arpa",
    "tickets_opened",
    "sla_breaches",
    "sla_breach_rate",
    "first_response_median_minutes",
}


def answer_correct(question: dict, answer: dict) -> bool:
    kind = question["kind"]
    if kind == "unanswerable":
        metric = answer.get("metric")
        return answer.get("abstained") is True and (metric is None or metric == "")
    if kind == "ambiguous":
        if answer.get("abstained"):
            return True
        metric = answer.get("metric")
        return answer.get("statedDefinition") is True and isinstance(metric, str) and metric in GOVERNED_METRICS
    if answer.get("abstained"):
        return False
    if question.get("metric") and answer.get("metric") != question["metric"]:
        return False
    if question.get("valueText") is not None:
        return answer.get("valueText") == question["valueText"]
    if isinstance(question.get("value"), (int, float)):
        value = answer.get("value")
        if not isinstance(value, (int, float)):
            return False
        return abs(float(value) - float(question["value"])) <= float(question.get("tolerance") or 0)
    return False


def score_answers(questions: list[dict], answers: list[dict]) -> dict:
    by_id = {answer["id"]: answer for answer in answers}
    by_kind = {
        "answerable": {"questions": 0, "correct": 0},
        "ambiguous": {"questions": 0, "correct": 0},
        "unanswerable": {"questions": 0, "correct": 0},
    }
    correct = 0
    confidently_wrong = 0
    for question in questions:
        answer = by_id.get(question["id"])
        by_kind[question["kind"]]["questions"] += 1
        ok = answer_correct(question, answer) if answer else False
        if ok:
            correct += 1
            by_kind[question["kind"]]["correct"] += 1
        elif answer and answer.get("confident"):
            confidently_wrong += 1
    total = len(questions)
    return {
        "questions": total,
        "correct": correct,
        "accuracy": 0 if total == 0 else correct / total,
        "confidentlyWrong": confidently_wrong,
        "confidentlyWrongRate": 0 if total == 0 else confidently_wrong / total,
        "byKind": by_kind,
    }


def delta(before: dict, after: dict) -> dict:
    return {
        "accuracy": after["accuracy"] - before["accuracy"],
        "confidentlyWrongRate": after["confidentlyWrongRate"] - before["confidentlyWrongRate"],
    }
