# PostgreSQL — Security (специализация)

Курс по **угрозам**, **SCRAM**, **LDAP/IAM**, **pgaudit**, **шифрованию**, **RLS**, **compliance** и **security baseline** для production.

Формат — **мегакурс**: сценарии с работы, антипаттерны, лабы с troubleshooting, связи с admin-треками и DevOps.

## Кому подходит

- DBA и platform engineers перед SOC 2 / PCI audit
- Backend-разработчики, проектирующие multi-tenant SaaS
- DevOps, настраивающие RDS / self-hosted Postgres

## Предварительно

| Курс | Зачем |
|------|-------|
| [`postgresql-basic`](../postgresql-basic/README.md) | 05–06 roles, connections |
| [`postgresql-advanced`](../postgresql-advanced/07-security.md) | RLS overview |
| [`secrets-basic`](../secrets-basic/README.md) | DATABASE_URL, Vault |
| [`appsec-fundamentals`](../appsec-fundamentals/README.md) | Threat modeling |

**Локально:** образ с `pgaudit` — [`deploy/postgres`](../../deploy/postgres/README.md).

## Программа

| # | Урок | Тип |
|---|------|-----|
| 1 | [Threat model](01-threat-model.md) | теория |
| 2 | [SCRAM-SHA-256](02-scram-auth.md) | теория |
| 3 | [Лаба: SCRAM](03-lab-scram.md) | лаба |
| 4 | [LDAP / Active Directory](04-ldap-ad.md) | теория |
| 5 | [Лаба: LDAP (tabletop)](05-lab-ldap.md) | лаба |
| 6 | [pgaudit](06-pgaudit.md) | теория |
| 7 | [Лаба: pgaudit](07-lab-pgaudit.md) | лаба |
| 8 | [Шифрование](08-encryption.md) | теория |
| 9 | [Лаба: SSL](09-lab-ssl.md) | лаба |
| 10 | [RLS и audit](10-rls-audit.md) | теория |
| 11 | [Лаба: RLS multi-tenant](11-lab-rls.md) | лаба |
| 12 | [Compliance](12-compliance.md) | теория |
| 13 | [Лаба: security audit](13-lab-security-audit.md) | лаба |
| 14 | [Финальный проект: Security Baseline](14-final-project.md) | проект |

Опционально: [LDAP deep dive](optional-ldap.md).

## Примеры

| Файл | Урок |
|------|------|
| [`examples/rls-tenant.sql`](examples/rls-tenant.sql) | 11 |
| [`examples/audit-queries.sql`](examples/audit-queries.sql) | 13 |
| [`examples/ssl/README.md`](examples/ssl/README.md) | 09 |

## Что должно получиться

После курса вы:

- Строите threat model и defense in depth для Postgres
- Настраиваете SCRAM, pg_hba без `trust`, TLS
- Понимаете LDAP/IAM vs local auth
- Включаете pgaudit и читаете AUDIT в SIEM
- Пишете RLS для multi-tenant с `SET LOCAL`
- Проводите security audit (`audit-queries`, hba review)
- Собираете **Security Baseline** для аудиторов

## Связанные треки

```text
postgresql-basic → intermediate → advanced
                                      ↓
                    postgresql-security (этот курс)
                    postgresql-ops (backup security)
                    postgresql-developer (app + RLS)
```

Карта ветки: [`postgresql-path.md`](../postgresql-path.md).
