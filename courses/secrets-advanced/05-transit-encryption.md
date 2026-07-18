# 05. Transit: encryption-as-a-service

## Введение: «Ключ шифрования лежал рядом с ciphertext»

Команда зашифровала PII в PostgreSQL ключом из **configmap**. Бэкап БД + configmap утекли вместе — данные расшифровались offline. **Transit** разделяет роли: приложение видит **ciphertext**, мастер-ключ остаётся в Vault, ротация **key version** без перешифровки всей БД сразу (re-wrap).

## Что вы узнаете

- Модель **encryption-as-a-service** (EaaS).
- `transit/` paths: keys, encrypt, decrypt, rewrap.
- **Key versioning**, `min_decryption_version`, `min_encryption_version`.
- Convergent encryption и HMAC (обзор).
- Сравнение с [AWS KMS](../aws-intermediate/11-secrets-kms.md).

---

## Зачем Transit, если есть KMS

| | Transit | AWS KMS |
|---|---------|---------|
| Deployment | Vault cluster | Managed AWS |
| Формат ciphertext | `vault:v1:...` prefix | AWS SDK blob |
| Multi-cloud | Да | AWS-centric |
| Policy | Vault ACL | IAM |

Оба дают **envelope**: data key / DEK шифруется KEK в HSM/software. Transit удобен, когда секреты уже централизованы в Vault ([secrets-basic](../secrets-basic/README.md)).

---

## Включение (стенд)

`init-engines.sh` выполняет:

```bash
vault secrets enable transit
```

Создание именованного ключа:

```bash
vault write -f transit/keys/course-app type=aes256-gcm96
vault read transit/keys/course-app
```

| Параметр | Смысл |
|----------|--------|
| `type` | `aes256-gcm96`, `chacha20-poly1305`, `rsa-2048`, … |
| `derived` | Контекстно-зависимый ключ (convergent) |
| `exportable` | **false** в prod — запрет выгрузки key material |
| `allow_plaintext_backup` | **false** в prod |

---

## Encrypt / decrypt

```bash
vault write transit/encrypt/course-app plaintext=$(echo -n 'user:42:email' | base64)

vault write transit/decrypt/course-app ciphertext=vault:v1:...
```

**Plaintext** в API — base64. Ответ `ciphertext` начинается с `vault:v1:` — версия ключа встроена.

Приложение (псевдокод):

```python
# Храните в БД только ciphertext
ct = vault.secrets.transit.encrypt(name="course-app", plaintext=b"...")
pt = vault.secrets.transit.decrypt(name="course-app", ciphertext=ct["ciphertext"])
```

Vault **не** хранит ваши бизнес-данные — только ключи и audit записи операций.

---

## Ротация ключей

```bash
vault write -f transit/keys/course-app/rotate
vault write transit/keys/course-app/config min_encryption_version=2
```

| Операция | Эффект |
|----------|--------|
| `rotate` | Новая **latest** version; старые ciphertext расшифровываются |
| `rewrap` | Перешифровать ciphertext на новую version без decrypt в app |
| `min_encryption_version` | Новые encrypt только v2+ |

**На собеседовании:** «Нужно ли перечитывать всю БД при rotate?» — нет сразу: lazy **rewrap** при чтении или batch job.

---

## Sign / verify (обзор)

Transit также умеет **signing** (отдельно от PKI X.509):

```bash
vault write transit/keys/sign-key type=ed25519
vault write transit/sign/sign-key input=$(echo -n 'payload' | base64)
```

PKI — для TLS/mTLS; Transit sign — для **payload integrity** (JWT-like, webhook).

---

## Policy least privilege

```hcl
path "transit/encrypt/course-app" {
  capabilities = ["update"]
}
path "transit/decrypt/course-app" {
  capabilities = ["update"]
}
# Нет доступа к export key material
```

Encrypt-only роль для writer-сервиса; decrypt — только reader. См. также [`deploy/vault/examples/policy-readonly.hcl`](../../deploy/vault/examples/policy-readonly.hcl) для KV.

---

## Anti-patterns

| Плохо | Лучше |
|-------|-------|
| `exportable=true` без причины | Keys never leave Vault |
| Один transit key на всю компанию | Key per app / tenant |
| Decrypt в браузере | Decrypt только на backend |
| Хранить plaintext в audit | Audit логирует **request**, не payload (настройка) |

---

## Резюме

- Transit = **KEK в Vault**, ciphertext у вас.
- Rotate + rewrap — без Big Bang migration.
- Следующий шаг: [06. Лаба: Transit](06-lab-transit.md).
