# HashiCorp Vault — Advanced

Продвинутый уровень для **собеседований** и **production-minded** практики: **PKI** (внутренний CA, выдача сертификатов), **ротация и renewal**, **Transit** (encryption-as-a-service), **динамические секреты** и **AppRole**, **HA / Raft / unseal** (теория), **audit** и **incident response**, **mock interview** и **capstone**.

**Предварительно:** [`secrets-basic`](../secrets-basic/README.md) — KV v2, policies, tokens, первый контакт с Vault CLI и UI.

**Локально:** [`deploy/vault`](../../deploy/vault/README.md)

| Шаг | Команда |
|-----|---------|
| Поднять Vault (dev mode) | `cd deploy/vault && docker compose up -d` |
| **Обязательно для этого курса** | `bash scripts/init-engines.sh` — KV, **PKI**, **Transit** |
| Переменные | `export VAULT_ADDR=http://localhost:8200` · `VAULT_TOKEN=course` |

> **Dev mode:** root token `course`, данные в памяти, автоматический unseal. Для PKI/Transit этого достаточно; поведение **seal/unseal** и **Raft** разбираем теоретически в [09](09-ha-raft-unseal.md).

Перед лабами убедитесь, что `init-engines.sh` отработал без ошибок (повторный запуск: `path is already in use` — норма).

## Как читать главы

Каждый урок — **глава книги** под подготовку к интервью, не сухая шпаргалка.

1. **Теория** (01, 03, 05…) — сценарий с работы → концепции → команды на стенде → типичные ошибки → «на собеседовании» → резюме.
2. **Лаба** (02, 04, 06…) — цель → предварительно → задания → «что увидите» / «если не работает» → критерии успеха.
3. После блоков PKI + Transit + AppRole — пройдите [`interview-cheatsheet.md`](interview-cheatsheet.md) без подглядывания в ответы.

**Время:** ~60–90 минут на пару «теория + лаба»; [capstone](13-capstone.md) — **4–6 часов**.

## Программа

### PKI и сертификаты (01–04)

| # | Урок |
|---|------|
| 01 | [PKI: обзор и модель доверия](01-pki-overview.md) |
| 02 | [Лаба: выдача сертификата](02-lab-pki-issue-cert.md) |
| 03 | [Ротация, renewal, CRL](03-rotation-renewal.md) |
| 04 | [Лаба: ротация сертификата](04-lab-cert-rotation.md) |

### Transit и шифрование (05–06)

| 05 | [Transit: encryption-as-a-service](05-transit-encryption.md) |
| 06 | [Лаба: Transit encrypt/decrypt](06-lab-transit.md) |

### Динамические секреты (07–08)

| 07 | [Dynamic secrets и AppRole](07-dynamic-secrets-approle.md) |
| 08 | [Лаба: AppRole для CI](08-lab-approle.md) |

### HA и эксплуатация (09–11)

| 09 | [HA, Raft, unseal](09-ha-raft-unseal.md) *(теория, без полноценной HA-лабы)* |
| 10 | [Troubleshooting и audit](10-troubleshooting-audit.md) |
| 11 | [Лаба: incident response](11-lab-incident-response.md) |

### Интервью и итог (12–13)

| 12 | [Interview Q&A (топ-25)](12-interview-qa.md) |
| 13 | [Capstone](13-capstone.md) |

### Шпаргалка и примеры

| — | [Interview cheatsheet](interview-cheatsheet.md) |
| — | [examples/pki-role.json](examples/pki-role.json) |
| — | [examples/rotation-checklist.md](examples/rotation-checklist.md) |

## Что должно получиться

- Объясняете **PKI engine**, цепочку **root → intermediate → leaf**, **TTL**, **role**, **allowed_domains**.
- Выпускаете сертификат на стенде, проверяете **SAN**, **цепочку**, **срок действия**.
- Планируете **ротацию** CA и leaf без простоя (концептуально + чек-лист).
- Используете **Transit** для шифрования данных **без хранения plaintext** в Vault.
- Настраиваете **AppRole** с **secret_id** delivery и **least-privilege policy**.
- Отличаете **dev mode** от **Raft + Shamir / auto-unseal** в production.
- Читаете **audit log**, реагируете на **утечку token** / **policy drift**.
- Отвечаете на типовые вопросы интервьюера ([12](12-interview-qa.md)).

## Связь с другими курсами

| Курс | Связь |
|------|-------|
| [`secrets-basic`](../secrets-basic/README.md) | KV, policies, tokens — фундамент |
| [`aws-intermediate/11-secrets-kms`](../aws-intermediate/11-secrets-kms.md) | AWS Secrets Manager + KMS; сравнение с Vault |
| [`aws-intermediate/12-lab-secrets-kms`](../aws-intermediate/12-lab-secrets-kms.md) | секреты без пароля в tfvars |
| [`linux-security/07-secrets-disk`](../linux-security/07-secrets-disk.md) | секреты на диске, umask, /tmp — почему Vault agent лучше `.env` |
| [`gitlab-basic/07-variables-secrets`](../gitlab-basic/07-variables-secrets.md) | masked variables vs Vault для CI |
| [`kuber-basic/12-config-and-secret`](../kuber-basic/12-config-and-secret.md) | K8s Secret vs external secrets operator + Vault |

## Безопасность (важно)

Стенд **запрещён в production**: фиксированный root token, нет audit hardening, нет TLS на API. В проде: **TLS**, **Raft**, **auto-unseal**, **namespaces** (Enterprise), **audit device** на неизменяемое хранилище, **periodic tokens**, **break-glass** процедуры.
