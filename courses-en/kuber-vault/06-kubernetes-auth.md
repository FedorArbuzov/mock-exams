# 06. Kubernetes auth and TokenReview

## Trust model

```text
Pod  →  JWT (projected SA token)
     →  POST /v1/auth/kubernetes/login  { role, jwt }
Vault →  TokenReview against Kubernetes API
     →  checks bound_service_account_names / namespaces
     →  returns Vault token with policies
```

Vault does **not** blindly trust a JWT string — it asks the cluster “is this token valid for this SA?”

## Role fields that matter

| Field | Example |
|-------|---------|
| `bound_service_account_names` | `checkout-app` |
| `bound_service_account_namespaces` | `checkout` |
| `policies` | `checkout-app` |
| `ttl` / `max_ttl` | `1h` / `24h` |

Mismatch → login denied. That is the main guardrail.

## Config on this stand

From inside `vault-0` (has a ServiceAccount and CA):

```bash
vault auth enable kubernetes

vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc:443" \
  token_reviewer_jwt="$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
  kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
  disable_iss_validation=true
```

`disable_iss_validation=true` avoids issuer mismatches on Docker Desktop / kind-style clusters. Production uses a correct `issuer` instead.

The Vault server SA needs **permission to create TokenReviews** — the Helm chart’s service account is usually bound for this; if login fails with 403 from the API, see lesson 12.

## Checklist

- [ ] Bound SA **and** namespace  
- [ ] Policy name attached to the role  

Next: [07. Lab: enable auth](07-lab-k8s-auth.md).
