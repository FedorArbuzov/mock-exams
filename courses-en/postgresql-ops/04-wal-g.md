# 04. WAL-G

## Scenario from work

A team on Kubernetes doesn't want a heavy pgBackRest agent on every node. They pick **WAL-G**: `wal-push` to S3/MinIO, `backup-push` at night, restore via `backup-fetch` + WAL replay. DevOps already knows S3 IAM — config via env vars.

WAL-G is a cloud-native companion for physical backup, especially on K8s and MinIO setups in mock-exams.

## What you'll learn

- backup-push vs wal-push
- Environment variables and MinIO
- PITR with WAL-G
- Comparison with pgBackRest

## The idea

```text
Primary PGDATA
    ├── wal-g wal-push     (each archived WAL segment)
    └── wal-g backup-push  (periodic base backup)
            ↓
        S3 / GCS / MinIO
            ↓
    wal-g backup-fetch + wal-fetch → restore / PITR
```

```bash
wal-g backup-push $PGDATA
wal-g backup-list
wal-g wal-push %p   # via archive_command
wal-g backup-fetch $PGDATA LATEST
```

## Environment variables

```bash
WALG_S3_PREFIX=s3://pg-backups/course
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_ENDPOINT=http://minio:9000          # MinIO
AWS_S3_FORCE_PATH_STYLE=true
PGDATA=/var/lib/postgresql/data
```

For MinIO on the lab environment: [`docker-compose.ops.yml`](../../deploy/postgres/docker-compose.ops.yml) — console :9001.

`archive_command`:

```bash
archive_command = 'wal-g wal-push %p'
```

## PITR

1. Stop Postgres, clear PGDATA (on a **test** host).
2. `wal-g backup-fetch $PGDATA LATEST` (or a specific backup).
3. Configure recovery: `restore_command = 'wal-g wal-fetch %f %p'`.
4. `recovery_target_time` in postgresql.conf + `recovery.signal`.
5. Start → replay → promote.

Details depend on the WAL-G version; check the docs when rolling it out.

## What gets pushed more often

| | Frequency | Volume |
|---|---------|-------|
| **WAL** | Each segment (16MB default) | Continuous |
| **Full backup** | Daily/weekly cron | Large, less often |

RPO is determined by the **WAL push**, not the full backup.

## vs pgBackRest

| | WAL-G | pgBackRest |
|---|-------|------------|
| Focus | Object storage WAL | Full enterprise backup suite |
| Config | Env vars | pgbackrest.conf |
| Verify | backup-list, manual drill | `verify`, rich info |
| Typically | Cloud/K8s | Bare metal, large DBA teams |

They can coexist: pgBackRest for primary, WAL-G in the DR region — rare, pick one.

## Secrets and test restore

- Credentials in Vault/External Secrets — not in compose in prod.
- **Restore drill** quarterly on an isolated instance — the only real check.
- Don't test `backup-fetch` on prod PGDATA.

## Common mistakes

1. `backup-push` without `wal-push` — no PITR between backups.
2. MinIO endpoint wrong — silent archive failures → disk full.
3. Same bucket for prod and dev without prefix isolation.
4. Forgot `archive_mode=on`.

## Checklist

- [ ] WAL push more often than full backup
- [ ] Where the S3 secrets live
- [ ] Test restore without prod
- [ ] MinIO endpoint for local
- [ ] RPO = WAL continuity

## Next

Lab: [05-lab-wal-g.md](05-lab-wal-g.md).
