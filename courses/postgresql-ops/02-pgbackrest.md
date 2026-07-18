# 02. pgBackRest

## Сценарий с работы

Ночной full backup на 800 GB — 6 часов, окно сжато. DBA переходит на **pgBackRest**: parallel workers, incremental после full, WAL в S3, `pgbackrest check` в CI. В инциденте: `restore --type=time` на минуту до DROP — RPO соблюдён.

pgBackRest — де-факто стандарт self-hosted physical backup с PITR.

## Что вы узнаете

- Stanza, full/diff/incr
- `archive_command` и archive-push
- Команды backup, info, restore
- Retention и S3 repo

## Концепции

| Термин | Смысл |
|--------|-------|
| **Stanza** | Именованная группа PG кластеров в конфиге (`[course]`) — не database |
| **Repo** | Хранилище бэкапов (local, S3) |
| **Full** | Полный base backup |
| **Diff** | Отличия от последнего full |
| **Incr** | Отличия от последнего любого backup |
| **Archive** | Непрерывный поток WAL в repo |

```text
Primary → backup (full/diff/incr) → repo
       → archive-push (каждый WAL segment) → repo
Restore: backup + replay WAL до target time
```

## archive_command

```ini
archive_mode = on
archive_command = 'pgbackrest --stanza=course archive-push %p'
```

Без работающего archive-push **PITR обрывается** на момент последнего backup.

## Типичные команды

```bash
pgbackrest --stanza=course stanza-create
pgbackrest --stanza=course check
pgbackrest --stanza=course backup --type=full
pgbackrest --stanza=course backup --type=diff
pgbackrest --stanza=course info
pgbackrest --stanza=course verify
```

PITR restore:

```bash
pgbackrest --stanza=course restore \
  --type=time "--target=2026-06-25 13:55:00+00" \
  --target-action=promote
```

На **изолированном** хосте с пустым PGDATA — не поверх prod.

## Конфиг

См. [`examples/pgbackrest/pgbackrest.conf`](examples/pgbackrest/pgbackrest.conf):

```ini
[global]
repo1-path=/var/lib/pgbackrest
repo1-retention-full=2
start-fast=y

[course]
pg1-path=/var/lib/postgresql/data
pg1-port=5432
pg1-user=postgres
```

S3:

```ini
repo1-type=s3
repo1-s3-bucket=pg-backups
repo1-s3-region=us-east-1
```

Секреты — Vault/K8s Secret ([secrets-basic](../secrets-basic/README.md)), не git.

## Retention

```ini
repo1-retention-full=2
repo1-retention-diff=4
```

Планируйте: сколько full хранить, legal hold, cost S3.

## Целостность

```bash
pgbackrest --stanza=course verify
```

В restore drill — `check` + test queries. `pg_verifybackup` (PG 13+) для base backups.

## vs WAL-G

| | pgBackRest | WAL-G |
|---|------------|-------|
| Config | pgbackrest.conf | env vars |
| Features | verify, stanza, rich retention | проще, cloud WAL |
| Когда | enterprise self-hosted | K8s, minimal agent |

## Типичные ошибки

1. `stanza-create` на живом кластере без `archive_command` — PITR gap.
2. Restore поверх running PGDATA — corruption.
3. Секреты S3 в git в pgbackrest.conf.
4. Retention full=1 — нет отката к прошлой неделе.

## Чек-лист

- [ ] Stanza vs database
- [ ] Зачем incr/diff после full
- [ ] `pgbackrest info` и verify
- [ ] archive-push в archive_command
- [ ] Restore на изолированном инстансе

## Дальше

Лаба: [03-lab-pgbackrest.md](03-lab-pgbackrest.md).
