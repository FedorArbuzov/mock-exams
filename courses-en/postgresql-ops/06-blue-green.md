# 06. Blue/green

## Scenario from work

An in-place major upgrade PG 16→17 means 2 hours of downtime. Product requires < 5 minutes. The team spins up a **green** cluster on 17, logical replication from **blue** (16), catches up the lag, and does a DNS cutover in 3 minutes of read-only. Blue stays for a week as a rollback option.

Blue/green means two parallel environments; you switch traffic rather than rewrite in place.

## What you'll learn

- The blue/green model for Postgres
- Switchover vs failover
- Replication lag before cutover
- The role of HAProxy, PgBouncer, Patroni

## The model

```text
Blue (current prod)                    Green (new)
├── Primary PG 16                      ├── PG 17 (replica → promote)
├── Apps → connection blue             ├── Catch-up replication
└── Backups                            └── Ready for cutover

Cutover: apps → green, blue decommission after retention
```

Use cases:

- Major version upgrade ([advanced/09-major-upgrade](../postgresql-advanced/09-major-upgrade.md))
- DC migration
- Hardware refresh
- A "bad" cluster — rebuild green from backup

## Switchover vs failover

| | Switchover | Failover |
|---|------------|----------|
| Planned | Yes, maintenance window | Emergency |
| Blue primary | Alive | Dead or unhealthy |
| Data loss | 0 with sync / caught-up lag | Depends on async lag |
| Rollback | Switch DNS back to blue | Harder |

## Physical vs logical for blue/green

| | Physical streaming | Logical replication |
|---|-------------------|---------------------|
| Same major | Yes | Yes |
| Cross-major upgrade | No (usually) | **Yes** — the typical 16→17 path |
| DDL | Replicated | **Not** automatically |
| Cutover | promote replica | sync + short RO window |

See [intermediate/07-logical-replication](../postgresql-intermediate/07-logical-replication.md).

## Replication lag before cutover

```sql
-- on the blue primary
SELECT application_name,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes
FROM pg_stat_replication;
```

Rule: **lag ≈ 0**, no active long transactions on blue, application ready for the read-only window.

On green after promote:

```sql
SELECT pg_is_in_recovery();  -- false
```

## Application and infrastructure

| Component | Action at cutover |
|-----------|----------------------|
| DNS / Service | TTL lowered ahead of time |
| K8s Secret DATABASE_URL | green endpoint |
| PgBouncer | reload pool → green ([intermediate/15-pgbouncer](../postgresql-intermediate/15-pgbouncer.md)) |
| Connection pools | drain blue connections |
| Idempotent consumers | in case of a dual-write phase |

## vs in-place pg_upgrade

| | Blue/green | pg_upgrade |
|---|------------|------------|
| Prep time | Days–weeks | Hours |
| Cutover downtime | Seconds–minutes | Minutes–hours |
| Rollback | Blue alive | Harder (--link) |
| Cost | 2× infra temporarily | 1× |

## Common mistakes

1. Cutover with 500MB of lag — data loss.
2. Forgot sequences on logical replication — duplicate keys.
3. DDL on blue without mirroring to green — broken pipeline.
4. Deleted blue after an hour — no rollback.

## Checklist

- [ ] Why 2 clusters vs in-place
- [ ] Logical replication for a major upgrade
- [ ] lag ≈ 0 before cutover
- [ ] Switchover vs failover
- [ ] The role of HAProxy/PgBouncer

## Next

Lab: [07-lab-blue-green.md](07-lab-blue-green.md).
