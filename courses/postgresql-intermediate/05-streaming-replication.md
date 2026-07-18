# 05. Streaming (physical) replication

## Сценарий с работы

Primary упал в 03:00. Команда поднимает «бэкап» — поднимают **второй** Postgres с вчерашним `pg_dump`. Потеря 24 часа заказов. Правильный путь: **standby**, догоняющий WAL в реальном времени, и продуманный failover. Другой день: отчёты грузят primary — DBA переносит read-only на replica, но не проверяет **lag**; пользователи видят вчерашние остатки.

Physical (streaming) replication копирует **байты WAL** — побайтовая копия кластера на standby. Это фундамент HA до Patroni ([advanced](../postgresql-advanced/README.md)).

## Что вы узнаете

- Схему primary → standby и hot standby
- Настройку primary: `wal_level`, replication role, `pg_hba`
- `pg_basebackup` и файлы `standby.signal`
- Синхронную репликацию и lag
- Что можно/нельзя на replica

## Primary и standby

```text
Primary (read/write)
    │  WAL stream (TCP, replication protocol)
    ▼
Standby (hot standby: read-only SELECT)
```

Standby в режиме **recovery** применяет WAL почти в реальном времени. Не путать с logical replication ([07-logical-replication](07-logical-replication.md)) — там таблицы и publication.

## Настройка primary

`postgresql.conf` (часть требует restart):

```ini
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
wal_keep_size = 1GB
```

Роль репликации:

```sql
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'repl_pass';
```

`pg_hba.conf`:

```text
host  replication  replicator  10.0.0.0/24  scram-sha-256
host  replication  replicator  172.16.0.0/12  scram-sha-256
```

Для Docker-сети — подсеть compose. После правки: `pg_reload_conf()` для hba; restart для `wal_level`.

## Создание standby

```bash
pg_basebackup -h primary-host -p 5432 -U replicator \
  -D /var/lib/postgresql/data \
  -Fp -Xs -P -R
```

| Флаг | Смысл |
|------|-------|
| `-Fp` | plain format (tar — альтернатива) |
| `-Xs` | stream WAL во время backup |
| `-P` | progress |
| `-R` | создать `postgresql.auto.conf` с `primary_conninfo` + `standby.signal` |

Standby стартует с `PGDATA` из backup и подключается к primary.

На PG 12+ файл **`standby.signal`** в PGDATA означает «я replica». Раньше — `recovery.conf`.

## Мониторинг на primary

```sql
SELECT application_name, client_addr, state, sync_state,
       sent_lsn, write_lsn, flush_lsn, replay_lsn,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS byte_lag
FROM pg_stat_replication;
```

| state | Смысл |
|-------|-------|
| `streaming` | Норма |
| `catchup` | Догоняет после connect |
| `startup` | Старт |

**Lag** — разница LSN. Растёт при: сеть, replica медленнее диск, heavy read на replica, long recovery conflict.

На standby:

```sql
SELECT pg_is_in_recovery();           -- true
SELECT pg_last_wal_receive_lsn();
SELECT pg_last_wal_replay_lsn();
SELECT now() - pg_last_xact_replay_timestamp() AS replay_lag;
```

`replay_lag` NULL если ещё не было транзакций после promote/старт.

## Синхронная репликация

```sql
ALTER SYSTEM SET synchronous_standby_names = 'FIRST 1 (standby1)';
```

Commit на primary ждёт, пока standby **flush** WAL. Меньше потерь при падении primary (RPO≈0), выше latency commit.

| | Async | Sync |
|---|-------|------|
| RPO при падении primary | До lag | ~0 |
| Latency write | Ниже | Выше |
| Риск | Потерять последние commits | Primary ждёт медленную replica |

## Read queries на replica

```sql
-- на standby
SELECT count(*) FROM shop.products;   -- OK
INSERT INTO shop.products ...;        -- ERROR: read-only transaction
```

**Recovery conflicts:** долгий SELECT на replica может блокировать применение WAL (vacuum на primary удалил строку, которую читает replica). Параметр `max_standby_streaming_delay`.

## Failover (preview)

Ручной: `pg_ctl promote` или `SELECT pg_promote();` — standby становится primary. Автоматика — **Patroni**, **repmgr**, managed RDS Multi-AZ ([advanced/02-lab-patroni](../postgresql-advanced/02-lab-patroni.md)).

Failover ≠ switchover: при failover возможна потеря данных при async replication.

## Типичные ошибки

1. `wal_level=minimal` на primary — replica не подключится.
2. Нет строки `replication` в hba — connection refused.
3. Читают с lagging replica как с source of truth для остатков.
4. Забыли `hot_standby=on` (default on) — replica не принимает SELECT.

## Чек-лист

- [ ] Physical vs logical replication
- [ ] hot standby — SELECT да, INSERT нет
- [ ] Причины роста lag
- [ ] Когда `pg_basebackup` vs `pg_dump`
- [ ] `pg_stat_replication` — ключевые колонки

## Дальше

Лаба: [06-lab-streaming-replication.md](06-lab-streaming-replication.md).
