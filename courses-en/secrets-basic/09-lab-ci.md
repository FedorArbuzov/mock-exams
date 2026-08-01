# 09. Lab: tabletop CI — Vault KV for a deploy secret

## Lab goal

Prepare secret `secret/course/checkout/deploy`, emulate a **fetch job** and a **deploy job** with shell scripts (no GitLab Runner), and compare with [`examples/gitlab-vault-snippet.yml`](examples/gitlab-vault-snippet.yml).

## Prerequisites

- Vault up, policy `course-readonly`, and ability to create a readonly token ([05](05-lab-policies.md)).
- `jq` on the host (Git Bash/WSL) or parse manually.

```bash
V="docker exec -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN=course mock-vault vault"
```

---

## Task 1. Write the deploy secret

```bash
$V kv put secret/course/checkout/deploy \
  api_key='sk-deploy-lab-7f3a' registry_user=ci-checkout env=staging
```

**What you’ll see:** `Success! Data written to: secret/data/course/checkout/deploy`.

---

## Task 2. Readonly token for “CI”

```bash
$V token create -policy=course-readonly -ttl=1h -display-name=ci-tabletop -format=json \
  | tee /tmp/ci-token.json
```

Save `client_token` as `CI_TOKEN`.

---

## Task 3. Fetch job (emulation)

```bash
docker exec -e VAULT_TOKEN="$CI_TOKEN" mock-vault \
  vault kv get -format=json secret/course/checkout/deploy \
  > deploy-secret.json

wc -c deploy-secret.json
```

**What you’ll see:** file > 200 bytes, JSON with `data.data.api_key`.

---

## Task 4. Deploy job — use, don’t print

```bash
jq -r '.data.data.api_key' deploy-secret.json | wc -c
jq -r '.data.data.env' deploy-secret.json
```

**What you’ll see:** key length > 10; `staging`. **Do not** run `cat deploy-secret.json` on a shared screen.

---

## Task 5. Negative: write from CI token

```bash
docker exec -e VAULT_TOKEN="$CI_TOKEN" mock-vault \
  vault kv put secret/course/checkout/deploy api_key=hacked || true
```

**What you’ll see:** permission denied.

---

## Task 6. Cleanup and revoke

```bash
docker exec -e VAULT_TOKEN="$CI_TOKEN" mock-vault vault token revoke -self
rm -f deploy-secret.json /tmp/ci-token.json
```

---

## Task 7. Map to the snippet (optional)

Open [`examples/gitlab-vault-snippet.yml`](examples/gitlab-vault-snippet.yml). Mark:

- which stage matches task 3;
- where the artifact is;
- what to add in `after_script` for revoke (tabletop: task 6).

---

## Task 8. GitLab (optional)

If you have GitLab: create masked variables `VAULT_ADDR`, `VAULT_TOKEN` (readonly), paste the snippet into a test project, run the pipeline on a protected branch.

---

## Success criteria

- [ ] KV `secret/course/checkout/deploy` created
- [ ] Fetch with readonly token → `deploy-secret.json`
- [ ] `jq` extracts `env` without printing `api_key` to the console
- [ ] Put with CI token denied
- [ ] Token revoked, file deleted

## Takeaways for work

- **Two-stage** fetch/deploy pattern
- Readonly policy for CI
- Revoke + artifact deletion as hygiene

Next lesson: [10. Vault and Kubernetes](10-kubernetes-vault.md).
