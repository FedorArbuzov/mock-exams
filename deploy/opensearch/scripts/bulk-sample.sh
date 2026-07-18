#!/usr/bin/env bash
# Load sample nginx-style logs into logs-app-* index
set -euo pipefail
OS="${OS:-http://localhost:9200}"
IDX="${IDX:-logs-app-$(date +%Y%m%d)}"

cat <<EOF | curl -sf -X POST "$OS/_bulk" -H 'Content-Type: application/x-ndjson' --data-binary @-
{"index":{"_index":"$IDX"}}
{"@timestamp":"2026-05-18T10:00:01Z","level":"info","service":"api","message":"GET /health 200","bytes":12,"status":200}
{"index":{"_index":"$IDX"}}
{"@timestamp":"2026-05-18T10:00:02Z","level":"error","service":"api","message":"GET /orders 500","bytes":0,"status":500}
{"index":{"_index":"$IDX"}}
{"@timestamp":"2026-05-18T10:00:03Z","level":"warn","service":"worker","message":"retry payment","bytes":null,"status":null}
EOF

curl -sf -X POST "$OS/$IDX/_refresh" >/dev/null
echo "Loaded 3 docs into $IDX"
