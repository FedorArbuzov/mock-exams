# 11. Lab: compare inject vs plain K8s Secret

## Goal

Create a **plain** Kubernetes Secret with the same password (for contrast), then document why Injector is better for rotation/audit. No new Vault features.

## Task 1. Plain Secret (anti-pattern demo)

```bash
kubectl -n checkout create secret generic checkout-db-plain \
  --from-literal=password='lab-pass-2026' \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl -n checkout get secret checkout-db-plain -o yaml
# note: data is only base64
```

## Task 2. Write a short comparison (in your notes)

| Question | Your answer |
|----------|-------------|
| Who can `kubectl get secret` this value? | |
| Does Vault audit this read? | |
| How do you rotate without restarting Vault Agent? | |

## Task 3. Prefer inject

Confirm the injected file from lesson 09 still matches:

```bash
POD=$(kubectl -n checkout get pod -l app=checkout -o jsonpath='{.items[0].metadata.name}')
kubectl -n checkout exec "$POD" -c app -- cat /vault/secrets/db
```

## Success criteria

- [ ] Plain Secret exists (for the demo)  
- [ ] Comparison table filled  
- [ ] Interactive Check passes  

Next: [12. Troubleshooting](12-troubleshooting.md).
