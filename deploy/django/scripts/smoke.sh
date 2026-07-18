#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE_URL:-http://localhost:8092}"

echo "== health =="
curl -sf "$BASE/health/" | grep -q ok

echo "== api products =="
curl -sf "$BASE/api/v1/products/" | grep -q '"results"'

echo "== admin redirect =="
curl -sf -o /dev/null -w '%{http_code}' "$BASE/admin/" | grep -qE '200|302'

echo "OK: django stack"
