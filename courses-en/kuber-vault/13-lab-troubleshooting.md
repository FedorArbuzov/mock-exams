# 13. Lab: fix a broken role / annotation

## Goal

Break the inject path, observe failure, restore a working Deployment. Interactive Check expects the **fixed** annotations.

## Task 1. Break the role name

```bash
kubectl -n checkout patch deployment checkout --type=json -p='[
  {"op":"replace","path":"/spec/template/metadata/annotations/vault.hashicorp.com~1role","value":"wrong-role"}
]'
kubectl -n checkout rollout status deploy/checkout --timeout=60s || true
kubectl -n checkout get pods
kubectl -n checkout logs -l app=checkout -c vault-agent-init --tail=30 || true
```

Expect init failures / CrashLoop on agent.

## Task 2. Fix

```bash
kubectl -n checkout patch deployment checkout --type=json -p='[
  {"op":"replace","path":"/spec/template/metadata/annotations/vault.hashicorp.com~1role","value":"checkout-app"}
]'
kubectl -n checkout rollout status deploy/checkout
POD=$(kubectl -n checkout get pod -l app=checkout -o jsonpath='{.items[0].metadata.name}')
kubectl -n checkout exec "$POD" -c app -- cat /vault/secrets/db
```

## Success criteria

- [ ] You saw the failure mode  
- [ ] Inject works again  
- [ ] Interactive Check passes  

Next: [14. Final project](14-final-project.md).
