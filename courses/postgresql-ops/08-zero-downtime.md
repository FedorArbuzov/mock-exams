# 08. Zero-downtime

## Сценарий с работы

Product: «добавьте колонку `status` в orders без downtime». DBA: `ALTER ADD COLUMN` — milliseconds. Но `DROP COLUMN` старого поля — ломает старый deploy. Решение: **expand/contract** в три релиза. Другой кейс: индекс на 500M rows — `CREATE INDEX` блокирует writes; **`CONCURRENTLY`** — нет.

Zero-downtime — дисциплина миграций + replication cutover, не магия Postgres.

## Что вы узнаете

- Expand/contract для schema
- Logical replication cutover
- `pg_rewind` после promote
- Когда достаточно CONCURRENTLY

## Expand / contract (schema)

```text
Phase 1 EXPAND:
  ADD COLUMN status text NULL;
  Deploy app v2: writes status, reads COALESCE(status, legacy)

Phase 2 BACKFILL:
  UPDATE orders SET status = 'pending' WHERE status IS NULL;
  (batch job, no lock storm)

Phase 3 CONTRACT:
  Deploy app v3: only new column
  ALTER DROP old column;  -- после 100% on new code
```

| Операция | Zero-downtime? |
|----------|----------------|
| `ADD COLUMN NULL` | Да (PG 11+ fast) |
| `ADD COLUMN DEFAULT` | PG 11+ — не rewrite table |
| `DROP COLUMN` | Блокирует пока app использует |
| `RENAME COLUMN` | Нужен expand (add + copy + drop) |
| `CREATE INDEX` | **Нет** — use `CONCURRENTLY` |
| `ALTER TYPE` | Часто rewrite — планировать |

Feature flags координируют app v1/v2 ([developer migrations](../postgresql-developer/README.md)).

## Logical replication cutover

Для major upgrade / cluster move:

```text
1. Publication on old, subscription on new
2. Catch-up lag → 0
3. Short read-only on old (seconds–minutes)
4. Drop subscription, redirect apps
5. Keep old read-only for rollback window
```

DDL на old **не** летит — mirror вручную или migration tool.

## pg_rewind

После failover old primary можно **rejoin** как replica без full `pg_basebackup`:

```bash
pg_rewind --target-pgdata=/var/lib/postgresql/data \
  --source-server='host=new_primary ...'
```

Требует: `wal_log_hints` or data checksums, совместимые timelines. Patroni делает автоматически.

## Major upgrade paths (сводка)

| Метод | Downtime cutover | Сложность |
|-------|------------------|-----------|
| `pg_upgrade --link` | Минуты | Средняя |
| Blue/green + logical | Секунды–минуты RO | Высокая |
| pg_dump/restore | Часы | Низкая |

## CREATE INDEX CONCURRENTLY

```sql
CREATE INDEX CONCURRENTLY orders_status_idx ON shop.orders (status);
```

Не блокирует writes; дольше; может fail — проверять `pg_index.indisvalid`.

## Типичные ошибки

1. DROP COLUMN в том же релизе что ADD — старые pods падают.
2. Backfill без batch — long locks.
3. Logical cutover без sequence sync.
4. `CREATE INDEX` без CONCURRENTLY на prod.

## Чек-лист

- [ ] Почему DROP COLUMN не zero-downtime
- [ ] Feature flags в expand/contract
- [ ] CREATE INDEX CONCURRENTLY
- [ ] pg_rewind — зачем
- [ ] Logical cutover RO window

## Дальше

Лаба: [09-lab-cutover.md](09-lab-cutover.md).
