#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

USER="${RABBIT_USER:-course}"
PASS="${RABBIT_PASS:-course}"

docker compose ps
docker exec mock-rabbitmq rabbitmq-diagnostics -q ping
docker exec mock-rabbitmq rabbitmqadmin -u "$USER" -p "$PASS" list exchanges name type | head -5
echo "OK: rabbitmq smoke passed"
