#!/usr/bin/env bash
# Generate traffic for demo-app metrics labs
set -euo pipefail
URL="${URL:-http://localhost:8000}"
COUNT="${COUNT:-200}"
for i in $(seq 1 "$COUNT"); do
  curl -sf "$URL/" >/dev/null || true
  curl -sf "$URL/health" >/dev/null || true
  if (( i % 10 == 0 )); then curl -sf "$URL/missing" >/dev/null 2>&1 || true; fi
done
echo "Sent $COUNT requests to $URL"
