# 12. Monitoring for ops

## Scenario from work

A "Postgres CPU high" alert with no runbook — the on-call restarts the container. Turns out it was replication lag of 2GB, not CPU. Another day: a backup job failed for 3 days — nobody noticed until PITR was needed.

Ops monitoring links **metric → threshold → runbook → action**.

## What you'll learn

- Key metrics and thresholds
- postgres_exporter + Grafana
- Logs for ops and security
- On-call dashboard layout

Related: [intermediate/13-monitoring](../postgresql-intermediate/13-monitoring.md), [observability-basic](../observability-basic/README.md).

## Key metrics

| Metric | Threshold (example) | Runbook |
|---------|----------------|---------|
| Replication lag bytes | > 100MB 5m | [replication-lag](examples/runbooks/replication-lag.md) |
| Disk % PGDATA | > 80% warn, > 90% crit | [disk-full](examples/runbooks/disk-full.md) |
| Connections / max_connections | > 80% 5m | PgBouncer, pool |
| `pg_stat_archiver.failed_count` | > 0 | archive fix |
| Backup last success age | > 25h | pgBackRest/WAL-G |
| Oldest xmin / freeze age | approaching limit | vacuum emergency |
| Deadlocks rate | spike 10x | app, lock order |
| `idle in transaction` count | > 0 for 5m | terminate, app fix |
| Replication slot retained WAL | > 10GB | drop stale slot |

## postgres_exporter

```yaml
# scrape postgres_exporter :9187
# metrics: pg_stat_activity_count, pg_replication_lag, pg_database_size_bytes
```

Grafana dashboards: community Postgres Overview, CRDB-derived, custom on-call single pane.

Alerts in Prometheus → Alertmanager → PagerDuty with **a link to the runbook**.

## Logs

| Setting | Ops use |
|---------|---------|
| `log_min_duration_statement` | Slow query |
| `log_checkpoints` | I/O spikes |
| `log_lock_waits` | Deadlock debug |
| `log_connections` / `log_disconnections` | Security audit |
| `auto_explain` | Plan on slow (careful with log_analyze) |

Centralize: Loki, CloudWatch, ELK.

## On-call dashboard (one screen)

```text
Row 1: lag | connections % | disk %
Row 2: TPS / commit rate | deadlocks
Row 3: top 5 pg_stat_statements total_time
Row 4: last backup success | archiver failed
Row 5: idle in transaction count
```

Each panel — an annotation with the runbook URL.

## Alert anti-patterns

| Bad | Good |
|-------|--------|
| Alert without a runbook | Runbook link in annotation |
| 100 alerts/night fatigue | SLO-based thresholds |
| Only a CPU alert | lag, disk, backup, archiver |

## lag vs replay pause

**Lag bytes** — the primary is ahead of the replica.  
**Replay paused** — a recovery conflict, a long query on the replica blocks apply.  
Diagnosis on the replica: `pg_stat_activity`, `max_standby_streaming_delay`.

## Common mistakes

1. Monitoring CPU, not lag and disk.
2. No alert on backup failure.
3. A dashboard with 50 panels — nobody looks at it on-call.
4. `pg_stat_statements` not in preload — empty metrics.

## Checklist

- [ ] 8 metrics with thresholds
- [ ] Alert → runbook link
- [ ] Backup success monitored
- [ ] On-call dashboard sketch
- [ ] lag vs replay pause

## Next

Final: [13-final-project.md](13-final-project.md).
