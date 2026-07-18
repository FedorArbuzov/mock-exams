# 12. Compliance

## Сценарий с работы

Аудитор SOC 2 приходит с checklist: «Покажите encryption at rest, access reviews, audit logs за Q2, кто имеет SUPERUSER». DBA открывает pg_hba, SIEM, IAM — или паникует. **Compliance mapping** заранее связывает фреймворки с конкретными контролями Postgres из этого курса.

Это не юридическая консультация — инженерный **mapping** для shop PostgreSQL.

**Связь:** [ops/backup](../postgresql-ops/README.md), [secrets-basic](../secrets-basic/README.md), [appsec-fundamentals](../appsec-fundamentals/README.md).

## Что вы узнаете

- PCI-DSS фрагменты для DB
- SOC 2 logical access
- GDPR erasure vs backups
- CIS PostgreSQL Benchmark
- Артефакт Security Baseline

## PCI-DSS (DB-relevant)

| Требование | Контроль в курсе |
|------------|------------------|
| Protect stored cardholder data | EBS/S3 encryption, no PAN in logs |
| Encrypt transmission | TLS verify-full ([08](08-encryption.md)) |
| Restrict access | Roles, RLS, no default passwords |
| Track access | pgaudit ([06](06-pgaudit.md)) |
| Secure configs | pg_hba no trust, CIS benchmark |

PAN в БД — tokenization предпочтительнее `pgcrypto` column.

## SOC 2 (Trust Services)

| Критерий | Postgres implementation |
|----------|-------------------------|
| Logical access | SCRAM/LDAP, least privilege |
| Change management | Migrations in CI, pgaudit DDL |
| Monitoring | log_connections, SIEM alerts |
| Incident response | Runbooks ([ops](../postgresql-ops/10-oncall-runbooks.md)) |

Доказательства: git PR migrations, pgaudit logs, quarterly access review ticket.

## GDPR

| Тема | Практика |
|------|----------|
| Data mapping | Schema inventory: PII columns |
| Right to erasure | `DELETE` + policy для backups |
| Residency | EU RDS region, no US replica of EU PII |
| Breach notification | pgaudit + SIEM retention |

**Erasure vs backup:** удаление в live DB не стирает прошлый backup — legal нужен retention / re-encryption policy.

```sql
-- erasure request
DELETE FROM shop.customers WHERE id = $1;
-- backup: document "restores for erasure = separate process"
```

## CIS PostgreSQL Benchmark

Используйте как automated checklist (version под вашу PG):

| CIS item | Проверка |
|----------|----------|
| 4.x Authentication | scram-sha-256, no trust |
| 5.x Logging | log_connections, log_disconnections |
| 6.x Audit | pgaudit ddl, role |
| SSL | ssl=on, hostssl |

Скрипт: [`examples/audit-queries.sql`](examples/audit-queries.sql).

## Security Baseline document

Единый артефакт для аудиторов — см. [14-final-project](14-final-project.md):

```text
1. Threat model
2. Auth matrix (pg_hba)
3. Role model
4. Network/TLS
5. Audit (pgaudit + retention)
6. Encryption
7. RLS multi-tenant
8. Backup security
9. Compliance mapping (эта таблица)
10. Quarterly tasks
```

## Quarterly tasks

| Task | Owner | Evidence |
|------|-------|----------|
| Access review | Security | Export pg_roles + tickets |
| SUPERUSER inventory | DBA | `SELECT * FROM pg_roles WHERE rolsuper` |
| Restore drill | DBA | [ops lab](../postgresql-ops/03-lab-pgbackrest.md) |
| Password/secret rotation | Platform | Vault audit log |
| pg_hba review | DBA | Diff vs baseline |
| CIS scan | Security | audit-queries output |

## Типичные ошибки

1. Compliance = «у нас RDS» без доказательств config.
2. pgaudit включён, retention 7 дней — SOC fail.
3. Staging = copy prod PII без masking.
4. SUPERUSER у 10 людей «для удобства».
5. Backup encrypted, WAL archive — нет.

## Чек-лист

- [ ] PCI/SOC/GDPR mapping для shop
- [ ] CIS checklist пройден на стенде
- [ ] Erasure policy vs backups
- [ ] Quarterly calendar заведён
- [ ] Security Baseline outline готов

## Дальше

Лаба audit: [13-lab-security-audit.md](13-lab-security-audit.md).
