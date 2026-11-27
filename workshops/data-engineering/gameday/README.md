# Game day (standalone)

This folder is the one-day product. It runs on a finished D0–D8 pipeline. That finished pipeline is not on `main` (solutions stay off the public starter). What you have here is the fault list, the injector, the alert contract, and the runbook template.

Twelve faults:

- F01–F10 break or pressure the pipeline. Two of them (F02, F03) must page nobody.
- F11 changes a metric definition so agent answers move while the tables still build.
- F12 serves a stale KB export. The pipeline is green and the agent is wrong.

```bash
python -c "from gameday.inject import apply_fault, load_faults; print(len(load_faults()))"
```

Score a week you played by writing `gameday/incidents/results.json` with `detected`, `published_bad_rows`, and `pages` per fault. The teaching page has the pass lines from the design: 10 of 10 original faults caught, plus the two agent faults, and no bad rows published.

Price band from the positioning notes (checked 27 Nov 2026): $300–600 per seat, or a self-serve kit. The cohort credits the fee.
