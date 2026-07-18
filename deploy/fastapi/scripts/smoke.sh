#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE_URL:-http://localhost:8090}"

echo "== health =="
curl -sf "$BASE/health" | grep -q ok

echo "== openapi =="
curl -sf "$BASE/openapi.json" | grep -q '"openapi"'

echo "== items =="
curl -sf "$BASE/api/v1/items" | grep -q Demo

echo "== metrics =="
curl -sf "$BASE/metrics" | grep -q fastapi_http_requests_total

echo "OK: fastapi stack"
