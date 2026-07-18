# 06. Blue/green

## Сценарий с работы

Major upgrade PG 16→17 in-place — 2 часа downtime. Product требует < 5 минут. Команда поднимает **green** кластер на 17, logical replication с **blue** (16), догоняет lag, cutover DNS за 3 минуты read-only. Blue остаётся для rollback неделю.

Blue/green — два параллельных окружения; переключение трафика, не переписывание на месте.

## Что вы узнаете

- Модель blue/green для Postgres
- Switchover vs failover
- Replication lag перед cutover
- Роль HAProxy, PgBouncer, Patroni

## Модель

```text
Blue (current prod)                    Green (new)
├── Primary PG 16                      ├── PG 17 (replica → promote)
├── Apps → connection blue             ├── Catch-up replication
└── Backups                            └── Ready for cutover

Cutover: apps → green, blue decommission after retention
```

Применения:

- Major version upgrade ([advanced/09-major-upgrade](../postgresql-advanced/09-major-upgrade.md))
- DC migration
- Hardware refresh
- «Плохой» кластер — rebuild green from backup

## Switchover vs failover

| | Switchover | Failover |
|---|------------|----------|
| Плановость | Да, maintenance window | Авария |
| Primary blue | Жив | Мёртв или unhealthy |
| Data loss | 0 при sync / caught-up lag | Зависит от async lag |
| Rollback | Переключить DNS обратно на blue | Сложнее |

## Physical vs logical для blue/green

| | Physical streaming | Logical replication |
|---|-------------------|---------------------|
| Same major | Да | Да |
| Cross-major upgrade | Нет (обычно) | **Да** — типичный путь 16→17 |
| DDL | Реплицируется | **Не** автоматически |
| Cutover | promote replica | sync + short RO window |

См. [intermediate/07-logical-replication](../postgresql-intermediate/07-logical-replication.md).

## Replication lag перед cutover

```sql
-- на primary blue
SELECT application_name,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes
FROM pg_stat_replication;
```

Правило: **lag ≈ 0**, нет active long transactions на blue, приложение готово к read-only window.

На green после promote:

```sql
SELECT pg_is_in_recovery();  -- false
```

## Приложение и инфраструктура

| Компонент | Действие при cutover |
|-----------|----------------------|
| DNS / Service | TTL заранее снижен |
| K8s Secret DATABASE_URL | green endpoint |
| PgBouncer | reload pool → green ([intermediate/15-pgbouncer](../postgresql-intermediate/15-pgbouncer.md)) |
| Connection pools | drain blue connections |
| Idempotent consumers | на случай dual-write фазы |

## vs in-place pg_upgrade

| | Blue/green | pg_upgrade |
|---|------------|------------|
| Prep time | Дни–недели | Часы |
| Cutover downtime | Секунды–минуты | Минуты–часы |
| Rollback | Blue жив | Сложнее (--link) |
| Cost | 2× infra временно | 1× |

## Типичные ошибки

1. Cutover при lag 500MB — потеря данных.
2. Забыли sequences на logical repl — duplicate keys.
3. DDL на blue без mirror на green — broken pipeline.
4. Удалили blue через час — нет rollback.

## Чек-лист

- [ ] Зачем 2 кластера vs in-place
- [ ] Logical repl для major upgrade
- [ ] lag ≈ 0 перед cutover
- [ ] Switchover vs failover
- [ ] HAProxy/PgBouncer роль

## Дальше

Лаба: [07-lab-blue-green.md](07-lab-blue-green.md).
