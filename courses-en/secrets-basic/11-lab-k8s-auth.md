# 11. Lab: Kubernetes auth — tabletop and optional mockctl

## Lab goal

Dissect the **Vault Kubernetes role** from [`examples/k8s-auth-role.json`](examples/k8s-auth-role.json), map it to a ServiceAccount from [kuber-basic/12](../kuber-basic/12-config-and-secret.md), and run a **tabletop** login flow. Optional: enable `kubernetes` auth on a `mockctl` cluster.

## Prerequisites

- [10. Vault and Kubernetes](10-kubernetes-vault.md), policy `course-readonly`.
- Role file: [`examples/k8s-auth-role.json`](examples/k8s-auth-role.json).

---

## Part A — Tabletop (required)

### Task 1. Read the role JSON

Open `examples/k8s-auth-role.json`. Fill in the table:

| Field | Value in file | Meaning |
|------|------------------|--------|
| `bound_service_account_names` | | which SA is allowed |
| `bound_service_account_namespaces` | | in which namespace |
| `policies` | | which Vault policies |
| `ttl` / `max_ttl` | | token lifetime |

**What you’ll see:** binding of `checkout-app` in namespace `checkout` to policy `course-readonly`, TTL 1h (max 24h).

---

### Task 2. SA manifest (on paper)

Sketch a Deployment fragment (do not apply without a cluster):

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: checkout-app
  namespace: checkout
---
spec:
  serviceAccountName: checkout-app
  containers:
    - name: app
      image: my-checkout:1.0
      # env from Vault Agent file — do not hardcode password
```

Cross-check with [kuber-basic/12](../kuber-basic/12-config-and-secret.md).

---

### Task 3. Login flow (in writing)

Describe 5 steps: Pod starts → … → `vault kv get secret/course/checkout/db`.

**Criterion:** mention JWT path `/var/run/secrets/kubernetes.io/serviceaccount/token`, `auth/kubernetes/login`, role name `checkout-app`.

---

### Task 4. Negative cases

| Scenario | Expectation |
|----------|----------|
| SA `default` in `checkout` | login denied |
| SA `checkout-app` in `kube-system` | login denied |
| Role TTL expired | 403, Agent renew |

---

## Part B — mockctl (optional)

Requires: `mockctl up`, `kubectl`, Vault on host `localhost:8200`.

### Task 5. Namespace and SA

```bash
kubectl create namespace checkout
kubectl -n checkout create serviceaccount checkout-app
```

---

### Task 6. Enable kubernetes auth (admin)

```bash
export VAULT_ADDR=http://localhost:8200 VAULT_TOKEN=course
vault auth enable kubernetes 2>/dev/null || true
# kubernetes_host and reviewer JWT — see Vault docs for your cluster
# Simplified for lab: use the official guide for the mockctl API endpoint
```

> If the API config is unavailable — stop at part A; credit the lab via tabletop.

---

### Task 7. Write the role

```bash
vault write auth/kubernetes/role/checkout-app \
  bound_service_account_names=checkout-app \
  bound_service_account_namespaces=checkout \
  policies=course-readonly \
  ttl=1h max_ttl=24h
```

---

### Task 8. Test pod (curl job)

```bash
kubectl -n checkout run vault-test --rm -it --restart=Never \
  --serviceaccount=checkout-app \
  --image=curlimages/curl:8.7.1 --command -- sleep 300
```

From the Pod (tabletop command, if network to Vault from the cluster is set up):

```bash
JWT=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
curl -s --request POST \
  --data "{\"role\":\"checkout-app\",\"jwt\":\"$JWT\"}" \
  "$VAULT_ADDR/v1/auth/kubernetes/login"
```

**What you’ll see:** JSON with `auth.client_token` on successful setup; otherwise — record the error in the report (often network/DNS to host Vault).

---

## Success criteria

- [ ] Role JSON table filled in
- [ ] Deployment + SA aligned with bound fields
- [ ] 5 login-flow steps described
- [ ] Three negative cases documented
- [ ] (Optional) role written to Vault / test login attempted

## Takeaways for work

- **Bound** SA + namespace — the main K8s auth guardrail
- Do not mount a root Vault token into a Pod
- For local development — a separate dev role and path `course/dev/…`

Next lesson: [12. Comparing managers](12-comparison-managers.md).
