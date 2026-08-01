# 05. Lab: readonly policy and a limited-rights token

## Lab goal

Load the policy from [`deploy/vault/examples/policy-readonly.hcl`](../../deploy/vault/examples/policy-readonly.hcl), issue a **limited token**, confirm that read works, and that `kv put` and access outside `course/*` return **403**.

## Prerequisites

- Vault stand up, [lab 03](03-lab-kv-v2.md) completed (`secret/course/checkout/db` exists).
- Root: `VAULT_TOKEN=course`.

```bash
V="docker exec -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN=course mock-vault vault"
```

---

## Task 1. Write the policy

**Why:** policy as a file — a reproducible artifact.

From the host (Git Bash / WSL), from the repo root:

```bash
docker exec -i -e VAULT_TOKEN=course mock-vault vault policy write course-readonly - \
  < deploy/vault/examples/policy-readonly.hcl
```

Verification:

```bash
$V policy read course-readonly
```

**What you’ll see:** two `path` blocks with `read`, `list`.

---

## Task 2. Create a limited token

```bash
$V token create -policy=course-readonly -ttl=30m -display-name=lab-readonly -format=json \
  | grep -E '"client_token"|"accessor"'
```

Save `client_token` to a variable (example):

```bash
READONLY_TOKEN="<paste client_token>"
```

---

## Task 3. Read allowed

```bash
docker exec -e VAULT_TOKEN="$READONLY_TOKEN" mock-vault \
  vault kv get secret/course/checkout/db
```

**What you’ll see:** successful get of username/password.

---

## Task 4. Write denied

```bash
docker exec -e VAULT_TOKEN="$READONLY_TOKEN" mock-vault \
  vault kv put secret/course/checkout/db password=hacked || true
```

**What you’ll see:** `permission denied` (exit code ≠ 0).

---

## Task 5. Path outside course denied

With root, create a secret outside the prefix (if not already present):

```bash
$V kv put secret/other/secret value=1
```

With readonly:

```bash
docker exec -e VAULT_TOKEN="$READONLY_TOKEN" mock-vault \
  vault kv get secret/other/secret || true
```

**What you’ll see:** permission denied.

---

## Task 6. Capabilities (optional)

```bash
$V token capabilities "$READONLY_TOKEN" secret/data/course/checkout/db
```

**What you’ll see:** `read`, `list` (no `create`, `update`, `delete`).

---

## Task 7. UI with readonly token (optional)

1. Logout in the UI → Login Token → paste `READONLY_TOKEN`.
2. Open `secret/course/checkout/db` — read OK.
3. Try **Create new version** — access error.

---

## Success criteria

- [ ] Policy `course-readonly` loaded from examples
- [ ] Token with sole policy `course-readonly` created
- [ ] `kv get` on `secret/course/checkout/db` succeeds
- [ ] `kv put` with readonly token — denied
- [ ] `secret/other/secret` inaccessible to readonly

## Takeaways for work

- CI should use a **token/role**, not root
- Policy file in the repo → review in MR
- Check: `token capabilities` before issuing to prod

Next lesson: [06. Auth methods](06-auth-methods.md).
