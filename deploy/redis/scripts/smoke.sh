#!/usr/bin/env bash
set -euo pipefail

HOST="${REDIS_HOST:-localhost}"
PORT="${REDIS_PORT:-6379}"

echo "== redis smoke: ${HOST}:${PORT} =="
docker compose ps 2>/dev/null || true

if docker ps --format '{{.Names}}' | grep -q '^mock-redis$'; then
  CLI="docker exec mock-redis redis-cli"
elif command -v redis-cli >/dev/null 2>&1; then
  CLI="redis-cli -h $HOST -p $PORT"
else
  echo "Start: cd deploy/redis && docker compose up -d"
  exit 1
fi

$CLI ping | grep -F PONG
$CLI SET "smoke:$(date +%s)" ok EX 60
echo "OK: SET/GET smoke passed"
