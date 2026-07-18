# 01. Threat model

## Сценарий с работы

Пентест нашёл `DATABASE_URL` в git с `postgres:postgres` и `sslmode=disable`. Параллельно аналитик с ролью `SELECT` на всю БД скачал PII — RLS не был включён. Backup bucket S3 публичный «на час» — compliance эскалация. Без **threat model** каждый фикс точечный и дырки остаются.

Security-курс начинается с границ доверия и контролей по слоям — не с «включим SSL и всё».

**Предварительно:** [basic/05-roles-privileges](../postgresql-basic/05-roles-privileges.md), [advanced/07-security](../postgresql-advanced/07-security.md).

## Что вы узнаете

- Границы доверия в типичном стеке
- Таблицу угроз и контролей
- Least privilege для app / migrator / human
- Defense in depth для Postgres

## Границы доверия

```text
Internet
    → WAF / LB (TLS termination?)
        → App (FastAPI/Django) — SQL injection surface
            → Secrets (Vault / K8s Secret) — DATABASE_URL
                → PgBouncer (pool) — tenant GUC?
                    → PostgreSQL — pg_hba, roles, RLS
                        → OS / VM / K8s node
                            → Storage (EBS/PVC) — encryption at rest
                                → Backups (S3) — off-site, IAM
                                    → WAL archive — same risk as backup
```

Каждая стрелка — точка атаки. Postgres — **не** единственный периметр.

## Угрозы и контроли

| Угроза | Пример | Контроль |
|--------|--------|----------|
| Перехват пароля | MITM в café Wi‑Fi | TLS `verify-full`, SCRAM |
| SQL injection | `'; DROP TABLE--` | Параметризованные запросы, least privilege role |
| Утечка backup | Открытый S3 bucket | SSE-KMS, IAM, no public |
| Инсайдер DBA | SELECT * customers | pgaudit, RLS, no app SUPERUSER |
| Компромисс app | RCE в API pod | RLS + DB role без DDL |
| Ransomware | Encrypt PGDATA | Immutable offline backups ([ops](../postgresql-ops/README.md)) |
| Credential stuffing | Слабый пароль в staging | SCRAM, rotation, secrets manager |
| Supply chain | Malicious migration | Reviewed CI migrations |

## Least privilege (роли)

| Роль | Права | Подключение |
|------|-------|-------------|
| `shop_app` | DML на нужные таблицы | Runtime pods |
| `shop_migrator` | DDL в schema app | CI only, не в app |
| `shop_readonly` | SELECT reporting | BI, read replica |
| `dba_human` | Расширенные, **не** SUPERUSER | Break-glass, MFA, logged |
| `postgres` / SUPERUSER | Всё | Emergency only |

Приложение **никогда** SUPERUSER — обход RLS, `COPY PROGRAM`, file access.

См. [basic/06-lab-roles](../postgresql-basic/06-lab-roles.md), [secrets-basic](../secrets-basic/README.md).

## Defense in depth

```text
Network (private subnet, SG) 
  + pg_hba (CIDR, hostssl)
  + Auth (SCRAM / LDAP / IAM)
  + Authorization (GRANT)
  + RLS (tenant)
  + Audit (pgaudit)
  + Encryption (TLS + at rest)
```

Один слой провалился — следующий сдерживает.

## Вопросы для вашего стенда

| Вопрос | Где искать ответ |
|--------|------------------|
| Кто читает WAL/archive? | IAM, backup role |
| Где connection strings? | K8s Secret, Vault — не git |
| Компромисс backup bucket? | Restore drill, incident runbook |
| Кто имеет SUPERUSER? | `pg_roles`, quarterly review |

## Типичные ошибки

1. «БД в private subnet» — но app в той же сети с SQL injection.
2. Security только на prod — staging с копией prod data и `trust`.
3. Аудит только в приложении — psql bypass.
4. RLS без SET tenant в middleware — пустые списки или утечка.

## Чек-лист

- [ ] Нарисованы границы доверия для shop API
- [ ] 5 угроз с контролями
- [ ] App без SUPERUSER — policy
- [ ] Backup/WAL access model
- [ ] Defense in depth — 4+ слоя

## Дальше

SCRAM: [02-scram-auth.md](02-scram-auth.md).
