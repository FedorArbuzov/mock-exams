# 07. Лаба: pgaudit

## Зачем эта лаба

Увидеть **реальные строки AUDIT** в логах после DDL и role changes — то, что читает security при инциденте.

## Предусловия

- [`deploy/postgres`](../../deploy/postgres/README.md) с pgaudit
- [06-pgaudit](06-pgaudit.md)

## Задание 1. Проверка preload

```sql
SHOW shared_preload_libraries;
CREATE EXTENSION IF NOT EXISTS pgaudit;
SHOW pgaudit.log;
```

Если `pgaudit` нет в preload — пересоберите/перезапустите стенд по README deploy.

Ожидание: `shared_preload_libraries` содержит `pgaudit`.

## Задание 2. Настройка классов

```sql
ALTER SYSTEM SET pgaudit.log = 'ddl, role';
ALTER SYSTEM SET pgaudit.log_relation = on;
SELECT pg_reload_conf();
SHOW pgaudit.log;
```

## Задание 3. DDL audit trail

```sql
CREATE SCHEMA IF NOT EXISTS sec;
CREATE TABLE sec.audit_test (id int);
ALTER TABLE sec.audit_test ADD COLUMN note text;
DROP TABLE sec.audit_test;
```

## Задание 4. Role audit trail

```sql
CREATE ROLE audit_demo LOGIN PASSWORD 'AuditDemo2024!';
GRANT CONNECT ON DATABASE course TO audit_demo;
DROP ROLE audit_demo;
```

## Задание 5. Чтение логов

```bash
docker logs mock-postgres 2>&1 | grep -i AUDIT | tail -20
```

Альтернатива (если лог в file):

```bash
docker exec mock-postgres tail -50 /var/lib/postgresql/data/log/postgresql-*.log | grep AUDIT
```

**Запишите** одну полную строку для `CREATE TABLE sec.audit_test`:

| Поле | Значение из вашего лога |
|------|-------------------------|
| Timestamp | |
| User@DB | |
| Statement type | |
| Object | |

## Задание 6. Prod logging path (tabletop)

Опишите для Kubernetes + CloudNativePG:

| Компонент | Ваш ответ |
|-----------|-----------|
| Куда пишет PG | stdout |
| Кто собирает | Fluent Bit DaemonSet |
| Куда ship | Elasticsearch / Loki |
| Retention | 90 дней (пример) |
| Alert на DROP | SIEM rule |

## Troubleshooting

| Проблема | Причина | Fix |
|----------|---------|-----|
| Нет строк AUDIT | preload missing | restart с pgaudit |
| Только обычные LOG | `pgaudit.log` пуст | ALTER SYSTEM + reload |
| grep пустой | Логи в file, не docker logs | tail pg log file |
| DDL не виден | Другой контейнер/кластер | Проверить `mock-postgres` |

## Критерии успеха

- [ ] CREATE TABLE виден в логах с префиксом AUDIT
- [ ] CREATE/DROP ROLE виден
- [ ] Пример строки лога задокументирован
- [ ] Описан prod path (stdout → agent → SIEM)

## Дальше

Шифрование: [08-encryption.md](08-encryption.md).
