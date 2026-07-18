# 06. Лаба: Transit encrypt / decrypt / rotate

## Цель лабы

Создать ключ Transit, зашифровать и расшифровать payload, выполнить **rotate** и **rewrap**, ограничить доступ отдельной policy.

## Предварительно

- [05. Transit](05-transit-encryption.md)
- `init-engines.sh` выполнен

```bash
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
mkdir -p /tmp/vault-transit-lab
```

---

## Задание 1. Ключ и первая шифровка

```bash
vault write -f transit/keys/lab-transit type=aes256-gcm96 exportable=false

PLAINTEXT_B64=$(echo -n '{"user_id":42,"role":"admin"}' | base64 -w0 2>/dev/null || echo -n '{"user_id":42,"role":"admin"}' | base64)

vault write -format=json transit/encrypt/lab-transit plaintext="$PLAINTEXT_B64" \
  > /tmp/vault-transit-lab/enc-v1.json

CIPHER_V1=$(jq -r '.data.ciphertext' /tmp/vault-transit-lab/enc-v1.json)
echo "$CIPHER_V1"
```

**Критерий:** строка начинается с `vault:v1:`.

Расшифровка:

```bash
vault write transit/decrypt/lab-transit ciphertext="$CIPHER_V1"
```

---

## Задание 2. Rotate и rewrap

```bash
vault write -f transit/keys/lab-transit/rotate
vault read transit/keys/lab-transit

vault write -format=json transit/rewrap/lab-transit ciphertext="$CIPHER_V1" \
  > /tmp/vault-transit-lab/enc-v2.json

CIPHER_V2=$(jq -r '.data.ciphertext' /tmp/vault-transit-lab/enc-v2.json)
```

**Что увидите:** префикс версии в ciphertext изменился (например `vault:v2:`). Decrypt по-прежнему работает:

```bash
vault write transit/decrypt/lab-transit ciphertext="$CIPHER_V2"
```

**На собеседовании:** объясните, зачем **rewrap** без доступа приложения к plaintext.

---

## Задание 3. Policy encrypt-only (опционально)

Создайте policy и token:

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

**Ожидание:** encrypt OK, decrypt **permission denied**.

---

## Задание 4. Сравнение с KMS (письменно)

В 3–5 предложениях в заметках: чем этот сценарий похож на [aws-intermediate/11-secrets-kms](../aws-intermediate/11-secrets-kms.md) и когда выбрали бы AWS вместо Vault.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| `no handler for route transit/...` | `vault secrets enable transit` |
| invalid base64 | уберите переносы строк в `PLAINTEXT_B64` |
| permission denied на decrypt с root | проверьте policy name |

---

## Критерии успеха

- [ ] encrypt → decrypt roundtrip
- [ ] rotate + rewrap изменили версию в ciphertext
- [ ] (опционально) encrypt-only token не decrypt'ит

Следующий урок: [07. Dynamic secrets и AppRole](07-dynamic-secrets-approle.md).
