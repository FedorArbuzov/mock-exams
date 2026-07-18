# 10. Troubleshooting и audit

## Введение: «Кто прочитал production DB password?»

Без **audit device** ответ — «неизвестно». С audit log видно: `token` → `path` → `operation` → `response` (status). После утечки root token команда должна **revoke**, **rotate**, **разобрать** цепочку — не только «сменили пароль в Slack».

## Что вы узнаете

- Типичные ошибки API и CLI.
- **Audit log** формат и хранение.
- Реагирование на **компрометацию token**.
- Связь с [linux-security/07-secrets-disk](../linux-security/07-secrets-disk.md) и host-level forensics.

---

## Диагностика: первый экран

```bash
vault status
export VAULT_ADDR VAULT_TOKEN   # проверьте оба
vault token lookup
vault auth -methods
```

| Симптом | Частая причина |
|---------|----------------|
| `connection refused` | Vault down, wrong port, TLS mismatch |
| `permission denied` | policy, expired token, wrong namespace |
| `sealed` | нужен unseal ([09](09-ha-raft-unseal.md)) |
| `no handler for route` | engine не включён — `init-engines.sh` |
| `path is already in use` | повторный enable — не ошибка |
| `invalid role name` | опечатка в `pki/issue/ROLE` |

На стенде: [`deploy/vault/README.md`](../../deploy/vault/README.md#troubleshooting).

---

## Уровни логирования

```bash
vault audit list
vault audit enable file file_path=/vault/logs/audit.log
```

| Device | Назначение |
|--------|------------|
| `file` | Лаб / VM |
| `socket` | SIEM agent |
| `syslog` | Центральный сбор |

**Требование:** audit device **нельзя** отключить без restart в некоторых конфигурациях; при полном диске Vault может **блокировать** запросы (fail closed) — планируйте ротацию логов.

Пример записи (упрощённо):

```json
{
  "type": "response",
  "auth": { "token_type": "service", "policies": ["ci-read"] },
  "request": { "operation": "read", "path": "secret/data/course/ci-demo" },
  "response": { "status": 200 }
}
```

**На собеседовании:** audit не логирует **значения** секретов по умолчанию в HMAC режиме для sensitive paths — уточняйте `log_raw` (опасно).

---

## Token incidents

### Подозрение на утечку service token

1. `vault token lookup <token>` — policies, ttl, accessor
2. `vault token revoke <token>` или `vault token revoke -accessor`
3. Проверить **дочерние** tokens: `vault list auth/token/accessors`
4. Ротация **статических** секретов, доступных этой policy
5. Root cause: CI log? `.env` в git? ([07-secrets-disk](../linux-security/07-secrets-disk.md))

### Компрометация root

1. Seal (если возможно) / isolate network
2. Generate new root ([recovery procedure](https://developer.hashicorp.com/vault/docs/concepts/dev-server) в prod — operator generate-root)
3. Revoke все старые accessors
4. Пересмотр policies, включить MFA для human auth
5. Post-mortem + audit timeline

---

## Policy debugging

```bash
vault token capabilities <token> secret/data/course/ci-demo
vault policy read ci-read
```

Используйте **path spec** точно: KV v2 data path `secret/data/...`, metadata `secret/metadata/...`.

---

## PKI / Transit специфика

| Проблема | Проверка |
|----------|----------|
| cert не доверяют | chain, intermediate missing |
| `domain not allowed` | role `allowed_domains` |
| decrypt fail после rotate | `min_decryption_version` |
| высокая latency | many small encrypt → batching / локальный cache ciphertext |

---

## Performance (кратко)

- **Connection pooling** к Vault из приложения.
- **Agent sidecar** — кэш lease, reduce API load.
- Не вызывать Vault на **каждый HTTP request** — кэшируйте token / используйте short-lived app encryption keys.

---

## Compliance checklist

- [ ] Audit на всех нодах
- [ ] Immutable storage (S3 Object Lock, WORM)
- [ ] Retention ≥ политика компании
- [ ] Алерт на `root` login, `sudo` policy change
- [ ] Регулярный **break-glass** drill

---

## Резюме

- Troubleshooting начинается с `status`, `token lookup`, capabilities.
- Audit — основа **forensics** и compliance.
- Следующий шаг: [11. Лаба: incident response](11-lab-incident-response.md).
