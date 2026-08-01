# 02. pgBackRest

## Scenario from work

A nightly full backup of 800 GB takes 6 hours, and the window is tight. The DBA switches to **pgBackRest**: parallel workers, incremental after full, WAL in S3, `pgbackrest check` in CI. During an incident: `restore --type=time` to the minute before the DROP — RPO met.

pgBackRest is the de-facto standard for self-hosted physical backup with PITR.

## What you'll learn

- Stanza, full/diff/incr
- `archive_command` and archive-push
- backup, info, restore commands
- Retention and S3 repo

## Concepts

| Term | Meaning |
|--------|-------|
| **Stanza** | A named group of PG clusters in the config (`[course]`) — not a database |
| **Repo** | Backup storage (local, S3) |
| **Full** | Full base backup |
| **Diff** | Differences from the last full |
| **Incr** | Differences from the last backup of any kind |
| **Archive** | Continuous stream of WAL into the repo |

```text
Primary → backup (full/diff/incr) → repo
       → archive-push (each WAL segment) → repo
Restore: backup + replay WAL up to target time
```

## archive_command

```ini
archive_mode = on
archive_command = 'pgbackrest --stanza=course archive-push %p'
```

Without a working archive-push, **PITR is cut off** at the moment of the last backup.

## Common commands

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

On an **isolated** host with an empty PGDATA — not on top of prod.

## Config

See [`examples/pgbackrest/pgbackrest.conf`](examples/pgbackrest/pgbackrest.conf):

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

Secrets go in Vault/K8s Secret ([secrets-basic](../secrets-basic/README.md)), not git.

## Retention

```ini
repo1-retention-full=2
repo1-retention-diff=4
```

Plan ahead: how many fulls to keep, legal hold, S3 cost.

## Integrity

```bash
pgbackrest --stanza=course verify
```

In a restore drill — `check` + test queries. `pg_verifybackup` (PG 13+) for base backups.

## vs WAL-G

| | pgBackRest | WAL-G |
|---|------------|-------|
| Config | pgbackrest.conf | env vars |
| Features | verify, stanza, rich retention | simpler, cloud WAL |
| When | enterprise self-hosted | K8s, minimal agent |

## Common mistakes

1. `stanza-create` on a live cluster without `archive_command` — PITR gap.
2. Restore on top of a running PGDATA — corruption.
3. S3 secrets in git in pgbackrest.conf.
4. Retention full=1 — no way to roll back to last week.

## Checklist

- [ ] Stanza vs database
- [ ] Why incr/diff after full
- [ ] `pgbackrest info` and verify
- [ ] archive-push in archive_command
- [ ] Restore on an isolated instance

## Next

Lab: [03-lab-pgbackrest.md](03-lab-pgbackrest.md).
