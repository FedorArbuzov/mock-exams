#!/usr/bin/env bash
# Enable KV v2, PKI, Transit for secrets-basic/advanced labs
set -euo pipefail
export VAULT_ADDR="${VAULT_ADDR:-http://localhost:8200}"
export VAULT_TOKEN="${VAULT_TOKEN:-course}"

vault secrets enable -path=secret kv-v2 2>/dev/null || true
vault secrets enable pki 2>/dev/null || true
vault secrets enable transit 2>/dev/null || true

vault secrets tune -max-lease-ttl=87600h pki

vault write pki/root/generate/internal \
  common_name="lab.mock-exams.local" \
  ttl=8760h

vault write pki/config/urls \
  issuing_certificates="http://127.0.0.1:8200/v1/pki/ca" \
  crl_distribution_points="http://127.0.0.1:8200/v1/pki/crl"

vault write pki/roles/lab-server \
  allowed_domains="lab.mock-exams.local" \
  allow_subdomains=true \
  max_ttl=720h

echo "OK: engines ready (secret/, pki/, transit/)"
