# 14. Final project: checkout secrets

## Goal

In namespace **`lab-vault-final`**, deliver a complete “checkout” path: KV secret, policy, Kubernetes auth role, Injector-annotated Deployment. Same ideas as labs 05–09, clean namespace.

**Stand:** [ENVIRONMENT.md](ENVIRONMENT.md) — Vault Helm release must be up.  
**Time:** ~3–4 hours.  
**Verify:** Interactive Check + manual `cat /vault/secrets/db`.

---

## Must rubric

| # | Criterion |
|---|-----------|
| 1 | Namespace `lab-vault-final` |
| 2 | ServiceAccount `checkout-app` |
| 3 | Vault KV `secret/checkout/db` with keys `password` and `user` (manual) |
| 4 | Vault policy `checkout-final` allowing read on `secret/data/checkout/*` (manual) |
| 5 | Kubernetes auth role `checkout-final` bound to SA `checkout-app` in `lab-vault-final` + policy `checkout-final` (manual) |
| 6 | Deployment `checkout` Ready, `serviceAccountName: checkout-app` |
| 7 | Pod template annotations: `agent-inject=true`, `role=checkout-final`, inject secret/template for `db` |
| 8 | `cat /vault/secrets/db` shows the password (manual) |
| 9 | Short README: port-forward Vault, how to rotate KV and restart/reload |

## Bonus (pick ≥2)

| # | Idea |
|---|------|
| B1 | Second secret file (e.g. `api`) from another KV path |
| B2 | Document a failed login with wrong SA |
| B3 | Plain K8s Secret contrast (like lab 11) left in the namespace with a warning comment in README |
| B4 | Screenshot or notes from Vault UI showing the KV version |
| B5 | Explain why `disable_iss_validation` was needed on Docker Desktop |

---

## Suggested layout

```text
~/kuber-vault/final/
├── namespace.yaml
├── serviceaccount.yaml
├── checkout.yaml          # Deployment with annotations
├── policy.hcl
├── vault-setup.sh         # kv put, policy write, auth role
└── README.md
```

## Demo script (8–10 min)

1. `kubectl -n lab-vault-final get sa,deploy,pods`  
2. Show init containers / injector  
3. `exec … cat /vault/secrets/db`  
4. `vault kv get secret/checkout/db`  
5. README walkthrough  

## Cleanup

```bash
kubectl delete namespace lab-vault-final
# optional: helm uninstall vault -n vault && kubectl delete ns vault
```

## Hard fails

- Root Vault token mounted into the app container  
- Password hardcoded in Deployment env  
- Annotations only on Deployment `.metadata`, not Pod template  
- Interactive Check failing on required objects  
