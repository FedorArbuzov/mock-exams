# Runbook: replication lag

## Symptoms

- Alert `pg_replication_lag_bytes` > threshold
- Application reads stale data from the replica

## Diagnosis

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

## Actions

1. Check the network between primary ↔ replica.
2. Load on the replica (heavy reports) — move it to an analytics replica.
3. `max_wal_size` / disk on the primary — is WAL not piling up?
4. On critical lag — stop traffic to the replica, let it catch up, then re-enable it.

## Escalation

- Lag > 1 GB and growing > 30 min — incident P1.
- Loss of a replica — rebuild with `pg_basebackup`.
