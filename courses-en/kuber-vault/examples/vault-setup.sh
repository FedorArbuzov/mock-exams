#!/usr/bin/env bash
# Run after Vault Helm install. Executes vault CLI inside vault-0.
set -euo pipefail

kubectl -n vault exec vault-0 -- vault secrets enable -path=secret kv-v2 2>/dev/null || true
kubectl -n vault exec vault-0 -- vault kv put secret/checkout/db \
  password='lab-pass-2026' \
  user=checkout

kubectl -n vault exec -i vault-0 -- vault policy write checkout-app - <"$(dirname "$0")/policy.hcl"

kubectl -n vault exec vault-0 -- vault auth enable kubernetes 2>/dev/null || true
kubectl -n vault exec vault-0 -- sh -c '
vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc:443" \
  token_reviewer_jwt="$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
  kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
  disable_iss_validation=true
'

kubectl -n vault exec vault-0 -- vault write auth/kubernetes/role/checkout-app \
  bound_service_account_names=checkout-app \
  bound_service_account_namespaces=checkout \
  policies=checkout-app \
  ttl=1h \
  max_ttl=24h

echo "OK  KV + policy + kubernetes auth role checkout-app"
