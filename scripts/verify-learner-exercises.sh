#!/usr/bin/env bash
# Smoke-check that starter exercises are still unsolved, and that the
# passing harness tests stay green. A solved exercise removes the LEARNER_TODO
# failure. On the public starter that should fail this script until the
# solution is kept off main.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT="$(mktemp)"
set +e
pnpm --filter @fernhill/shared exec vitest run --config vitest.learner.ts --reporter=json --outputFile="$OUT"
set -e
node scripts/expect-learner-failure.mjs "$OUT"

py() { "$ROOT/.venv/bin/python" -m pytest "$@"; }

set +e
py "$ROOT/workshops/data-engineering" -m learner -q --tb=line > /tmp/de-learner.txt
de=$?
py "$ROOT/workshops/context-engineering/starters/python" -m learner -q --tb=line > /tmp/ctx-learner.txt
ctx=$?
( cd "$ROOT/workshops/context-engineering/starters/go" && go test -count=1 -run 'TestM' > /tmp/go-learner.txt )
go_status=$?
set -e

test "$de" -ne 0
test "$ctx" -ne 0
test "$go_status" -ne 0
grep -q LEARNER_TODO /tmp/de-learner.txt
grep -q LEARNER_TODO /tmp/ctx-learner.txt
grep -q LEARNER_TODO /tmp/go-learner.txt

py "$ROOT/workshops/data-engineering" -m "not learner" -q
py "$ROOT/workshops/context-engineering/starters/python" -m "not learner" -q
( cd "$ROOT/workshops/context-engineering/starters/go" && go test -count=1 -run 'TestEcho|TestStdio' )

echo "learner exercises are marked failing; harness smoke passed"
