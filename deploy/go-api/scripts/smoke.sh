#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE_URL:-http://localhost:8099}"

echo "== health =="
curl -sf "$BASE/health" | grep -q ok

echo "== items =="
curl -sf "$BASE/api/v1/items" | grep -q Demo

echo "OK: go-api stack"
