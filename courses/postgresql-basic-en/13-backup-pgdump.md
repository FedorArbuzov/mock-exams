# 13. Logical Backups with pg_dump

"Take a backup before release." A junior copies `PGDATA` from a running server. After restart, cluster cannot start due to inconsistent files. Another case: `pg_dump` plain SQL for 800 GB turns into one giant file and restore takes a day. Third case: trying to restore a dump into incompatible major version or missing extensions causes failures.

At basic level, you should master **logical backups**: portable schema/data snapshots with `pg_dump` and `pg_restore`.

In this chapter:

- Logical vs physical vs snapshot backups
- `pg_dump` formats (`-Fp`, `-Fc`, `-Fd`, `-Ft`)
- Schema-only/data-only dumps and schema filter (`-n`)
- `pg_restore` and parallel restore
- `pg_dumpall --globals-only` for roles/global objects
- Core limitations of logical dumps

## Backup Types

| Type | Tool | Restore | PITR |
|------|------|---------|------|
| Logical | `pg_dump` | `pg_restore` / `psql` | No |
| Physical | `pg_basebackup`, pgBackRest | recovery + WAL | Yes |
| Snapshot | EBS/LVM/ZFS snapshots | mount + recovery | depends on WAL strategy |

Logical backups are slower on huge datasets but very flexible for schema-scoped exports and migration workflows.

## pg_dump formats

| Format | Flag | Output | Notes |
|--------|------|--------|------|
| Plain SQL | `-Fp` (default) | `.sql` | restore via `psql -f`, no parallel restore |
| Custom | `-Fc` | `.dump` | compressed, object selection, good default |
| Directory | `-Fd` | folder | supports parallel dump/restore |
| Tar | `-Ft` | `.tar` | less common |

Recommended app-schema backup format: `-Fc`.

```bash
pg_dump -Fc -f course.dump "postgresql://course:course@localhost:5432/course"
pg_dump -n shop -Fc -f shop.dump "postgresql://course:course@localhost:5432/course"
```

## Schema-only / data-only

```bash
pg_dump --schema-only -n shop -Fc -f shop_schema.dump ...
pg_dump --data-only -n shop -Fc -f shop_data.dump ...
```

Useful for migration review or staged restore.

## pg_restore basics

```bash
createdb course_restored
pg_restore -d course_restored -j 4 course.dump
```

| Option | Meaning |
|--------|---------|
| `-d` | target DB |
| `-j N` | parallel jobs (custom/directory) |
| `-n shop` | restore only one schema |
| `--clean` | drop objects before create (use carefully) |
| `-l` | list dump contents |

Plain SQL restore:

```bash
pg_dump -Fp ... > dump.sql
psql -d course_restored -f dump.sql
```

## Roles and global objects

Single DB `pg_dump` does not include global roles/tablespaces.

```bash
pg_dumpall --globals-only > globals.sql
psql -f globals.sql -d postgres
```

If roles like `shop_reader`/`shop_writer` are missing after restore, globals were not restored.

## Logical backup limitations

| Limitation | Details |
|------------|---------|
| Runtime | proportional to DB size |
| PITR | not supported by logical dump alone |
| Version compatibility | usually restore to same/newer major only |
| Extensions | extension versions must be present on target |
| Huge DBs | physical backup + WAL often preferred |

Never copy hot `PGDATA` directly without proper physical-backup workflow.

## Practical strategy for shop app

1. Daily app-schema dump: `pg_dump -Fc -n shop`.
2. CI: schema-only snapshots for migration checks.
3. Globals: `pg_dumpall --globals-only` stored securely.
4. Production RPO/RTO: combine physical backups + PITR.

## Things people usually get wrong

1. Huge plain SQL dump as only backup artifact.
2. Restoring data but forgetting roles/privileges.
3. Restoring into non-clean DB without `--clean`.
4. Expecting PITR capability from `pg_dump` only.

## Before you move on

- [ ] I know when to use `-Fc` vs plain
- [ ] I understand `pg_dump` vs `pg_dumpall`
- [ ] I know logical backup is not PITR
- [ ] I can use parallel restore (`-j`)
- [ ] I know why copying hot PGDATA is unsafe

## What's next

Hands-on backup drill: [14-lab-backup.md](14-lab-backup.md).
