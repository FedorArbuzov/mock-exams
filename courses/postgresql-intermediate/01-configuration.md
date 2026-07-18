# 01. postgresql.conf и параметры

## Сценарий с работы

После миграции на RDS коллега поднял `work_mem` до 256MB «чтобы сортировки летали». Через неделю ночной отчёт упал с OOM: 80 параллельных запросов × 256MB теоретически съедают десятки гигабайт. Другой кейс: DBA правит `postgresql.conf` вручную, а через час `ALTER SYSTEM` из Ansible перезаписывает `postgresql.auto.conf` — никто не понимает, какое значение реально активно.

Intermediate начинается с **управляемой конфигурации**: где лежат файлы, что требует restart, как не убить память и что включить в логах до первого инцидента.

**Предварительно:** [postgresql-basic](../postgresql-basic/README.md).  
**Стенд:** [`deploy/postgres`](../../deploy/postgres/README.md).

## Что вы узнаете

- Где Postgres хранит конфиг и как применять изменения
- Параметры памяти: `shared_buffers`, `work_mem`, ловушка «× connections»
- WAL и checkpoint — связь с репликацией и durability
- Логирование для диагностики без pg_stat_statements
- `pg_hba.conf` и reload vs restart

## Где лежит конфиг

```sql
SHOW config_file;
SHOW hba_file;
SHOW data_directory;
```

Типичная цепочка:

```text
postgresql.conf          — основной файл
postgresql.auto.conf       — записи из ALTER SYSTEM (подключается include'ом)
pg_hba.conf              — аутентификация клиентов
pg_ident.conf            — map OS user → DB role (редко)
```

Применение изменений:

```sql
ALTER SYSTEM SET shared_buffers = '256MB';
SELECT pg_reload_conf();
```

`ALTER SYSTEM` пишет в `postgresql.auto.conf` и переживает ручные правки **других** параметров в том же файле — но не отменяет строки в `postgresql.conf`.

| Способ | Когда |
|--------|-------|
| `ALTER SYSTEM` + `pg_reload_conf()` | Параметр `context = sighup` или `superuser-backend` |
| Restart контейнера / `pg_ctl restart` | `context = postmaster` — `wal_level`, `max_connections`, `shared_buffers` (часто) |
| Правка файла + reload | GitOps, cloud-init, Helm values |

Проверить, нужен ли restart:

```sql
SELECT name, setting, pending_restart
FROM pg_settings
WHERE name IN ('shared_buffers', 'wal_level', 'work_mem');
```

## Память: не догма «25% RAM»

| Параметр | Назначение | Ориентир |
|----------|------------|----------|
| `shared_buffers` | Кэш страниц данных в RAM Postgres | 25% RAM — стартовая точка; на Linux с большим page cache иногда меньше |
| `effective_cache_size` | Подсказка **планировщику** (не выделение RAM) | 50–75% RAM — «сколько ещё в OS cache» |
| `work_mem` | Sort/hash **на операцию** в запросе | 4–64MB; умножайте на параллельные операции и соединения |
| `maintenance_work_mem` | VACUUM, CREATE INDEX, ALTER | 256MB–1GB на тяжёлое обслуживание |

**Ловушка work_mem:**

```text
500 connections × work_mem 64MB ≠ «всегда 32GB»
```

Но один тяжёлый запрос с 8 hash joins может взять несколько × work_mem. Плюс autovacuum workers. Отсюда [PgBouncer](15-pgbouncer.md) и ограничение пула в приложении ([basic/07-connections-psql](../postgresql-basic/07-connections-psql.md)).

Managed Postgres (RDS) часть параметров не даёт менять — смотрите parameter groups в [aws-intermediate](../aws-intermediate/README.md).

## WAL и checkpoint

| Параметр | Смысл |
|----------|-------|
| `wal_level` | `minimal` / `replica` / `logical` — нужен `replica+` для streaming ([05-streaming-replication](05-streaming-replication.md)) |
| `max_wal_size` | Сколько WAL накопить до принудительного checkpoint |
| `checkpoint_timeout` | Макс. интервал между checkpoints |
| `checkpoint_completion_target` | Растянуть checkpoint I/O (0.9 — плавнее) |
| `synchronous_commit` | `on` — commit после fsync WAL; `off` — риск потери последних commits при crash |

```sql
SHOW wal_level;
SHOW max_wal_size;
```

Смена `wal_level` на работающем primary с репликой — **плановое окно** и restart.

## Логирование — включить до инцидента

```ini
log_min_duration_statement = 500ms
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_line_prefix = '%m [%p] %u@%d '
```

В Docker: `docker logs mock-postgres`. В проде — stdout → Loki/CloudWatch ([observability-basic](../observability-basic/README.md)).

`log_min_duration_statement` — не замена [pg_stat_statements](13-monitoring.md), но ловит «внезапно стало 2 секунды» без расширения.

## pg_hba.conf

После правки — reload. Типичные ошибки:

- строка `reject` выше `scram-sha-256` для нужной сети;
- забыли `host replication` для пользователя репликации;
- правили файл в volume, а контейнер пересоздали с чистым PGDATA.

## Типичные ошибки

1. Огромный `shared_buffers` на 8GB VM «по учебнику для 64GB».
2. `work_mem` взлетел — отчёты и API в одном кластере без лимитов.
3. Меняли `wal_level` без restart и удивились, что logical replication не работает.
4. Несколько источников правды: Ansible, ручной conf, `ALTER SYSTEM` — нет `pg_settings` как source of truth.

## Чек-лист

- [ ] `shared_buffers` vs `effective_cache_size` — разные роли
- [ ] Почему большой `work_mem` опасен при многих connections
- [ ] `wal_level minimal` — когда допустим (standalone, без replica/archive)
- [ ] `ALTER SYSTEM` vs правка `postgresql.conf` в git
- [ ] Как проверить `pending_restart`

## Дальше

Лаба: [02-lab-configuration.md](02-lab-configuration.md).
