# 04. KV v2 paths and policies for apps

## KV v2 path shape

With mount at `secret/`:

| Action | Path |
|--------|------|
| Write/read data | `secret/data/checkout/db` |
| Metadata | `secret/metadata/checkout/db` |

CLI convenience:

```bash
vault kv put secret/checkout/db password='lab-pass-2026' user=checkout
vault kv get secret/checkout/db
```

Policies must allow `secret/data/...` (and often `secret/metadata/...` for list).

## Minimal app policy

```hcl
path "secret/data/checkout/*" {
  capabilities = ["read"]
}

path "secret/metadata/checkout/*" {
  capabilities = ["read", "list"]
}
```

Name it `checkout-app` — same string as the Kubernetes auth **role** and Injector annotation role.

## Least privilege

| Bad | Better |
|-----|--------|
| Root token in a Pod | K8s auth + `checkout-app` policy |
| `secret/data/*` read for every app | path per team / service |
| Infinite TTL | role `ttl=1h` |

## Checklist

- [ ] You remember `data/` in policy paths for KV v2  
- [ ] Policy name will match the auth role  

Next: [05. Lab: KV and policy](05-lab-kv-policy.md).
