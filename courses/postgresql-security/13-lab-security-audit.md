# 13. Лаба: security audit

## Зачем эта лаба

Провести **мини security assessment** своего стенда: SQL-запросы на слабые роли, review pg_hba, отчёт findings — как перед внутренним audit или pentest readiness.

## Предусловия

- Уроки 01–12
- [`examples/audit-queries.sql`](examples/audit-queries.sql)

## Задание 1. SQL audit queries

```bash
psql "postgresql://course:course@localhost:5432/course" \
  -f courses/postgresql-security/examples/audit-queries.sql
```

Интерпретация:

**Слабые login-роли** (`rolsuper`, `rolcreaterole`, `rolcreatedb`):

```sql
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin
FROM pg_roles
WHERE rolcanlogin AND (rolsuper OR rolcreaterole OR rolcreatedb);
```

Ожидание на lab: возможно `course` с расширенными правами — зафиксируйте как finding.

**Login без пароля:**

```sql
SELECT rolname FROM pg_authid
WHERE rolcanlogin AND rolpassword IS NULL;
```

LDAP-only роли — OK; local без password — finding.

**PUBLIC CREATE на schema:**

```sql
SELECT nspname FROM pg_namespace n
WHERE has_schema_privilege('PUBLIC', n.oid, 'CREATE');
```

## Задание 2. Расширенные проверки

Добавьте в свой отчёт:

```sql
-- RLS disabled на user tables в sec/shop
SELECT n.nspname, c.relname, c.relrowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('sec', 'shop')
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity;

SHOW password_encryption;
SHOW ssl;
SHOW log_connections;
```

## Задание 3. pg_hba review

```bash
docker exec mock-postgres grep -v '^#' /var/lib/postgresql/data/pg_hba.conf | grep -v '^$'
```

Отметьте:

| Pattern | Severity | Пример |
|---------|----------|--------|
| `trust` | Critical | local trust |
| `0.0.0.0/0` wide open | High | any host |
| `md5` | Medium | downgrade from SCRAM |
| `host` без ssl remote | Medium | cleartext data |

## Задание 4. Отчёт findings

Одна страница `security-audit-report.md`:

| # | Finding | Severity | Evidence | Remediation |
|---|---------|----------|----------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

Примеры типовых findings (если lab чистый — используйте как tabletop):

| Finding | Severity | Remediation |
|---------|----------|-------------|
| trust в hba для docker network | Critical | scram + CIDR + reject |
| course role superuser-like | High | отдельные app/migrator roles |
| Нет pgaudit ddl | Medium | включить pgaudit.log |
| ssl=off | High | ssl=on + hostssl |
| Нет RLS на orders | High | ENABLE RLS + policies |

## Задание 5. Prioritization

Отсортируйте findings: **Critical → Low**. Первые 2 fix — в sprint 1.

## Troubleshooting

| Проблема | Fix |
|----------|-----|
| docker exec fail | контейнер `mock-postgres` running? |
| audit-queries permission | подключиться как course/postgres |
| Пустой вывод слабых ролей | хорошо — документируйте «clean» |

## Критерии успеха

- [ ] audit-queries выполнен, вывод интерпретирован
- [ ] pg_hba review с отметками
- [ ] ≥5 findings с remediation
- [ ] Приоритизация Critical first

## Дальше

Финальный проект: [14-final-project.md](14-final-project.md).
