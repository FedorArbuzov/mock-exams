# Interview cheatsheet — Vault Advanced

Таблицы для повторения перед собеседованием. Формат: **вопрос → короткий ответ (≈30 с) → deep dive (2–3 мин)**.

Полные развёрнутые ответы: [12-interview-qa](12-interview-qa.md). Практика: [11-lab-incident-response](11-lab-incident-response.md), [13-capstone](13-capstone.md).

**Стенд:** [`deploy/vault`](../../deploy/vault/README.md) · `bash scripts/init-engines.sh` · **Предшественник:** [`secrets-basic`](../secrets-basic/README.md) · **AWS:** [`aws-intermediate/11-secrets-kms`](../aws-intermediate/11-secrets-kms.md) · **Диск:** [`linux-security/07-secrets-disk`](../linux-security/07-secrets-disk.md)

---

## Архитектура

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 1 | Vault vs K8s Secret? | Dynamic creds, audit, policies | ESO/CSI; etcd base64 ≠ security ([kuber-basic/12](../kuber-basic/12-config-and-secret.md)) |
| 2 | Secrets engine? | Mount plugin: kv, pki, transit | Path semantics |
| 3 | KV v1 vs v2? | v2 versions + metadata | `secret/data/` path |
| 4 | Dev mode? | In-memory, known root — лаб only | [09](09-ha-raft-unseal.md) |
| 5 | Seal/unseal? | Master key in RAM after unseal | Shamir / auto-unseal |

---

## PKI

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 6 | PKI vs openssl CI? | Policy, TTL, audit, CRL | [01](01-pki-overview.md) |
| 7 | Issue vs sign? | Vault key vs local CSR key | Compliance sign flow |
| 8 | Чужой домен? | `allowed_domains` | [pki-role.json](examples/pki-role.json) |
| 9 | Leaf vs intermediate rotation? | Leaf часто; int реже | [03](03-rotation-renewal.md), [checklist](examples/rotation-checklist.md) |
| 10 | Lease на cert? | Revoke + CRL | [04-lab](04-lab-cert-rotation.md) |

---

## Transit

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 11 | Transit зачем? | KEK in Vault; app has ciphertext | [05](05-transit-encryption.md) |
| 12 | `vault:v1:`? | Key version | rotate, rewrap ([06-lab](06-lab-transit.md)) |
| 13 | Re-encrypt whole DB? | Lazy rewrap | batch job |

---

## Auth / dynamic

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 14 | AppRole когда? | CI/VM M2M | vs K8s auth ([08-lab](08-lab-approle.md)) |
| 15 | secret_id delivery? | Wrap, agent, masked — not git | [07](07-dynamic-secrets-approle.md) |
| 16 | Dynamic DB secret? | Temp SQL user, TTL drop | connection limits |
| 17 | Root in prod? | Break-glass only | revoke after init |

---

## HA / ops

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 18 | Raft quorum? | Majority for write | 3 or 5 nodes ([09](09-ha-raft-unseal.md)) |
| 19 | Auto-unseal? | KMS unwraps master key | KMS dependency |
| 20 | Audit required? | Yes prod forensics | [10](10-troubleshooting-audit.md) |

---

## Incident / design

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 21 | Leaked token steps? | Revoke, scope, rotate, fix CI | [11-lab](11-lab-incident-response.md) |
| 22 | Vault vs ASM? | Multi-cloud vs AWS native | [11-secrets-kms](../aws-intermediate/11-secrets-kms.md) |
| 23 | Secret still risky where? | RAM, logs, /tmp, backup | [07-secrets-disk](../linux-security/07-secrets-disk.md) |
| 24 | Policy debug? | `token capabilities` | KV v2 paths |
| 25 | mTLS 50 services? | Internal CA, short TTL, automation | [13-capstone](13-capstone.md) |

---

## Команды на память (стенд)

```bash
export VAULT_ADDR=http://localhost:8200 VAULT_TOKEN=course
cd deploy/vault && bash scripts/init-engines.sh

vault write pki/issue/lab-server common_name=api.lab.mock-exams.local ttl=24h
vault write transit/encrypt/course-app plaintext=$(echo -n x|base64)
vault write auth/approle/login role_id=... secret_id=...
vault token revoke <token>
vault token capabilities <token> secret/data/course/ci-demo
```

---

## Типичные ошибки на интервью

| Ошибка | Как исправить формулировку |
|--------|----------------------------|
| «Vault хранит все данные приложения» | Vault хранит **секреты и ключи**; Transit ciphertext — у вас |
| «Dev mode ок для staging» | Staging тоже needs seal, TLS, audit |
| «PKI = TLS только для браузера» | Internal mTLS mesh |
| «AppRole в каждом pod» | K8s auth + SA |
| «Rotate root CA каждый месяц» | Root редко; leaf часто |

---

## Связанные файлы курса

| Файл | Назначение |
|------|------------|
| [examples/pki-role.json](examples/pki-role.json) | Параметры role |
| [examples/rotation-checklist.md](examples/rotation-checklist.md) | Ротация CA/leaf |
| [README](README.md) | Программа и стенд |
