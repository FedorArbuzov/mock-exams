# 06. pgaudit

## Сценарий с работы

Инсайдер удалил 40k строк `customers` через psql — приложение не логировало. Forensics: «кто и когда» только из **pgaudit** в PG log. Compliance (SOC 2, PCI) требует audit trail на DDL и privileged actions.

pgaudit пишет в **стандартный лог PostgreSQL** — удобно для Fluent Bit → SIEM. Не заменяет app-level audit (бизнес-события), но ловит **все** сессии к БД.

**Стенд:** `shared_preload_libraries = 'pgaudit'` в [`deploy/postgres`](../../deploy/postgres/README.md).

**Связь:** [advanced/07-security](../postgresql-advanced/07-security.md), [appsec-fundamentals](../appsec-fundamentals/README.md).

## Что вы узнаете

- Установку и классы логирования
- `pgaudit.log_relation` и шум `read`
- Интеграцию с SIEM
- pgaudit vs application audit

## Включение

```sql
CREATE EXTENSION IF NOT EXISTS pgaudit;

ALTER SYSTEM SET pgaudit.log = 'ddl, role';
ALTER SYSTEM SET pgaudit.log_relation = on;
ALTER SYSTEM SET log_line_prefix = '%m [%p] %u@%d ';
SELECT pg_reload_conf();
```

`shared_preload_libraries` требует **restart** при первом включении — проверьте образ до лабы.

Проверка:

```sql
SHOW shared_preload_libraries;  -- pgaudit
SHOW pgaudit.log;
```

## Классы

| Класс | Логирует | Когда включать |
|-------|----------|----------------|
| `ddl` | CREATE, ALTER, DROP | **Всегда** в prod |
| `role` | GRANT, CREATE ROLE, DROP ROLE | **Всегда** |
| `write` | INSERT, UPDATE, DELETE | DML audit, осторожно с объёмом |
| `read` | SELECT | Редко — очень шумно |
| `function` | FUNCTION/PROCEDURE calls | По необходимости |
| `misc` | DISCARD, FETCH, CHECKPOINT | Обычно нет |

Рекомендация для shop:

```sql
ALTER SYSTEM SET pgaudit.log = 'ddl, role, write';
```

`read` — только на sensitive tables через `pgaudit.role` (advanced).

## Пример строки лога

```text
2026-06-25 14:02:11 UTC [12345] course@course AUDIT: SESSION,1,1,DDL,CREATE TABLE,TABLE,sec.audit_test,...
```

Поля: timestamp, PID, user@db, `AUDIT`, класс, statement type, object.

## log_relation

```sql
ALTER SYSTEM SET pgaudit.log_relation = on;
```

Логирует **имя таблицы** при DML — критично для forensics («какие таблицы трогали»).

## Performance и retention

| Риск | Митигация |
|------|-----------|
| Disk full от логов | log_rotation, central SIEM |
| I/O на busy OLTP | Не включать `read` глобально |
| PII в логах (VALUES) | `log_statement` off; pgaudit не логирует row data по умолчанию |

Sampling и фильтры — на стороне SIEM (Splunk, ELK).

## pgaudit vs application audit

| | pgaudit | App audit (events table) |
|---|---------|--------------------------|
| Охват | Все клиенты (psql, ETL, app) | Только app code path |
| Контекст | SQL-level | Business context (order_id) |
| Bypass | Прямой psql | psql bypass |
| Объём | Может быть большим | Контролируемый |

**Нужны оба** для SaaS multi-tenant.

## SIEM pipeline

```text
PostgreSQL log (file or stdout)
  → Fluent Bit / Filebeat
    → Elasticsearch / Splunk
      → Alert: DROP TABLE, GRANT SUPERUSER
```

Алерты:

- `DROP` / `TRUNCATE` вне maintenance window
- `CREATE ROLE` с `SUPERUSER`
- Spike failed auth (brute force)

## Типичные ошибки

1. Extension без preload — `pgaudit` не работает.
2. `read` на production — TB логов за день.
3. Логи только в контейнере без ship — потеря при restart.
4. «У нас app audit» — DBA через psql невидим.

## Чек-лист

- [ ] preload + extension
- [ ] Классы ddl, role — минимум
- [ ] log_relation для DML forensics
- [ ] Путь логов в prod (file/stdout/agent)
- [ ] Retention и SIEM alert rules

## Дальше

Лаба: [07-lab-pgaudit.md](07-lab-pgaudit.md).
