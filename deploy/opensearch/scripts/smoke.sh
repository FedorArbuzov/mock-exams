#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== opensearch smoke =="
docker compose ps

curl -sf http://localhost:9200/_cluster/health | grep -qE '"status":"(green|yellow)"'
echo "OK: cluster health"

curl -sf -X PUT "http://localhost:9200/smoke-test" -H 'Content-Type: application/json' -d '{"settings":{"number_of_shards":1,"number_of_replicas":0}}'
curl -sf -X POST "http://localhost:9200/smoke-test/_doc" -H 'Content-Type: application/json' -d '{"msg":"ok","@timestamp":"2026-05-18T12:00:00Z"}'
curl -sf "http://localhost:9200/smoke-test/_search?q=msg:ok" | grep -q '"hits"'
echo "OK: index + search"
