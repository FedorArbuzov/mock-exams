# 05. Lab: write secrets and a readonly policy

## Goal

Enable KV v2 (if needed), write `secret/checkout/db`, create policy `checkout-app`.

## Task 1. Enable KV (idempotent)

```bash
kubectl -n vault exec vault-0 -- vault secrets enable -path=secret kv-v2 2>/dev/null || true
kubectl -n vault exec vault-0 -- vault kv put secret/checkout/db \
  password='lab-pass-2026' \
  user=checkout
kubectl -n vault exec vault-0 -- vault kv get secret/checkout/db
```

## Task 2. Write policy

```bash
kubectl -n vault exec -i vault-0 -- vault policy write checkout-app - <<'EOF'
path "secret/data/checkout/*" {
  capabilities = ["read"]
}
path "secret/metadata/checkout/*" {
  capabilities = ["read", "list"]
}
EOF

kubectl -n vault exec vault-0 -- vault policy read checkout-app
```

## Task 3. Self-check

```bash
kubectl -n vault exec vault-0 -- vault token create -policy=checkout-app -ttl=15m -format=json
```

You should get a token (do not commit it). Optional: use it with `VAULT_TOKEN=… vault kv get` to confirm read works; write should fail.

## Success criteria

- [ ] `vault kv get secret/checkout/db` shows password  
- [ ] Policy `checkout-app` exists  

No Interactive Check here (Vault API). Continue to Kubernetes auth.

Next: [06. Kubernetes auth](06-kubernetes-auth.md).
