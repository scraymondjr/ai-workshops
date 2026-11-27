# Capstone

Two finishes, both scored by the same scorecard.

1. Brightline partner feed, as in the data workshop design. Different account ids, weekly delivery, a different status vocabulary. Fernhill-only metric cells stay at diff 0. No partner PII in gold. The feed survives a game day with three partner-specific faults.
2. Your own warehouse. Put questions in `capstone/my_questions.json` using the same shape as `shared/fernhill/seed/questions.json`. Run:

```bash
python -m evals.score_module --module capstone --answers capstone/my_answers.json
```

Then write a one-page 90-day plan: which metric is still missing, who owns it, and which game-day fault you would inject first.

Portfolio pieces the positioning notes name: the scorecard, a postmortem, a runbook, and that design note.
