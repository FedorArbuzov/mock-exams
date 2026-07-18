# 02. Лаба: memory и checkpoints

## Зачем эта лаба

Параметры из [01-configuration](01-configuration.md) нужно **трогать руками**: reload без restart, появление медленного запроса в логе, сообщение checkpoint. Это базовая диагностика «Postgres настроен» перед WAL и репликацией.

## Предусловия

- Стенд `mock-postgres` запущен ([basic/02-lab-install](../postgresql-basic/02-lab-install.md)).
- Схема `shop` с таблицей `orders` (желательно данные из [basic/10-lab-indexes](../postgresql-basic/10-lab-indexes.md)).

## Задание 1. Снимок текущих параметров

```sql
SHOW shared_buffers;
SHOW work_mem;
SHOW effective_cache_size;
SHOW max_wal_size;
SHOW checkpoint_timeout;
SHOW log_min_duration_statement;
```

Запишите значения в блокнот — пригодится для финального проекта [17-final-project](17-final-project.md).

Через каталог настроек:

```sql
SELECT name, setting, unit, context, pending_restart
FROM pg_settings
WHERE name IN (
  'shared_buffers', 'work_mem', 'max_wal_size',
  'checkpoint_timeout', 'log_min_duration_statement'
);
```

Колонка `context` подсказывает: `postmaster` = нужен restart.

## Задание 2. Включить логирование через ALTER SYSTEM

```sql
ALTER SYSTEM SET log_min_duration_statement = '100ms';
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_lock_waits = on;
SELECT pg_reload_conf();
```

Проверка:

```sql
SHOW log_min_duration_statement;
SHOW log_checkpoints;
```

**Ожидание:** значения применились **без** restart контейнера.

Посмотреть, что записалось:

```bash
docker exec mock-postgres cat /var/lib/postgresql/data/postgresql.auto.conf
```

## Задание 3. Сгенерировать «медленный» запрос

```sql
SET work_mem = '64kB';  -- искусственно ужесточаем для лабы

SELECT count(*)
FROM shop.orders o
JOIN shop.products p ON p.id = o.product_id
WHERE o.qty > 0;

RESET work_mem;
```

Повторите JOIN несколько раз. Затем логи:

```bash
docker logs mock-postgres 2>&1 | tail -30
```

**Ожидание:** строки `duration: ... ms` для запросов дольше 100ms (если данных мало — увеличьте cartesian или снизьте порог до `0ms` **только на стенде**).

## Задание 4. Принудительный checkpoint

```sql
CHECKPOINT;
```

Снова `docker logs mock-postgres 2>&1 | tail -15` — при `log_checkpoints=on` видно сообщение о checkpoint (starting/complete, WAL position).

## Задание 5. pending_restart (опционально)

```sql
ALTER SYSTEM SET wal_level = 'replica';
SELECT name, setting, pending_restart
FROM pg_settings WHERE name = 'wal_level';
```

**Ожидание:** `pending_restart = true` до restart контейнера:

```bash
docker compose -f deploy/postgres/docker-compose.yml restart postgres
```

После restart `wal_level` должен быть `replica` — пригодится для репликации ([06-lab-streaming-replication](06-lab-streaming-replication.md)).

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| Нет строк в docker logs | `log_destination`; проверьте `SHOW log_destination` (stderr) |
| reload не меняет параметр | `context = postmaster` — нужен restart |
| Нет схемы shop | [basic/04-lab-ddl](../postgresql-basic/04-lab-ddl.md) |

## Критерии успеха

- [ ] Зафиксировали baseline параметров
- [ ] `ALTER SYSTEM` + `pg_reload_conf` без restart (для log_*)
- [ ] Медленный запрос попал в лог
- [ ] Видели checkpoint в логе
- [ ] Понимаете `pending_restart` на примере `wal_level`

## Дальше

WAL: [03-wal.md](03-wal.md).
