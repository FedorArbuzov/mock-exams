# 02. Лаба: выдача сертификата через PKI

## Цель лабы

На стенде [`deploy/vault`](../../deploy/vault/README.md) выпустить **leaf-сертификат** через role `lab-server`, сохранить PEM, проверить цепочку и срок действия с помощью **OpenSSL**.

## Предварительно

- [01. PKI: обзор](01-pki-overview.md)
- [secrets-basic](../secrets-basic/README.md) — базовые `vault` команды (если проходили)
- Docker; `bash` (Git Bash / WSL) или PowerShell + `docker exec`
- OpenSSL в PATH

```bash
cd deploy/vault
docker compose up -d
# дождитесь healthy
bash scripts/init-engines.sh
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
```

Windows (без локального `vault`):

```powershell
$env:VAULT_ADDR = "http://localhost:8200"
$env:VAULT_TOKEN = "course"
docker exec -e VAULT_TOKEN=course mock-vault vault status
```

---

## Задание 1. Проверка PKI

**Зачем:** убедиться, что root и role существуют.

```bash
vault read pki/cert/ca
vault read pki/roles/lab-server
```

**Что увидите:** PEM CA в поле `certificate`; в role — `allowed_domains` с `lab.mock-exams.local`.

**Если `no handler for route`:** не выполнен `init-engines.sh` — запустите снова.

---

## Задание 2. Issue сертификата

**Зачем:** пройти полный путь выдачи.

```bash
mkdir -p /tmp/vault-pki-lab   # Git Bash / WSL; на Windows — %TEMP%\vault-pki-lab
vault write -format=json pki/issue/lab-server \
  common_name="api.lab.mock-exams.local" \
  alt_names="api.lab.mock-exams.local,localhost" \
  ip_sans="127.0.0.1" \
  ttl=24h > /tmp/vault-pki-lab/issue.json
```

Извлеките поля (jq или вручную):

```bash
jq -r '.data.certificate' /tmp/vault-pki-lab/issue.json > /tmp/vault-pki-lab/leaf.crt
jq -r '.data.private_key' /tmp/vault-pki-lab/issue.json > /tmp/vault-pki-lab/leaf.key
jq -r '.data.issuing_ca' /tmp/vault-pki-lab/issue.json > /tmp/vault-pki-lab/issuing_ca.crt
chmod 600 /tmp/vault-pki-lab/leaf.key
```

**Критерий:** файлы существуют; `leaf.key` не world-readable ([linux-security/07](../linux-security/07-secrets-disk.md)).

---

## Задание 3. Верификация OpenSSL

```bash
openssl x509 -in /tmp/vault-pki-lab/leaf.crt -noout -subject -issuer -dates -ext subjectAltName
openssl verify -CAfile /tmp/vault-pki-lab/issuing_ca.crt /tmp/vault-pki-lab/leaf.crt
```

**Что увидите:** `subject=CN = api.lab.mock-exams.local`, SAN с localhost и 127.0.0.1, `OK` на verify.

**Если verify fail:** скачайте CA с Vault:

```bash
vault read -field=certificate pki/cert/ca > /tmp/vault-pki-lab/ca.crt
openssl verify -CAfile /tmp/vault-pki-lab/ca.crt /tmp/vault-pki-lab/leaf.crt
```

---

## Задание 4. Ограничение role (опционально)

Попробуйте выдать cert на чужой домен:

```bash
vault write pki/issue/lab-server common_name="evil.example.com" ttl=1h
```

**Ожидание:** ошибка policy/role (domain not allowed).

Зафиксируйте текст ошибки — пригодится для [12-interview-qa](12-interview-qa.md).

---

## Задание 5. CSR flow (рекомендуется)

**Зачем:** private key не покидает вашу машину.

```bash
openssl req -new -newkey rsa:2048 -nodes \
  -keyout /tmp/vault-pki-lab/csr.key \
  -out /tmp/vault-pki-lab/request.csr \
  -subj "/CN=api.lab.mock-exams.local"

vault write -format=json pki/sign/lab-server \
  csr=@/tmp/vault-pki-lab/request.csr \
  ttl=24h | jq -r '.data.certificate' > /tmp/vault-pki-lab/csr-signed.crt
```

Сравните: при **issue** Vault знал private key; при **sign** — только CSR.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| `connection refused` | `docker compose ps`, healthcheck |
| `permission denied` | `export VAULT_TOKEN=course` |
| `unknown role lab-server` | `bash scripts/init-engines.sh` |
| `domain not allowed` | CN должен заканчиваться на `lab.mock-exams.local` |
| Нет `jq` | парсите JSON вручную или используйте `-format=yaml` |

---

## Критерии успеха

- [ ] Выпущен cert с корректным CN/SAN
- [ ] `openssl verify` возвращает `OK`
- [ ] Понимаете разницу **issue** vs **sign**
- [ ] Private key с правами **600** (не в репозитории)

---

## Что сказать на собеседовании

«На lab мы подняли internal CA через `pki/root/generate/internal`, ограничили выдачу role `allowed_domains`, выпустили leaf на 24h и проверили цепочку openssl. В prod предпочёл бы CSR или cert-manager + Vault issuer, мониторинг expiry.»

Следующий урок: [03. Ротация и renewal](03-rotation-renewal.md).
