#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v pnpm >/dev/null; then
  corepack enable
  corepack prepare pnpm@9.15.9 --activate
fi

pnpm install
python3 -m venv .venv
.venv/bin/pip install -q -r workshops/data-engineering/requirements.txt
pnpm ws generate

echo
echo "Ready."
echo "  pnpm test:smoke     harness, site is separate"
echo "  pnpm site:build     static site in site/dist"
echo "  pnpm ws eval --module m0 --agent-builtin oracle"
