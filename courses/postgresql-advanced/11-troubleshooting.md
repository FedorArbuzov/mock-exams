# 11. Troubleshooting: locks и deadlocks

## Сценарий с работы

14:00 — deploy миграции `ALTER TABLE orders ADD COLUMN ...`. 14:05 — API timeout. `pg_stat_activity`: миграция ждёт `AccessExclusiveLock`, блокирует её transaction с `idle in transaction` от утреннего скрипта. 14:20 — deadlock между двумя воркерами Celery, обновляющими заказы в разном порядке.

Advanced troubleshooting — систематический разбор **locks**, **deadlocks**, **disk**, **connections**.

## Что вы узнаете

- Запрос blocked/blocking
- Lock modes и конфликты DDL
- Deadlock detection
- cancel vs terminate
- Disk full и connection storm

Связь: [intermediate/13-monitoring](../postgresql-intermediate/13-monitoring.md), [ops runbooks](../postgresql-ops/10-oncall-runbooks.md).

## Кто кого блокирует

```sql
SELECT blocked.pid AS blocked_pid,
       left(blocked.query, 60) AS blocked_query,
       blocking.pid AS blocking_pid,
       left(blocking.query, 60) AS blocking_query,
       blocking.state AS blocking_state,
       now() - blocking.xact_start AS blocking_xact_age
FROM pg_stat_activity blocked
JOIN pg_locks bl ON bl.pid = blocked.pid AND NOT bl.granted
JOIN pg_locks blks ON bl.locktype = blks.locktype
  AND bl.database IS NOT DISTINCT FROM blks.database
  AND bl.relation IS NOT DISTINCT FROM blks.relation
  AND bl.page IS NOT DISTINCT FROM blks.page
  AND bl.tuple IS NOT DISTINCT FROM blks.tuple
  AND bl.virtualxid IS NOT DISTINCT FROM blks.virtualxid
  AND bl.transactionid IS NOT DISTINCT FROM blks.transactionid
  AND bl.classid IS NOT DISTINCT FROM blks.classid
  AND bl.objid IS NOT DISTINCT FROM blks.objid
  AND bl.objsubid IS NOT DISTINCT FROM blks.objsubid
  AND bl.pid <> blks.pid
JOIN pg_stat_activity blocking ON blocking.pid = blks.pid;
```

Дополнительно:

```sql
SELECT locktype, relation::regclass, mode, granted, pid
FROM pg_locks
WHERE NOT granted OR relation IS NOT NULL
ORDER BY pid;
```

## Lock modes (упрощённо)

| Mode | Типичная операция | Блокирует |
|------|-------------------|-----------|
| `AccessShareLock` | SELECT | AccessExclusive |
| `RowExclusiveLock` | INSERT/UPDATE/DELETE | Exclusive, AccessExclusive |
| `ShareLock` | CREATE INDEX (non concurrent) | RowExclusive, Write |
| `AccessExclusiveLock` | ALTER, DROP, VACUUM FULL, TRUNCATE | **Всё** |

**idle in transaction** + открытый SELECT держит `AccessShareLock` — **ALTER TABLE** ждёт AccessExclusive → очередь из всех writers.

Профилактика:

```sql
ALTER SYSTEM SET idle_in_transaction_session_timeout = '5min';
SELECT pg_reload_conf();
```

## Deadlock

Postgres **детектирует** deadlock и abort **одну** transaction:

```text
ERROR:  deadlock detected
DETAIL: Process 12345 waits for ShareLock on transaction 67890; blocked by process 54321...
```

```ini
deadlock_timeout = 1s
log_lock_waits = on
```

Типичный паттерн: Tx1: lock row A → row B; Tx2: lock B → A.

Решение в app: **единый порядок** обновления строк (sort by id); короткие transactions.

## cancel vs terminate

```sql
SELECT pg_cancel_backend(pid);      -- SIGINT — отменить текущий query
SELECT pg_terminate_backend(pid);   -- SIGTERM — разорвать сессию
```

| | cancel | terminate |
|---|--------|-----------|
| idle in transaction | не поможет | да |
| active long query | да | да |
| replication sender | осторожно | может сломать replica |

Сначала identify `application_name`, согласовать с владельцем сессии.

## Диск полон

Симптомы: INSERT fail, DB in recovery, archive fails.

Порядок проверки:

```bash
df -h $PGDATA
du -sh $PGDATA/pg_wal
```

| Причина | Действие |
|---------|----------|
| WAL не архивируется | Fix archive_command; [intermediate/03-wal](../postgresql-intermediate/03-wal.md) |
| Replication slot | Drop stale slot / fix consumer |
| Temp files | `log_temp_files`; тяжёлые sorts |
| Log files | Ротация |

## Connection storm

```text
FATAL: sorry, too many clients already
```

1. `pg_stat_activity` count by `application_name`
2. PgBouncer ([intermediate/15](../postgresql-intermediate/15-pgbouncer.md))
3. `max_connections` — последний рычаг, не первый

## Типичные ошибки

1. `terminate` replication без failover plan.
2. Миграция DDL в пик без `lock_timeout`.
3. Игнорировать `blocking_state = idle in transaction`.
4. Убить random backend — потеря данных незакоммиченной txn.

## Чек-лист

- [ ] cancel vs terminate
- [ ] idle in transaction + ALTER — что будет (блок)
- [ ] Deadlock — кого abort Postgres (одну txn)
- [ ] Disk full — первая проверка pg_wal
- [ ] Запрос blocked/blocking сохранён в runbook

## Дальше

Лаба: [12-lab-troubleshooting.md](12-lab-troubleshooting.md).
