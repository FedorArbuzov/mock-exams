# 14. Финальный проект: Security Baseline

## Сценарий с работы

Новый сервис shop-api идёт в production audit. Security просит один документ: «PostgreSQL Security Baseline» — не разрозненные заметки, а **подписываемый** артефакт для SOC 2 / внутреннего review. Вы собираете всё из курса в целостный baseline.

## Задача

Написать документ **Security Baseline** для PostgreSQL 16 (shop production) — **8–12 разделов**, 4–8 страниц.

Формат: Markdown в репозитории или Confluence — на усмотрение.

## Обязательное содержание

### 1. Threat model (кратко)

Границы доверия из [01-threat-model](01-threat-model.md): Internet → app → secrets → pooler → PG → backup.

Top 5 угроз + контроль для shop.

### 2. Authentication

| Элемент | Ваше решение |
|---------|--------------|
| Метод | SCRAM / LDAP / IAM |
| `password_encryption` | scram-sha-256 |
| pg_hba matrix | role × subnet × method |

Пример matrix:

| Database | Role | Source CIDR | Method |
|----------|------|-------------|--------|
| shop | shop_app | 10.0.1.0/24 | hostssl scram-sha-256 |
| shop | shop_migrator | CI runner IP | hostssl scram-sha-256 |
| * | * | 0.0.0.0/0 | reject |

**Запрет:** `trust` для remote.

### 3. Authorization

```text
shop_app      — DML, no DDL, no BYPASSRLS
shop_migrator — DDL in shop schema, CI only
shop_readonly — SELECT, replica
dba_breakglass — elevated, MFA, logged, no app use
```

Ссылка: [basic/05-roles](../postgresql-basic/05-roles-privileges.md).

### 4. Network

- Private subnet, security groups
- TLS `verify-full`
- No public RDS endpoint (или IP allowlist)

### 5. Audit

```sql
pgaudit.log = 'ddl, role, write'
log_connections = on
```

Retention: 90d hot, 1y cold. SIEM alerts: DROP, GRANT SUPERUSER.

### 6. Encryption

| Layer | Control |
|-------|---------|
| Transit | TLS 1.2+, verify-full |
| Disk | EBS encrypted / encrypted PVC |
| Backup | S3 SSE-KMS, no public ACL |
| WAL archive | Same as backup |

### 7. Multi-tenant RLS

Ссылка на [`examples/rls-tenant.sql`](examples/rls-tenant.sql):

- `ENABLE` + `FORCE ROW LEVEL SECURITY`
- `SET LOCAL app.tenant_id` в middleware
- App не superuser

### 8. Backup security

Из [postgresql-ops](../postgresql-ops/README.md):

- Encrypted repo
- IAM least privilege на bucket
- Restore drill quarterly
- Ransomware: immutable copy

### 9. Compliance mapping

Таблица из [12-compliance](12-compliance.md):

| Framework | Control | Baseline section | Status |
|-----------|---------|------------------|--------|
| SOC 2 | Logical access | §2, §3 | Implemented |
| PCI | Encrypt transit | §4, §6 | Implemented |
| GDPR | Erasure | §8 + policy | Partial |

### 10. Quarterly tasks

| Task | Frequency |
|------|-----------|
| Access review (pg_roles) | Quarterly |
| pg_hba diff vs baseline | Quarterly |
| Restore drill | Quarterly |
| Secret rotation | 90 days |
| CIS audit-queries | Quarterly |

## Шаблон оглавления

```markdown
# Shop PostgreSQL Security Baseline v1.0
## 1. Scope and ownership
## 2. Threat model
## 3. Authentication and pg_hba
## 4. Roles and least privilege
## 5. Network and TLS
## 6. Audit logging
## 7. Encryption
## 8. Row Level Security
## 9. Backup and disaster recovery security
## 10. Compliance mapping
## 11. Operational procedures
## 12. Revision history
```

## Критерии приёмки

- [ ] Нет `trust` для remote в целевой конфигурации
- [ ] pgaudit классы с обоснованием (почему не `read`)
- [ ] pg_hba matrix заполнена
- [ ] RLS паттерн с SET LOCAL
- [ ] Ссылка на ops runbooks (backup, incident)
- [ ] Compliance mapping ≥3 фреймворка
- [ ] Quarterly calendar

## Self-review вопросы

1. Может ли compromised app pod прочитать все tenants? (RLS)
2. Может ли ex-employee подключиться? (offboarding + hba)
3. Можем ли доказать кто сделал DROP? (pgaudit + retention)
4. Encrypted backup при утечке bucket? (KMS + IAM)

## Связь с другими курсами

| Курс | Раздел baseline |
|------|-----------------|
| [postgresql-advanced/07](../postgresql-advanced/07-security.md) | RLS deep dive |
| [postgresql-ops](../postgresql-ops/README.md) | Backup §8 |
| [secrets-basic](../secrets-basic/README.md) | Credentials §2 |
| [aws-intermediate](../aws-intermediate/README.md) | RDS IAM §2 |

## Поздравляем

Трек **postgresql-security** завершён. Следующий специализационный трек: [postgresql-developer](../postgresql-developer/README.md).
