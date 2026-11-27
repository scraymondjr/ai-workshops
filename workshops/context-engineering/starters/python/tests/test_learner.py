import json
from pathlib import Path

import pytest

from fernhill_agent.exercises import (
    admit,
    apply_memory,
    build_customer_card,
    check_tool_policy,
    review_handoff,
    resolve_field,
    select_tickets,
    should_refetch,
)

pytestmark = pytest.mark.learner

CHECKS = json.loads((Path(__file__).resolve().parents[3] / "fixtures" / "checks.json").read_text())


def test_m1_customer_card():
    card = build_customer_card(CHECKS["m1"])
    assert card["plan"] == "team"
    assert card["seats"]["billed"] == 18
    assert card["seats"]["active"] == 18


def test_m2_should_refetch():
    for row in CHECKS["m2"]:
        assert should_refetch(row, row["action"], row["now"]) is row["expect"]


def test_m3_memory():
    state = apply_memory(CHECKS["m3"]["writes"], CHECKS["m3"]["forget"])
    claims = [record["claim"] for record in state["active"]]
    assert "28" in claims
    assert "30" not in claims
    assert "+1-555-0142" not in claims
    assert state["tombstones"] == [CHECKS["m3"]["forget"]]


def test_m4_resolve():
    for row in CHECKS["m4"]:
        value, conflict = resolve_field(row["field"], row["obs"])
        assert value == row["value"]
        assert conflict is row["conflict"]


def test_m5_budget():
    got = select_tickets(CHECKS["m5"]["tickets"], "Route Optimizer greyed out", CHECKS["m5"]["budget"])
    assert got["tokens"] <= CHECKS["m5"]["budget"]
    assert CHECKS["m5"]["needleId"] in [ticket["id"] for ticket in got["verbatim"]]


def test_m6_admit():
    for row in CHECKS["m6"]:
        got = admit(row["item"], row["who"])
        assert (got is not None) is row["keep"]


def test_m7_policy():
    for row in CHECKS["m7"]:
        assert check_tool_policy(row) == row["expect"]


def test_m8_handoff():
    got = review_handoff(CHECKS["m8"]["packet"], CHECKS["m8"]["now"])
    assert got["refetch"] == CHECKS["m8"]["expectRefetch"]
    assert got["carriesUntrusted"] is True
