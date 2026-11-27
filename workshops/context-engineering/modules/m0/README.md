# M0 · Eval harness and world simulator

Teaching page: `site` route `/workshops/context-engineering/m0/`.

Code lives in the language starters, not in this folder, so the three languages stay one edit away from each other:

- `starters/ts/src/exercises.ts`
- `starters/python/fernhill_agent/exercises.py`
- `starters/go/exercises.go`

Checks: `fixtures/checks.json`.

## Checkpoint

pnpm ws eval --module m0 --agent-builtin oracle

Python: `pytest -m learner` in `starters/python`.
Go: `go test -run TestM` in `starters/go`.

Those commands fail with `LEARNER_TODO` until the exercise is implemented. M0's harness smoke suite is the exception: it passes on a fresh clone.
