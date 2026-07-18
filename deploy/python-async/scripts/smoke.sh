#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE_URL:-http://localhost:8095}"

echo "== health =="
curl -sf "$BASE/health" | grep -q ok

echo "== json =="
curl -sf "$BASE/json?size=3" | grep -q slow-a

echo "== parallel faster than sequential (timing check) =="
T1=$(curl -sf -w '%{time_total}' -o /dev/null "$BASE/aggregate")
T2=$(curl -sf -w '%{time_total}' -o /dev/null "$BASE/aggregate-parallel")
python3 -c "import sys; t1=float('$T1'); t2=float('$T2'); sys.exit(0 if t2 < t1 else 1)" \
  || { echo "WARN: parallel ($T2 s) not faster than sequential ($T1 s) — check stack"; exit 1; }

echo "OK: python-async mock stack (seq=${T1}s par=${T2}s)"
