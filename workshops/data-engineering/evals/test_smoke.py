import json
import subprocess
from pathlib import Path

import duckdb
import pytest

from evals.scorecard import delta, score_answers
from gameday.inject import apply_fault, load_faults
from loader.fingerprint import table_fingerprint

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
SAMPLE = ROOT / "fixtures" / "sample-landing"


def ensure_seed() -> Path:
    seed = REPO / "shared" / "fernhill" / "seed"
    if not (seed / "baseline_naive.json").exists():
        subprocess.check_call(["pnpm", "ws", "generate"], cwd=REPO)
    return seed


def test_scorecard_formula_matches_a_hand_case():
    questions = [
        {"id": "a", "kind": "answerable", "metric": "mrr", "value": 10},
        {"id": "b", "kind": "unanswerable"},
        {"id": "c", "kind": "ambiguous"},
    ]
    answers = [
        {"id": "a", "abstained": False, "confident": True, "metric": "mrr", "value": 10},
        {"id": "b", "abstained": False, "confident": True, "metric": "nps", "value": 72},
        {"id": "c", "abstained": True, "confident": False},
    ]
    card = score_answers(questions, answers)
    assert card["correct"] == 2
    assert card["confidentlyWrong"] == 1
    assert delta({"accuracy": 0.1, "confidentlyWrongRate": 0.8}, card)["accuracy"] == pytest.approx(card["accuracy"] - 0.1)


def test_naive_baseline_is_confidently_wrong_and_matches_the_shared_scorer():
    seed = ensure_seed()
    questions = json.loads((seed / "questions.json").read_text())
    payload = json.loads((seed / "baseline_naive.json").read_text())
    card = score_answers(questions, payload["answers"])
    assert card["questions"] == 40
    assert card["correct"] == payload["scorecard"]["correct"]
    assert card["accuracy"] == pytest.approx(payload["scorecard"]["accuracy"])
    assert card["confidentlyWrongRate"] == pytest.approx(payload["scorecard"]["confidentlyWrongRate"])
    assert card["accuracy"] < 0.5
    assert card["confidentlyWrongRate"] > 0.5
    assert sum(1 for question in questions if question["kind"] == "unanswerable") == 5


def test_fingerprint_is_order_independent():
    con = duckdb.connect()
    con.execute("create table example (id integer, name varchar)")
    con.execute("insert into example values (1, 'a'), (2, 'b')")
    first = table_fingerprint(con, "example")
    con.execute("delete from example")
    con.execute("insert into example values (2, 'b'), (1, 'a')")
    assert table_fingerprint(con, "example") == first
    con.execute("insert into example values (3, 'c')")
    assert table_fingerprint(con, "example")["n"] == 3


def test_game_day_has_twelve_faults_including_two_that_break_the_agent(tmp_path):
    faults = load_faults()
    assert len(faults) == 12
    agent_faults = [fault["id"] for fault in faults if fault["breaks"] == "agent"]
    assert agent_faults == ["F11_metric_definition_drift", "F12_stale_kb_export"]
    by_id = {fault["id"]: fault for fault in faults}
    drifted = apply_fault(SAMPLE, by_id["F11_metric_definition_drift"], tmp_path / "f11")
    assert "grain: day" in (drifted / "semantic" / "mrr.yml").read_text()
    stale = apply_fault(SAMPLE, by_id["F12_stale_kb_export"], tmp_path / "f12")
    assert "OUTDATED" in (stale / "export" / "kb.md").read_text()
    missing = apply_fault(SAMPLE, by_id["F01_crm_drop_missing"], tmp_path / "f01")
    assert not (missing / "2026-11-02" / "crm").exists()
    renamed = apply_fault(SAMPLE, by_id["F04_partner_schema_drift"], tmp_path / "f04")
    header = (renamed / "2026-11-01" / "billing" / "invoices.csv").read_text().splitlines()[0]
    assert header.startswith("invoice_id,account_id,amount,")
    dup = apply_fault(SAMPLE, by_id["F03_duplicate_drop"], tmp_path / "f03")
    original = (dup / "2026-11-01" / "billing" / "invoices.csv").read_bytes()
    copy = (dup / "2026-11-01" / "billing" / "invoices.csv.redelivered").read_bytes()
    assert original == copy


def test_project_layout_and_adapter_profiles_exist():
    required = [
        "dbt/dbt_project.yml",
        "dbt/profiles.yml",
        "dbt/packages.yml",
        "dbt/macros/table_fingerprint.sql",
        "adapters/snowflake/profiles.yml",
        "adapters/bigquery/profiles.yml",
        "adapters/databricks/profiles.yml",
        "orchestration/definitions.py",
        "FREE_CORE.md",
        "gameday/README.md",
        "gameday/runbooks/customer-context.md",
        "gameday/postmortems/TEMPLATE.md",
    ]
    missing = [path for path in required if not (ROOT / path).exists()]
    assert missing == []
    import orchestration.definitions as definitions

    assert callable(definitions.build_definitions)


def test_free_core_lists_d0_through_d2():
    text = (ROOT / "FREE_CORE.md").read_text()
    for module in ("D0", "D1", "D2"):
        assert module in text
