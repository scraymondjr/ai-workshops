import duckdb
import pytest

from exercises import (
    answer_policy,
    columns_missing_pii,
    fields_for_role,
    find_planted_bugs,
    freshness_status,
    gold_direct_pii,
    mrr_grouped_by_day_is_valid,
    plan_at,
    query_metrics,
    reconcile,
    route_alert,
    should_publish,
)
from loader.load import load_file
from loader.schema import apply_schema

pytestmark = pytest.mark.learner

ROOT_FIXTURE = __file__


def test_d0_loader_accounts_for_malformed_lines(tmp_path):
    from pathlib import Path

    con = duckdb.connect(str(tmp_path / "fernhill.duckdb"))
    apply_schema(con)
    path = Path(__file__).resolve().parents[1] / "fixtures" / "sample-drop" / "invoices.jsonl"
    first = load_file(con, path)
    second = load_file(con, path)
    assert second.skipped is True
    assert first.loaded + first.rejected == 3
    assert first.rejected == 1


def test_d1_freshness_thresholds():
    assert freshness_status(10) == "pass"
    assert freshness_status(30) == "warn"
    assert freshness_status(52) == "error"


def test_d2_pii_meta():
    columns = [
        {"name": "ticket_id", "meta": {"pii": "none"}},
        {"name": "email", "meta": {"pii": "direct"}},
        {"name": "note"},
    ]
    assert columns_missing_pii(columns) == ["note"]
    assert gold_direct_pii(columns) == ["email"]


def test_d3_plan_at_issue():
    history = [
        {"plan": "business", "valid_from": "2026-03-01T00:00:00Z", "valid_to": "2026-11-25T12:00:00Z"},
        {"plan": "team", "valid_from": "2026-11-25T12:00:00Z", "valid_to": "9999-12-31T00:00:00Z"},
    ]
    assert plan_at("2026-10-01T12:00:00Z", history) == "business"
    assert plan_at("2026-11-26T15:00:00Z", history) == "team"


def test_d4_reconcile_billing_when_newer():
    got = reconcile(
        {"plan": "business", "seats": 25, "updated_at": "2026-06-01T00:00:00Z", "owner": "owner@halcyon.example", "segment": "mid"},
        {"plan": "team", "seats": 18, "updated_at": "2026-11-25T12:00:00Z"},
    )
    assert got["plan"] == "team"
    assert got["seats"] == 18
    assert got["plan_source"] == "billing"
    assert got["owner"] == "owner@halcyon.example"
    assert "plan" in got["conflict_fields"]
    assert "seats" in got["conflict_fields"]


def test_d5_mrr_cannot_be_summed_across_days():
    assert mrr_grouped_by_day_is_valid(["metric_time__day"]) is False
    assert mrr_grouped_by_day_is_valid(["metric_time__month"]) is True


def test_d6_unknown_metric_abstains():
    catalog = {"metrics": ["mrr", "seats"], "near": {"nps": ["mrr"]}}
    result = query_metrics(catalog, ["nps"])
    assert result["error"] == "unknown_metric"
    assert "sql" not in result
    assert answer_policy("unanswerable") == "abstain"
    assert answer_policy("ambiguous") == "clarify"
    assert answer_policy("answerable") == "answer"


def test_d7_role_allow_list():
    columns = [
        {"name": "account_id", "meta": {}},
        {"name": "mrr_cents", "meta": {"roles": ["billing"], "sensitivity": "internal"}},
        {"name": "phone", "meta": {"roles": ["admin"], "sensitivity": "pii"}},
    ]
    assert fields_for_role(columns, "tier1") == ["account_id"]
    assert "mrr_cents" in fields_for_role(columns, "billing")


def test_d8_planted_bugs():
    from pathlib import Path

    folder = Path(__file__).resolve().parents[1] / "evals" / "ai_prs"
    sql = "\n".join(path.read_text() for path in sorted(folder.glob("*.sql")))
    assert set(find_planted_bugs(sql)) >= {"sum-daily-mrr", "join-on-name", "crm-owns-plan"}


def test_d9_alerts_and_publish_gate():
    assert route_alert({"severity": "critical"}) == {"route": "page", "pages": 1}
    assert route_alert({"severity": "warning"}) == {"route": "digest", "pages": 0}
    assert route_alert({"severity": "absorbed"}) == {"route": "log", "pages": 0}
    assert should_publish({"critical_failures": 0, "rag_gate_ok": True}) is True
    assert should_publish({"critical_failures": 1, "rag_gate_ok": True}) is False
    assert should_publish({"critical_failures": 0, "rag_gate_ok": False}) is False
