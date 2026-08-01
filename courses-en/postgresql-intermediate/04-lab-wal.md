# 04. Lab: WAL and pg_current_wal_lsn

## Why this lab

LSN and WAL segments stay abstract until you see how `pg_current_wal_lsn()` changes after a write and how `pg_switch_wal()` creates a new file in `pg_wal`. This is the language of replication and PITR.

## Prerequisites

- The environment is running, `wal_level` ≥ `replica` ([02-lab-configuration](02-lab-configuration.md)).
- Connect as `course`.

## Task 1. Current WAL position

```sql
SELECT pg_current_wal_lsn() AS lsn_before;
SELECT pg_walfile_name(pg_current_wal_lsn()) AS wal_file;
```

Write down `lsn_before` and the file name (for example `000000010000000000000001`).

## Task 2. Writing data and a new LSN

```sql
INSERT INTO shop.products (sku, name, price)
VALUES ('wal-lab-' || floor(random()*1000), 'WAL test', 1.00);

SELECT pg_current_wal_lsn() AS lsn_after;
```

**Expected:** `lsn_after` ≥ `lsn_before` (strictly greater on a real write).

## Task 3. Forced segment switch

```sql
SELECT pg_switch_wal();
SELECT pg_walfile_name(pg_current_wal_lsn()) AS wal_file_after_switch;
```

The file name may change to the next segment.

## Task 4. Size of the pg_wal directory

```bash
docker exec mock-postgres du -sh /var/lib/postgresql/data/pg_wal
docker exec mock-postgres ls /var/lib/postgresql/data/pg_wal | wc -l
```

On the lab environment — tens to hundreds of megabytes, a few files. Remember the order of magnitude for comparison during an incident.

## Task 5. Archiving — a written task

Create a file `wal-archive-notes.md` (locally, for yourself) with answers:

1. How to enable `archive_mode` and `archive_command` in production.
2. Where to put WAL: S3, NFS, MinIO ([deploy/postgres ops compose](../../deploy/postgres/README.md)).
3. What to monitor in `pg_stat_archiver`.
4. How a replication slot affects the size of `pg_wal`.

Example `archive_command` for S3 (pseudocode):

```bash
archive_command = 'aws s3 cp %p s3://my-bucket/pg-wal/%f'
```

## Task 6. Slots (viewing)

```sql
SELECT * FROM pg_replication_slots;
```

On a clean environment — empty or slots from previous experiments. After [08-lab-logical-replication](08-lab-logical-replication.md) a logical slot will appear.

## If something went wrong

| Symptom | Fix |
|---------|---------|
| `function pg_switch_wal() does not exist` | Very old version; it exists in PG 16 |
| LSN doesn't change | The transaction isn't committed; `INSERT` in autocommit |
| No shop.products | [basic/04-lab-ddl](../postgresql-basic/04-lab-ddl.md) |

## Success criteria

- [ ] LSN changes after an INSERT
- [ ] `pg_switch_wal()` executed, files in pg_wal make sense
- [ ] You know the size of pg_wal on the environment
- [ ] You have notes about archive for production

## Next

Streaming replication: [05-streaming-replication.md](05-streaming-replication.md).
