# 12. Мониторинг для ops

## Сценарий с работы

Алерт «Postgres CPU high» без runbook — дежурный рестартит контейнер. Оказалось: replication lag 2GB, не CPU. Другой день: backup job failed 3 дня — никто не заметил, пока не понадобился PITR.

Ops-мониторинг связывает **метрику → порог → runbook → действие**.

## Что вы узнаете

- Ключевые метрики и пороги
- postgres_exporter + Grafana
- Логи для ops и security
- On-call dashboard layout

Связь: [intermediate/13-monitoring](../postgresql-intermediate/13-monitoring.md), [observability-basic](../observability-basic/README.md).

## Ключевые метрики

| Метрика | Порог (пример) | Runbook |
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

Алерты в Prometheus → Alertmanager → PagerDuty с **ссылкой на runbook**.

## Логи

| Setting | Ops use |
|---------|---------|
| `log_min_duration_statement` | Slow query |
| `log_checkpoints` | I/O spikes |
| `log_lock_waits` | Deadlock debug |
| `log_connections` / `log_disconnections` | Security audit |
| `auto_explain` | Plan on slow (careful log_analyze) |

Centralize: Loki, CloudWatch, ELK.

## On-call dashboard (один экран)

```text
Row 1: lag | connections % | disk %
Row 2: TPS / commit rate | deadlocks
Row 3: top 5 pg_stat_statements total_time
Row 4: last backup success | archiver failed
Row 5: idle in transaction count
```

Каждая панель — аннотация с runbook URL.

## Alert anti-patterns

| Плохо | Хорошо |
|-------|--------|
| Alert без runbook | Runbook link in annotation |
| 100 alerts/night fatigue | SLO-based thresholds |
| Only CPU alert | lag, disk, backup, archiver |

## lag vs replay pause

**Lag bytes** — primary ahead of replica.  
**Replay paused** — recovery conflict, long query on replica blocks apply.  
Диагностика на replica: `pg_stat_activity`, `max_standby_streaming_delay`.

## Типичные ошибки

1. Мониторить CPU, не lag и disk.
2. Нет алерта на backup failure.
3. Dashboard 50 панелей — никто не смотрит on-call.
4. `pg_stat_statements` не в preload — пустые метрики.

## Чек-лист

- [ ] 8 метрик с порогами
- [ ] Alert → runbook link
- [ ] Backup success monitored
- [ ] On-call dashboard sketch
- [ ] lag vs replay pause

## Дальше

Финал: [13-final-project.md](13-final-project.md).
