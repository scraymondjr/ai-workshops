"""Learner exercises. Raise NotImplementedError until you fill them in.

The check file is workshops/context-engineering/fixtures/checks.json.
Billing wins plan, seats, and balance. CRM wins contact email and account owner.
Commits always re-fetch. Other actions re-fetch when now - fetched_at >= ttl_ms.
A later write with the same subject and claim_type supersedes the earlier one.
Forget deletes the claim and leaves a tombstone. Tier-1 context drops other
tenants, PII, and internal items. Untrusted refunds are denied. Trusted refunds
need approval. Email is allowed only to a verified recipient with trusted
arguments. A handoff refetches facts whose TTL has elapsed and keeps untrusted
spans labeled. Summary tokens are ceil(len(summary) / 4).
"""

from __future__ import annotations


class NotImplementedExercise(NotImplementedError):
    def __init__(self, what: str) -> None:
        super().__init__(f"LEARNER_TODO: implement {what}")


def build_customer_card(payload: dict) -> dict:
    raise NotImplementedExercise("build_customer_card")


def should_refetch(fact: dict, action: str, now_ms: int) -> bool:
    raise NotImplementedExercise("should_refetch")


def apply_memory(writes: list[dict], forget: dict | None) -> dict:
    raise NotImplementedExercise("apply_memory")


def resolve_field(field: str, obs: list[dict]) -> tuple:
    raise NotImplementedExercise("resolve_field")


def select_tickets(tickets: list[dict], query: str, budget: int) -> dict:
    raise NotImplementedExercise("select_tickets")


def admit(item: dict, who: dict) -> dict | None:
    raise NotImplementedExercise("admit")


def check_tool_policy(call: dict) -> str:
    raise NotImplementedExercise("check_tool_policy")


def review_handoff(packet: dict, now_ms: int) -> dict:
    raise NotImplementedExercise("review_handoff")
