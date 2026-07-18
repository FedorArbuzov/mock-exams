#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

docker compose up -d --build
docker compose ps

curl -sf http://localhost:8080/ | grep -q "edge OK"
curl -sf http://localhost:8080/static/ | grep -q "Static backend"
curl -sf http://localhost:8080/api/health | grep -q ok

if [[ -f certs/server.crt ]]; then
  curl -skf https://localhost:8443/api/health | grep -q ok
fi

echo "OK: nginx smoke passed"
