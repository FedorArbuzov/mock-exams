# 02. Lab: issuing a certificate through PKI

## Lab goal

On the [`deploy/vault`](../../deploy/vault/README.md) sandbox, issue a **leaf certificate** through the `lab-server` role, save the PEM, and verify the chain and validity period with **OpenSSL**.

## Prerequisites

- [01. PKI: overview](01-pki-overview.md)
- [secrets-basic](../secrets-basic/README.md) — basic `vault` commands (if you did it)
- Docker; `bash` (Git Bash / WSL) or PowerShell + `docker exec`
- OpenSSL in PATH

```bash
cd deploy/vault
docker compose up -d
# wait until healthy
bash scripts/init-engines.sh
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
```

Windows (without a local `vault`):

```powershell
$env:VAULT_ADDR = "http://localhost:8200"
$env:VAULT_TOKEN = "course"
docker exec -e VAULT_TOKEN=course mock-vault vault status
```

---

## Task 1. Check PKI

**Why:** confirm the root and role exist.

```bash
vault read pki/cert/ca
vault read pki/roles/lab-server
```

**What you'll see:** the CA PEM in the `certificate` field; in the role — `allowed_domains` with `lab.mock-exams.local`.

**If `no handler for route`:** `init-engines.sh` hasn't been run — run it again.

---

## Task 2. Issue a certificate

**Why:** walk through the full issuance path.

```bash
mkdir -p /tmp/vault-pki-lab   # Git Bash / WSL; on Windows — %TEMP%\vault-pki-lab
vault write -format=json pki/issue/lab-server \
  common_name="api.lab.mock-exams.local" \
  alt_names="api.lab.mock-exams.local,localhost" \
  ip_sans="127.0.0.1" \
  ttl=24h > /tmp/vault-pki-lab/issue.json
```

Extract the fields (jq or by hand):

```bash
jq -r '.data.certificate' /tmp/vault-pki-lab/issue.json > /tmp/vault-pki-lab/leaf.crt
jq -r '.data.private_key' /tmp/vault-pki-lab/issue.json > /tmp/vault-pki-lab/leaf.key
jq -r '.data.issuing_ca' /tmp/vault-pki-lab/issue.json > /tmp/vault-pki-lab/issuing_ca.crt
chmod 600 /tmp/vault-pki-lab/leaf.key
```

**Criterion:** the files exist; `leaf.key` is not world-readable ([linux-security/07](../linux-security/07-secrets-disk.md)).

---

## Task 3. OpenSSL verification

```bash
openssl x509 -in /tmp/vault-pki-lab/leaf.crt -noout -subject -issuer -dates -ext subjectAltName
openssl verify -CAfile /tmp/vault-pki-lab/issuing_ca.crt /tmp/vault-pki-lab/leaf.crt
```

**What you'll see:** `subject=CN = api.lab.mock-exams.local`, a SAN with localhost and 127.0.0.1, `OK` on verify.

**If verify fails:** download the CA from Vault:

```bash
vault read -field=certificate pki/cert/ca > /tmp/vault-pki-lab/ca.crt
openssl verify -CAfile /tmp/vault-pki-lab/ca.crt /tmp/vault-pki-lab/leaf.crt
```

---

## Task 4. Role constraint (optional)

Try to issue a cert for someone else's domain:

```bash
vault write pki/issue/lab-server common_name="evil.example.com" ttl=1h
```

**Expected:** a policy/role error (domain not allowed).

Record the error text — it will come in handy for [12-interview-qa](12-interview-qa.md).

---

## Task 5. CSR flow (recommended)

**Why:** the private key never leaves your machine.

```bash
openssl req -new -newkey rsa:2048 -nodes \
  -keyout /tmp/vault-pki-lab/csr.key \
  -out /tmp/vault-pki-lab/request.csr \
  -subj "/CN=api.lab.mock-exams.local"

vault write -format=json pki/sign/lab-server \
  csr=@/tmp/vault-pki-lab/request.csr \
  ttl=24h | jq -r '.data.certificate' > /tmp/vault-pki-lab/csr-signed.crt
```

Compare: with **issue** Vault knew the private key; with **sign** — only the CSR.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| `connection refused` | `docker compose ps`, healthcheck |
| `permission denied` | `export VAULT_TOKEN=course` |
| `unknown role lab-server` | `bash scripts/init-engines.sh` |
| `domain not allowed` | The CN must end with `lab.mock-exams.local` |
| No `jq` | parse the JSON by hand or use `-format=yaml` |

---

## Success criteria

- [ ] A cert issued with a correct CN/SAN
- [ ] `openssl verify` returns `OK`
- [ ] You understand the difference between **issue** and **sign**
- [ ] The private key has **600** permissions (not in the repository)

---

## What to say at the interview

"In the lab we brought up an internal CA via `pki/root/generate/internal`, constrained issuance with the role's `allowed_domains`, issued a 24h leaf, and verified the chain with openssl. In prod I'd prefer CSR or cert-manager + a Vault issuer, plus expiry monitoring."

Next lesson: [03. Rotation and renewal](03-rotation-renewal.md).
