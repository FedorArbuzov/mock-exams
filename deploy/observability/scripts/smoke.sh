#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== observability smoke =="
docker compose ps

curl -sf http://localhost:9090/-/healthy >/dev/null
echo "OK: Prometheus healthy"

curl -sf http://localhost:3000/api/health >/dev/null
echo "OK: Grafana healthy"

curl -sf http://localhost:8000/health >/dev/null
echo "OK: demo-app healthy"

for i in $(seq 1 20); do curl -sf http://localhost:8000/ >/dev/null; done
sleep 2
curl -sf "http://localhost:9090/api/v1/query?query=demo_http_requests_total" | grep -q demo_http_requests_total
echo "OK: metrics ingested"
