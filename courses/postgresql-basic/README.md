# PostgreSQL — Basic (администрирование)

Базовый курс для DevOps / backend / DBA junior. Цель — уверенно **устанавливать**, **подключаться**, управлять **ролями и объектами**, понимать **MVCC**, делать **бэкапы** и читать планы запросов.

**Формат:** мегакурс (~150–200 строк на урок) — сценарии с работы, антипаттерны, связи с другими курсами. План ветки: [`postgresql-path.md`](../postgresql-path.md).

**Локально:** [`deploy/postgres`](../../deploy/postgres/README.md) — `docker compose up`, порт `5432`.

**Дальше:** [`postgresql-intermediate`](../postgresql-intermediate/README.md) → [`postgresql-advanced`](../postgresql-advanced/README.md).

## Программа

### Архитектура и установка

1. [Архитектура PostgreSQL](01-architecture.md)
2. [Лаба: установка и первое подключение](02-lab-install.md)

### Объекты и SQL для админа

3. [Кластер, БД, схемы, таблицы](03-databases-schemas.md)
4. [Лаба: DDL и базовые объекты](04-lab-ddl.md)
5. [Роли, права, SECURITY](05-roles-privileges.md)
6. [Лаба: роли и GRANT](06-lab-roles.md)

### Подключения и запросы

7. [Подключение: psql, URI, пулы](07-connections-psql.md)
8. [Лаба: psql и метаданные](08-lab-psql.md)
9. [Индексы и EXPLAIN](09-indexes-explain.md)
10. [Лаба: индексы и план](10-lab-indexes.md)

### MVCC и бэкапы

11. [Транзакции и MVCC](11-transactions-mvcc.md)
12. [Лаба: видимость транзакций](12-lab-mvcc.md)
13. [Логические бэкапы: pg_dump](13-backup-pgdump.md)
14. [Лаба: dump и restore](14-lab-backup.md)

### Финал

15. [Финальный проект: БД приложения](15-final-project.md)

## Что должно получиться

- Подключаетесь к Postgres локально и из приложения.
- Создаёте БД, схему, таблицу, индекс; выдаёте минимальные GRANT.
- Объясняете, зачем VACUUM (на уровне идеи).
- Делаете `pg_dump` / `pg_restore` и проверяете restore.

## Специализации (после basic)

| Курс | Когда |
|---|---|
| [`postgresql-developer`](../postgresql-developer/README.md) | миграции, JSONB, FTS — параллельно с basic+ |

## Связь с курсами

| Курс | Связь |
|---|---|
| `kuber-intermediate` StatefulSet + Postgres | приложение в K8s |
| `aws-intermediate` RDS | managed Postgres в облаке |
| `bare-metal` | Postgres на физическом сервере |
