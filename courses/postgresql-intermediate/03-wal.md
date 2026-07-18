# 03. WAL и durability

## Сценарий с работы

Сервер обесточили во время пика заказов. После старта Postgres «ожил» — последние транзакции либо на месте, либо откатились целиком, но нет «полузаписанных» денег. Это **WAL**. Другой инцидент: диск забит на 100%, папка `pg_wal` — 200 GB. Причина — отставшая replica + replication slot без consumer, WAL не перерабатывается.

В [basic/11-transactions-mvcc](../postgresql-basic/11-transactions-mvcc.md) вы видели MVCC; WAL — слой **durability** и основа репликации/PITR.

## Что вы узнаете

- Порядок записи: WAL → data pages
- `synchronous_commit` и компромисс latency/durability
- `wal_level` и требования репликации
- Архивация WAL для PITR
- Почему `pg_wal` раздувается и как диагностировать

## Write-Ahead Log

Правило: **сначала журнал, потом данные**.

```text
INSERT/UPDATE/DELETE
    → запись в WAL buffer
    → fsync WAL на диск (при commit, если synchronous_commit=on)
    → изменение data pages в shared_buffers
    → позже — сброс на диск (background writer / checkpoint)
```

При crash Postgres **replay** WAL с последнего consistent checkpoint и восстанавливает committed transactions.

| Без WAL | С WAL |
|---------|-------|
| Страница на диске могла бы обновиться до commit | Commit = запись в WAL |
| Crash → torn pages, corruption | Crash → replay |

## synchronous_commit

```sql
SHOW synchronous_commit;
SET synchronous_commit = off;  -- только осознанно, на сессию
```

| Значение | Durability | Latency |
|----------|------------|---------|
| `on` (default) | Commit после WAL flush | Стандарт OLTP |
| `off` | WAL может не успеть на диск | Выше RPS, риск потери ~последних секунд при crash |
| `remote_write` / `remote_apply` | Ждать standby ([05-streaming-replication](05-streaming-replication.md)) | HA, выше latency commit |

Для staging иногда `off` на bulk load; для денег — `on` или синхронная replica.

## wal_level

```sql
SHOW wal_level;
```

| Уровень | Репликация | Archive / PITR |
|---------|------------|----------------|
| `minimal` | Нет streaming | Ограниченно |
| `replica` | Physical standby, slots | Да |
| `logical` | + logical decoding | Да |

Для streaming replica — минимум **`replica`**. Для [logical replication](07-logical-replication.md) — **`logical`**. Смена уровня — **restart** primary.

## Архивация WAL

PITR ([09-pitr](09-pitr.md)) требует непрерывной цепочки WAL **вне** PGDATA:

```ini
archive_mode = on
archive_command = 'test ! -f /wal_archive/%f && cp %p /wal_archive/%f'
```

В облаке: `aws s3 cp`, `rclone`, WAL-G ([ops/04-wal-g](../postgresql-ops/04-wal-g.md)).

```sql
SELECT * FROM pg_stat_archiver;
```

`failed_count` > 0 — срочно: без archive PITR обрывается, `pg_wal` может расти.

## Размер pg_wal — почему растёт

```bash
docker exec mock-postgres du -sh /var/lib/postgresql/data/pg_wal
```

Причины:

1. **Replication slot** — consumer отстал или умер; WAL удерживается.
2. **Archive command fails** — сегменты не уходят в archive.
3. **Long transaction** — мешает recycle (реже раздувает pg_wal напрямую, но влияет на vacuum/xmin).
4. **Checkpoint не успевает** — при всплеске записи.

Диагностика слотов:

```sql
SELECT slot_name, active, wal_status,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
FROM pg_replication_slots;
```

`retained` гигабайты при `active = false` — классический инцидент «забыли удалить slot».

## LSN — логическая позиция в WAL

```sql
SELECT pg_current_wal_lsn();
SELECT pg_walfile_name(pg_current_wal_lsn());
```

LSN (Log Sequence Number) — адрес в потоке WAL. На primary и replica сравнивают `sent_lsn` vs `replay_lsn` для lag ([05-streaming-replication](05-streaming-replication.md)).

## Типичные ошибки

1. `archive_mode=on`, но `archive_command` всегда падает — ложное чувство безопасности.
2. Создали logical slot и забыли subscription — WAL копится.
3. `synchronous_commit=off` на проде «для скорости» без согласования RPO.
4. Копирование PGDATA вместо base backup + WAL archive.

## Чек-лист

- [ ] Зачем WAL, если есть data files
- [ ] `wal_level replica` для чего
- [ ] Replication slot без consumer — риск
- [ ] `archive_mode` и связь с PITR
- [ ] Где смотреть `pg_stat_archiver` и slots

## Дальше

Лаба: [04-lab-wal.md](04-lab-wal.md).
