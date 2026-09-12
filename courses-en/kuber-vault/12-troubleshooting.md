# 12. Troubleshooting login and inject

## Pod stuck in Init

```bash
kubectl -n checkout describe pod -l app=checkout
kubectl -n checkout logs <pod> -c vault-agent-init
```

| Log / event | Likely cause |
|-------------|--------------|
| permission denied / 403 login | role bounds, wrong SA, policy |
| connection refused to vault | wrong addr; use `http://vault.vault.svc:8200` |
| template error | KV v2 `.Data.data` vs `.Data` |
| webhook / inject missing | injector Down; annotations on wrong metadata level |

## Login denied

```bash
kubectl -n vault exec vault-0 -- vault read auth/kubernetes/role/checkout-app
kubectl -n checkout get sa,pod -o wide
```

Confirm Pod `serviceAccountName` equals `bound_service_account_names`.

## TokenReview failures

Vault SA needs `system:auth-delegator` (or equivalent) to call TokenReview. Chart defaults usually include this; if not:

```bash
kubectl -n vault get clusterrolebinding | findstr vault
# or: grep vault
```

## Checklist

- [ ] Always read `vault-agent-init` logs before rewriting YAML  
- [ ] Annotations must be under `spec.template.metadata`  

Next: [13. Lab: fix broken inject](13-lab-troubleshooting.md).
