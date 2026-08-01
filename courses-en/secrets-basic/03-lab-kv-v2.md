# 03. Lab: KV v2 — put, get, versions, and metadata

## Lab goal

Bring up the Vault stand, enable **KV v2** on `secret/`, write secrets for the `checkout` service, read fields, update a version, inspect **metadata**, and optionally delete/restore a version.

## Prerequisites

- Docker, port **8200** free.
- From the repository root:

```bash
cd deploy/vault
docker compose up -d
docker compose ps
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
bash scripts/smoke.sh
```

Theory: [02. Vault architecture](02-vault-architecture.md).

**CLI:** local `vault` or this prefix:

```bash
V="docker exec -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN=course mock-vault vault"
```

---

## Task 1. Status and mount

**Why:** confirm unsealed and that the engine is available.

```bash
$V status
$V secrets list
```

**What you’ll see:** `Sealed: false`; in the list `secret/` type `kv`, options `version:2` (after smoke).

If `secret/` is missing:

```bash
$V secrets enable -path=secret kv-v2
```

---

## Task 2. Write the checkout secret

**Why:** learn `kv put` and the path convention `course/…`.

```bash
$V kv put secret/course/checkout/db \
  username=checkout_app password='LabOnly-ChangeMe' host=postgres.lab

$V kv get secret/course/checkout/db
```

**What you’ll see:** a key/value table; `password` is shown (UI can hide it — CLI shows it).

---

## Task 3. Field via `-field`

```bash
$V kv get -field=username secret/course/checkout/db
$V kv get -format=json secret/course/checkout/db | head -20
```

**What you’ll see:** `checkout_app`; JSON with `data.data` and `data.metadata` blocks.

---

## Task 4. Second version (rotation tabletop)

**Why:** KV v2 keeps version history.

```bash
$V kv put secret/course/checkout/db \
  username=checkout_app password='LabOnly-Rotated-v2' host=postgres.lab

$V kv get secret/course/checkout/db
$V kv metadata get secret/course/checkout/db
```

**What you’ll see:** `version` increased; metadata shows a `versions` map with `created_time`.

---

## Task 5. Read an old version

```bash
$V kv get -version=1 secret/course/checkout/db
```

**What you’ll see:** password `LabOnly-ChangeMe` (version 1).

---

## Task 6. UI

1. [http://localhost:8200/ui](http://localhost:8200/ui) — Token `course`.
2. **Secrets** → `secret` → `course/checkout/db`.
3. **Version History** tab.

---

## Task 7. Patch (optional)

```bash
$V kv patch secret/course/checkout/db host=postgres-vip.lab
$V kv get -field=host secret/course/checkout/db
```

**What you’ll see:** host updated without rewriting all keys (new version).

---

## Task 8. Soft-delete a version (optional)

```bash
$V kv delete -versions=1 secret/course/checkout/db
$V kv metadata get secret/course/checkout/db
```

**What you’ll see:** version 1 marked deleted; `kv get -version=1` — error.

Restore:

```bash
$V kv undelete -versions=1 secret/course/checkout/db
```

---

## Success criteria

- [ ] `vault status` — unsealed
- [ ] Mount `secret/` kv-v2
- [ ] Secret `secret/course/checkout/db` created, get works
- [ ] Two password versions; `metadata get` shows both
- [ ] `-version=1` reads the old value
- [ ] History visible in the UI

## Takeaways for work

- Logical path: **`secret/course/<service>/<name>`**
- Rotating a static secret = **new KV version**, not editing Git
- Policies are written on `secret/data/...` (next lab)

Next lesson: [04. ACL policies](04-policies-acl.md).
