# HashiCorp Vault для курсов secrets-*

Локальный **Vault в dev mode** — автоматически unsealed, данные **в памяти** (пропадают при `down`).

Курсы: [secrets-basic](../../courses/secrets-basic/README.md), [secrets-advanced](../../courses/secrets-advanced/README.md).

## Запуск

```bash
cd deploy/vault
docker compose up -d
```

| Параметр | Значение |
|----------|----------|
| API | [http://localhost:8200](http://localhost:8200) |
| UI | [http://localhost:8200/ui](http://localhost:8200/ui) |
| Root token (только лаб) | `course` |

```bash
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
```

Windows PowerShell:

```powershell
$env:VAULT_ADDR = "http://localhost:8200"
$env:VAULT_TOKEN = "course"
```

## Smoke test

```bash
bash scripts/smoke.sh
# .\scripts\smoke.ps1
```

Команды через контейнер (без локального `vault` CLI):

```bash
docker exec -e VAULT_TOKEN=course mock-vault vault status
```

## Движки для advanced (PKI, Transit)

```bash
bash scripts/init-engines.sh
# или:
docker exec -e VAULT_TOKEN=course mock-vault vault secrets enable -path=secret kv-v2
```

Скрипт включает **KV v2**, **PKI** (internal CA `lab.mock-exams.local`), **Transit**.

## Demo profile

```bash
docker compose --profile demo up -d
```

Контейнер `mock-vault-demo` с `VAULT_ADDR` / `VAULT_TOKEN` для exec-лаб.

## Сброс

```bash
docker compose down -v
```

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| `connection refused` | `docker compose ps`, подождите healthy |
| `permission denied` | `export VAULT_TOKEN=course` |
| `path is already in use` | engine уже включён — норма при повторном init |
| UI login | Method **Token**, value `course` |

## Безопасность (важно)

**Dev mode запрещён в production:** root token в env, нет seal/unseal discipline, нет audit hardening.

В проде: Raft storage, auto-unseal (KMS/cloud), политики least privilege, audit device.

## Связанные курсы

- GitLab CI variables: [gitlab-basic/07-variables-secrets](../../courses/gitlab-basic/07-variables-secrets.md)
- AWS: [aws-intermediate/11-secrets-kms](../../courses/aws-intermediate/11-secrets-kms.md)
- K8s Secret: [kuber-basic/12-config-and-secret](../../courses/kuber-basic/12-config-and-secret.md)
- Kafka ACL: [kafka-intermediate/19-security-basics](../../courses/kafka-intermediate/19-security-basics.md)
