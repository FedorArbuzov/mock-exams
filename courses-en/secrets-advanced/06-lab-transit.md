# 06. Lab: Transit encrypt / decrypt / rotate

## Lab goal

Create a Transit key, encrypt and decrypt a payload, perform a **rotate** and **rewrap**, and restrict access with a dedicated policy.

## Prerequisites

- [05. Transit](05-transit-encryption.md)
- `init-engines.sh` has been run

```bash
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
mkdir -p /tmp/vault-transit-lab
```

---

## Task 1. Key and first encryption

```bash
vault write -f transit/keys/lab-transit type=aes256-gcm96 exportable=false

PLAINTEXT_B64=$(echo -n '{"user_id":42,"role":"admin"}' | base64 -w0 2>/dev/null || echo -n '{"user_id":42,"role":"admin"}' | base64)

vault write -format=json transit/encrypt/lab-transit plaintext="$PLAINTEXT_B64" \
  > /tmp/vault-transit-lab/enc-v1.json

CIPHER_V1=$(jq -r '.data.ciphertext' /tmp/vault-transit-lab/enc-v1.json)
echo "$CIPHER_V1"
```

**Criterion:** the string starts with `vault:v1:`.

Decryption:

```bash
vault write transit/decrypt/lab-transit ciphertext="$CIPHER_V1"
```

---

## Task 2. Rotate and rewrap

```bash
vault write -f transit/keys/lab-transit/rotate
vault read transit/keys/lab-transit

vault write -format=json transit/rewrap/lab-transit ciphertext="$CIPHER_V1" \
  > /tmp/vault-transit-lab/enc-v2.json

CIPHER_V2=$(jq -r '.data.ciphertext' /tmp/vault-transit-lab/enc-v2.json)
```

**What you'll see:** the version prefix in the ciphertext has changed (for example `vault:v2:`). Decrypt still works:

```bash
vault write transit/decrypt/lab-transit ciphertext="$CIPHER_V2"
```

**At the interview:** explain why **rewrap** matters without the application having access to plaintext.

---

## Task 3. Encrypt-only policy (optional)

Create a policy and a token:

```hcl
# /tmp/vault-transit-lab/encrypt-only.hcl
path "transit/encrypt/lab-transit" {
  capabilities = ["update"]
}
path "transit/keys/lab-transit" {
  capabilities = ["read"]
}
```

```bash
vault policy write lab-transit-encrypt /tmp/vault-transit-lab/encrypt-only.hcl
vault token create -policy=lab-transit-encrypt -format=json > /tmp/vault-transit-lab/enc-token.json
ENC_TOKEN=$(jq -r '.auth.client_token' /tmp/vault-transit-lab/enc-token.json)

VAULT_TOKEN=$ENC_TOKEN vault write transit/encrypt/lab-transit plaintext="$PLAINTEXT_B64"
VAULT_TOKEN=$ENC_TOKEN vault write transit/decrypt/lab-transit ciphertext="$CIPHER_V2"
```

**Expected:** encrypt OK, decrypt **permission denied**.

---

## Task 4. Comparison with KMS (in writing)

In 3–5 sentences in your notes: how this scenario resembles [aws-intermediate/11-secrets-kms](../aws-intermediate/11-secrets-kms.md) and when you'd choose AWS over Vault.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| `no handler for route transit/...` | `vault secrets enable transit` |
| invalid base64 | remove line breaks in `PLAINTEXT_B64` |
| permission denied on decrypt with root | check the policy name |

---

## Success criteria

- [ ] encrypt → decrypt roundtrip
- [ ] rotate + rewrap changed the version in the ciphertext
- [ ] (optional) the encrypt-only token can't decrypt

Next lesson: [07. Dynamic secrets and AppRole](07-dynamic-secrets-approle.md).
