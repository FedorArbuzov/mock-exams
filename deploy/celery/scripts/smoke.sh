#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE_URL:-http://localhost:8093}"

echo "== health =="
curl -sf "$BASE/health/" | grep -q '"status":"ok"'

echo "== ping task =="
RESP=$(curl -sf -X POST "$BASE/tasks/ping/")
TASK_ID=$(echo "$RESP" | python -c "import sys,json; print(json.load(sys.stdin)['task_id'])")
echo "task_id=$TASK_ID"

for i in $(seq 1 20); do
  STATE=$(curl -sf "$BASE/tasks/$TASK_ID/" | python -c "import sys,json; print(json.load(sys.stdin)['state'])")
  if [ "$STATE" = "SUCCESS" ]; then
    echo "ping SUCCESS"
    exit 0
  fi
  sleep 0.5
done

echo "FAIL: task did not succeed in time (state=$STATE)"
exit 1
