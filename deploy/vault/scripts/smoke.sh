#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

export VAULT_ADDR="${VAULT_ADDR:-http://localhost:8200}"
export VAULT_TOKEN="${VAULT_TOKEN:-course}"

docker compose ps

if command -v vault >/dev/null 2>&1; then
  VAULT="vault"
else
  VAULT="docker exec -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN=course mock-vault vault"
fi

$VAULT status | grep -qi "sealed.*false"
$VAULT secrets enable -path=secret kv-v2 2>/dev/null || true
$VAULT kv put secret/smoke msg=ok
$VAULT kv get -field=msg secret/smoke | grep -q ok
echo "OK: vault smoke passed"
