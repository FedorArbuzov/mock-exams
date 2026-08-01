# 07. Lab: token TTL, renew, and revoke

## Lab goal

Create a token with a short **TTL**, check `token lookup`, run **renew**, then **revoke**, and confirm that `kv get` no longer works.

## Prerequisites

- Policy `course-readonly` from [lab 05](05-lab-policies.md).
- Secret `secret/course/checkout/db` in place.

```bash
V="docker exec -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN=course mock-vault vault"
```

---

## Task 1. Token with 5-minute TTL

```bash
$V token create -policy=course-readonly -ttl=5m -renewable=true \
  -display-name=lab-ttl -format=json > /tmp/vault-token.json
```

Extract the token (jq or manually from JSON):

```bash
# Git Bash / WSL:
export LAB_TOKEN=$(grep -o '"client_token": "[^"]*"' /tmp/vault-token.json | cut -d'"' -f4)
```

PowerShell: copy `client_token` into `$env:LAB_TOKEN`.

---

## Task 2. Lookup

```bash
docker exec -e VAULT_TOKEN="$LAB_TOKEN" mock-vault vault token lookup
```

**What you’ll see:** `ttl` around 300s, `renewable: true`, policies include `course-readonly`.

---

## Task 3. KV access

```bash
docker exec -e VAULT_TOKEN="$LAB_TOKEN" mock-vault \
  vault kv get -field=username secret/course/checkout/db
```

**What you’ll see:** `checkout_app`.

---

## Task 4. Renew

```bash
docker exec -e VAULT_TOKEN="$LAB_TOKEN" mock-vault vault token renew
docker exec -e VAULT_TOKEN="$LAB_TOKEN" mock-vault vault token lookup | grep ttl
```

**What you’ll see:** `ttl` close to 5m again (lease reset).

---

## Task 5. Revoke

```bash
docker exec -e VAULT_TOKEN="$LAB_TOKEN" mock-vault vault token revoke -self
```

**What you’ll see:** `success! revoked`.

---

## Task 6. Access after revoke

```bash
docker exec -e VAULT_TOKEN="$LAB_TOKEN" mock-vault \
  vault kv get secret/course/checkout/db || true
```

**What you’ll see:** `permission denied` or invalid token.

---

## Task 7. Tabletop: CI job end (optional)

In three sentences in your notes, explain why a deploy job should call `vault token revoke -self` in `after_script`, even if the deploy failed.

---

## Success criteria

- [ ] Token created with `-ttl=5m` and readonly policy
- [ ] `lookup` shows ttl and renewable
- [ ] `kv get` works before revoke
- [ ] `renew` increases ttl
- [ ] After `revoke -self`, get fails

## Takeaways for work

- Short TTL + renew Agent/sidecar in prod
- Revoke at CI end shrinks the leak window
- Do not store a child token in an artifact without encryption

Next lesson: [08. GitLab CI and Vault](08-ci-gitlab-vault.md).
