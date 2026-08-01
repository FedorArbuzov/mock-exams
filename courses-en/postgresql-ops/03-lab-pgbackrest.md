# 03. Lab: pgBackRest

## Why this lab

A full pgBackRest setup in Docker is optional; **required** is the RPO/RTO tabletop, walking through the config, and `pg_basebackup` as the foundation of physical backup.

## Prerequisites

- The [`deploy/postgres`](../../deploy/postgres/README.md) environment
- Read [01-backup-landscape](01-backup-landscape.md), [02-pgbackrest](02-pgbackrest.md)

## Task 1. Walk through pgbackrest.conf

Open [`examples/pgbackrest/pgbackrest.conf`](examples/pgbackrest/pgbackrest.conf).

Document `pgbackrest-tabletop.md`:

1. Draw the path: **primary → archive-push → repo → restore**.
2. What do `stanza-create`, `backup`, `restore --type=time` do?
3. Where in Postgres is `archive_mode` enabled?

## Task 2. RPO/RTO table

For a hypothetical prod (shop API, 200 GB):

| Backup type | Frequency | Retention | RPO contribution |
|-------------|-----------|-----------|------------------|
| full | weekly | 4 weeks | |
| diff | daily | | |
| WAL archive | continuous | 7 days | |
| pg_dump logical | daily | 30 days | portability |

Fill it in and state the **overall RPO** and **RTO** (estimated restore time).

## Task 3. pg_basebackup (hands-on)

```bash
docker exec mock-postgres pg_basebackup -U course -D /tmp/basebackup -Fp -Xs -P
docker exec mock-postgres du -sh /tmp/basebackup
docker exec mock-postgres ls /tmp/basebackup | head -20
```

Compare with a logical dump:

```bash
docker exec mock-postgres pg_dump -U course -Fc -f /tmp/course.dump course
docker exec mock-postgres ls -lh /tmp/course.dump
```

| | pg_basebackup | pg_dump -Fc |
|---|---------------|-------------|
| Time (record it) | | |
| Size | | |
| PITR possible? | with WAL | no |

## Task 4. Restore drill outline

The 5 steps of a quarterly drill (in text):

```text
1. Spin up an isolated VM/container
2. pgbackrest restore --type=time ... (or pg_basebackup + WAL)
3. start Postgres, pg_is_in_recovery / promote
4. SELECT count(*) sanity checks
5. Document duration → RTO actual
```

## Task 5. Optional — pgBackRest container

For advanced users: a sidecar with pgBackRest + a PGDATA volume — capture the `stanza-create` and `backup` output in a log.

## Success criteria

- [ ] WAL → repo diagram
- [ ] RPO/RTO table filled in
- [ ] `pg_basebackup` run
- [ ] Restore drill outline ≥ 5 steps

## Next

WAL-G: [04-wal-g.md](04-wal-g.md).
