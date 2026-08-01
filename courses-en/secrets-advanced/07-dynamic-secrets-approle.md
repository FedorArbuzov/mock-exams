# 07. Dynamic secrets and AppRole

## Intro: "One DB password for 200 microservices"

The shared credential `app_user` / `s3cr3t` in [tfvars](../aws-intermediate/12-lab-secrets-kms.md) once ended up in Slack. Changing the password is a **coordination nightmare**. **Dynamic secrets** hand out **unique** credentials per lease; **AppRole** is machine-to-machine auth without a human login.

## What you'll learn

- Database / AWS / PKI **dynamic** engines (overview).
- **AppRole**: `role_id` + `secret_id` → token.
- `secret_id` delivery, wrapping, TTL.
- Link to CI ([gitlab-basic/07](../gitlab-basic/07-variables-secrets.md)).

---

## Dynamic secrets (the model)

```mermaid
sequenceDiagram
  participant App as Application
  participant V as Vault
  participant DB as Database
  App->>V: login + request creds
  V->>DB: CREATE USER ... PASSWORD ...
  V-->>App: username/password + lease
  Note over V,DB: lease expiry → DROP USER
```

| Engine | Issues |
|--------|--------|
| `database` | SQL user/password |
| `aws` | IAM access key (legacy) or STS |
| `pki` | cert + key (short-lived) |
| `ssh` | OTP / signed key |

Vault holds the **admin connection** to the DB; the application receives a **temporary** user.

Example (concept, no DB on the sandbox):

```bash
vault write database/config/mydb \
  plugin_name=postgresql-database-plugin \
  connection_url="postgresql://{{username}}:{{password}}@postgres:5432/mydb" \
  allowed_roles="readonly"

vault write database/roles/readonly \
  db_name=mydb \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';" \
  default_ttl=1h
```

---

## AppRole: why

| Method | Who uses it |
|-------|----------------|
| Userpass / OIDC | People |
| Kubernetes auth | Pods with an SA JWT |
| **AppRole** | CI, VMs without K8s, legacy batch |

Two factors of machine auth:

1. **role_id** — like a username (less secret, but don't publish it in git)
2. **secret_id** — a one-time/rotatable delivery secret

```bash
vault auth enable approle

vault write auth/approle/role/ci-deploy \
  token_policies="lab-transit-encrypt" \
  token_ttl=15m \
  token_max_ttl=1h \
  secret_id_ttl=10m \
  secret_id_num_uses=1

vault read auth/approle/role/ci-deploy/role-id
vault write -f auth/approle/role/ci-deploy/secret-id
```

Login:

```bash
vault write auth/approle/login \
  role_id="<role_id>" \
  secret_id="<secret_id>"
```

The response is a **client token** with a restricted policy.

---

## Delivering the secret_id

| Method | Comment |
|--------|-------------|
| CI masked variable | The minimum for this course |
| **Response wrapping** | `vault write -wrap-ttl=120s ...` — a one-time token |
| Vault Agent | A file on the VM with 600 permissions |
| Cloud metadata | Careful with SSRF |

Never: a secret_id in a plain pipeline log ([linux-security/07](../linux-security/07-secrets-disk.md) — history, artifacts).

---

## secret_id constraints

| Parameter | Meaning |
|----------|--------|
| `secret_id_num_uses` | How many logins |
| `secret_id_ttl` | Lifetime |
| `bind_secret_id` | false — only for special cases |
| `token_bound_cidrs` | IP allowlist |

**At the interview:** "AppRole vs K8s auth?" — inside a cluster, **Kubernetes auth** + projected SA is preferable; AppRole is for CI outside the cluster.

---

## Token lifecycle

After login:

```bash
vault token lookup
vault token renew <token>    # if renewable
vault token revoke <token>   # on compromise
```

Periodic tokens and **orphan** tokens are covered in [09-ha-raft-unseal](09-ha-raft-unseal.md) and [10-troubleshooting-audit](10-troubleshooting-audit.md).

---

## Anti-patterns

| Bad | Better |
|-------|-------|
| A root token in the CI `VAULT_TOKEN` | AppRole + a minimal policy |
| `secret_id_num_uses=0` unlimited | Limit uses and TTL |
| One AppRole for all envs | role per env: `ci-deploy-prod` |
| A static DB password in KV "just in case" | Dynamic only |

---

## Summary

- Dynamic secrets are **short-lived** credentials with automatic revocation.
- AppRole is **M2M** for CI/VMs; protect the secret_id.
- Next step: [08. Lab: AppRole](08-lab-approle.md).
