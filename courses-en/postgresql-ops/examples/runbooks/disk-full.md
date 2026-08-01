# Runbook: disk full (PGDATA or WAL)

## Symptoms

- `FATAL: could not write to file`
- Inserts fail, DB read-only or down

## Quick actions

1. Free up space **outside** PG (OS logs, tmp) — do not manually delete files in `pg_wal/`.
2. Check `df -h` on the PGDATA and WAL mounts.
3. If safe: `VACUUM` won't free disk space instantly — you need archive/cleanup.

```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
SELECT * FROM pg_ls_waldir() LIMIT 5;  -- superuser
```

4. Grow the volume (cloud) or extend LVM.
5. `archive_command` failing → WAL accumulates — fix the archive or temporarily raise `max_wal_size` (not a fix).

## Forbidden

- Deleting arbitrary files in `pg_wal/`
- `rm -rf` on PGDATA

## After stabilization

- Post-mortem: why retention/archive didn't work.
- Alert at 80% disk.
