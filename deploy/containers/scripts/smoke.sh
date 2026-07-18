#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

docker compose up -d --build
docker compose ps
curl -sf http://localhost:8088/api/health | grep -q ok
curl -sf http://localhost:8088/api/hits | grep -q hits
echo "OK: stack smoke passed"
