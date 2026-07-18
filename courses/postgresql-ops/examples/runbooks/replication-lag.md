# Runbook: replication lag

## Симптомы

- Алерт `pg_replication_lag_bytes` > threshold
- Приложение читает stale data с replica

## Диагностика

```sql
-- primary
SELECT application_name, state, sync_state,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes
FROM pg_stat_replication;
```

```sql
-- replica
SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn(),
       pg_is_in_recovery();
```

## Действия

1. Проверить сеть primary ↔ replica.
2. Нагрузка на replica (тяжёлые отчёты) — перенести на analytics replica.
3. `max_wal_size` / disk на primary — WAL не копится?
4. При критическом lag — остановить трафик на replica, догнать, включить.

## Escalation

- Lag > 1 GB и растёт > 30 min — incident P1.
- Потеря replica — rebuild `pg_basebackup`.
