"""Learner exercises for D1–D9. The dbt models should express the same rules."""

from __future__ import annotations


def freshness_status(age_hours: float) -> str:
    """Return 'pass', 'warn', or 'error'. Warn after 26 hours, error after 50."""
    raise NotImplementedError("LEARNER_TODO: implement freshness_status")


def columns_missing_pii(columns: list[dict]) -> list[str]:
    """Names of columns that lack meta.pii."""
    raise NotImplementedError("LEARNER_TODO: implement columns_missing_pii")


def gold_direct_pii(columns: list[dict]) -> list[str]:
    """Names of gold columns whose meta.pii is 'direct'."""
    raise NotImplementedError("LEARNER_TODO: implement gold_direct_pii")


def plan_at(issued_at: str, history: list[dict]) -> str | None:
    """Plan whose [valid_from, valid_to) contains issued_at."""
    raise NotImplementedError("LEARNER_TODO: implement plan_at")


def reconcile(crm: dict, billing: dict | None) -> dict:
    """Billing wins plan and seats when its record is newer. CRM wins owner and segment.

    Return plan, seats, plan_source, owner, segment, conflict_fields.
    """
    raise NotImplementedError("LEARNER_TODO: implement reconcile")


def mrr_grouped_by_day_is_valid(group_by: list[str]) -> bool:
    """False when a query would sum MRR across days. MRR is semi-additive."""
    raise NotImplementedError("LEARNER_TODO: implement mrr_grouped_by_day_is_valid")


def query_metrics(catalog: dict, metrics: list[str], limit: int = 500) -> dict:
    """Unknown metrics return {error: unknown_metric, unknown, did_you_mean} and no SQL."""
    raise NotImplementedError("LEARNER_TODO: implement query_metrics")


def answer_policy(kind: str) -> str:
    """'answer', 'clarify', or 'abstain'. Unanswerable questions abstain."""
    raise NotImplementedError("LEARNER_TODO: implement answer_policy")


def fields_for_role(columns: list[dict], role: str) -> list[str]:
    """Columns whose meta.roles contains the role. Missing roles means public to every role."""
    raise NotImplementedError("LEARNER_TODO: implement fields_for_role")


def find_planted_bugs(sql: str) -> list[str]:
    """Return bug ids found in an AI-written model. See evals/ai_prs/."""
    raise NotImplementedError("LEARNER_TODO: implement find_planted_bugs")


def route_alert(signal: dict) -> dict:
    """Return {route: page|digest|log, pages: 0|1}.

    critical -> page once. warning -> digest and pages 0. absorbed -> log only.
    """
    raise NotImplementedError("LEARNER_TODO: implement route_alert")


def should_publish(audit: dict) -> bool:
    """False when critical tests failed or the RAG gate failed."""
    raise NotImplementedError("LEARNER_TODO: implement should_publish")
