# 09. Major upgrade: pg_upgrade

## Сценарий с работы

Postgres 16 EOL через 6 месяцев. Команда планирует «ночь простоя + pg_dump всей 800 GB БД» — 14 часов, риск не уложиться. Альтернатива: **pg_upgrade** за 2 часа или **logical replication** с cutover 15 минут. Неправильный выбор — downtime SLA breach и откат невозможен.

Major upgrade (16→17) ≠ minor patch. Эта глава — стратегии и `pg_upgrade`; managed — blue/green ([13-cloud-k8s](13-cloud-k8s.md)).

## Что вы узнаете

- Сравнение dump/restore, pg_upgrade, logical replication
- `pg_upgrade --check` и `--link`
- Чеклист до/после upgrade
- Rollback и extensions
- RDS blue/green overview

## Стратегии

| Метод | Downtime | Сложность | Откат |
|-------|----------|-----------|-------|
| **pg_dump / restore** | Долгий (пропорционален размеру) | Низкая | Новый кластер, старый жив |
| **pg_upgrade** | Короче (in-place data dir) | Средняя | Сложнее с `--link` |
| **Logical replication** | Минимальный cutover | Высокая | Можно dual-write период |

```text
pg_dump:     old PG ──export──> SQL/custom ──import──> new PG
pg_upgrade:  old PGDATA ──migrate pages──> new PGDATA (same host)
logical:     old primary ──pub/sub──> new cluster ──cutover──>
```

## pg_upgrade

```bash
pg_upgrade \
  --old-datadir=/var/lib/postgresql/16/data \
  --new-datadir=/var/lib/postgresql/17/data \
  --old-bindir=/usr/lib/postgresql/16/bin \
  --new-bindir=/usr/lib/postgresql/17/bin \
  --check
```

Без `--check` не начинайте production window.

| Флаг | Смысл |
|------|-------|
| `--check` | Только проверки, без изменений |
| `--link` | Hard link data files — **быстро**, старый PGDATA нельзя использовать как откат |
| `-j 4` | Parallel для dump globals/statistics |
| `--clone` | APFS/reflink где поддерживается |

После успешного upgrade:

```bash
./analyze_new_cluster.sh   # генерируется pg_upgrade
./delete_old_cluster.sh    # только когда уверены
```

## Чеклист до upgrade

1. **Прочитать release notes** PG 17 — breaking changes, removed features.
2. `pg_dumpall --globals-only` — роли, tablespaces.
3. Список extensions + совместимость версий на PG 17.
4. `pg_upgrade --check` на копии PGDATA.
5. Disk space: без `--link` — ~полный размер кластера; с `--link` — меньше, но откат hard.
6. Maintenance window + коммуникация.
7. Rollback plan: snapshot volume / старый кластер не тронут до verify.
8. Application: совместимость drivers, ORM, SQL.

## После upgrade

```sql
ANALYZE;
-- при смене collation provider в major:
-- REINDEX DATABASE ...;
SELECT extname, extversion FROM pg_extension;
ALTER EXTENSION pg_stat_statements UPDATE;
```

Мониторинг 24–48h: планы запросов, errors, replication lag.

## Logical replication path

Для near-zero downtime:

1. Новый PG 17 cluster.
2. `CREATE PUBLICATION` на old (wal_level=logical).
3. `CREATE SUBSCRIPTION` на new, catchup.
4. Cutover: stop writes, lag=0, redirect app, drop old.

Подробнее: [intermediate/07-logical-replication](../postgresql-intermediate/07-logical-replication.md).

## Managed (RDS / Aurora)

AWS **blue/green deployment**: green на новой версии, replication, switchover. Вы не запускаете `pg_upgrade` вручную — но **тестируете** на green до switch.

## Типичные ошибки

1. `pg_upgrade --link` без понимания — нет file-level rollback.
2. Extension `postgis` несовместим — upgrade падает в window.
3. Забыли `ANALYZE` — «всё медленно после upgrade».
4. Cutover logical replication без проверки sequences.

## Чек-лист

- [ ] pg_upgrade --link риск
- [ ] Extensions проверка в --check
- [ ] ANALYZE после upgrade
- [ ] Logical replication upgrade path — 3 шага
- [ ] Rollback без --link

## Дальше

Лаба-план: [10-lab-upgrade.md](10-lab-upgrade.md).
