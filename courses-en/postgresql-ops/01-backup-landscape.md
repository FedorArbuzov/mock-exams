# 01. Backup landscape

## Scenario from work

Friday, 5:00 PM. "We do have a nightly pg_dump" — and at 2:03 PM a DBA accidentally runs `DROP SCHEMA app CASCADE`. You need the state as of **2:02 PM**. The 3:00 AM dump is useless. Meanwhile compliance asks: "where are the off-site copies and what's the RPO?" The Ops course starts with a **backup map**: logical vs physical, RPO/RTO, choosing a tool.

**Prerequisites:** [intermediate/09-pitr](../postgresql-intermediate/09-pitr.md), [basic/13-backup-pgdump](../postgresql-basic/13-backup-pgdump.md).

## What you'll learn

- Logical vs physical backup
- pgBackRest, Barman, WAL-G, RDS snapshots
- RPO and RTO in business terms
- When to use what

## Logical vs physical

| Type | Tools | RPO | Recovery |
|-----|-------------|-----|----------------|
| **Logical** | `pg_dump`, `pg_dumpall` | The moment the dump finished | `pg_restore` / psql — flexible per schema |
| **Physical** | base backup + WAL archive | Seconds–minutes (continuous WAL) | PITR, faster at TB scale |

```text
Logical:  SQL/ custom dump → portability, cross-major (with caveats)
Physical: PGDATA pages + WAL chain → disaster recovery, PITR
```

**pg_dump does not replace PITR:** it's a point-in-time snapshot from when the dump ran, not an arbitrary second.

## Tools

| Tool | Strengths | Typical environment |
|------------|-----------------|----------------|
| **pgBackRest** | Parallel backup/restore, stanza, full/diff/incr, S3, verify | Self-hosted prod |
| **Barman** | Python, WAL hook, retention policies | Enterprise, Postgres shops |
| **WAL-G** | Cloud-native WAL push, MinIO/S3, lightweight | K8s, cloud |
| **RDS/Aurora snapshots** | Managed, automated | AWS ([aws-intermediate](../aws-intermediate/README.md)) |
| **pg_basebackup** | Built-in, foundation for a replica | Manual DR, replication |

Often **both**: nightly `pg_dump` of the schema for portability + **physical PITR** for DR.

## RPO and RTO

| Metric | Question | Example |
|---------|--------|--------|
| **RPO** (Recovery Point Objective) | How much data can we lose? | WAL archive every minute → RPO ~1 min |
| **RTO** (Recovery Time Objective) | How fast can we bring the service back? | Restore 30 min + replay 20 min |

| Strategy | Typical RPO |
|-----------|--------------|
| Daily pg_dump | Up to 24h |
| Physical + continuous archive | Minutes |
| Sync replica + failover | ~0 writes |

## Where to store backups

- **Off-site** — a different region/AZ, not the same SAN as PGDATA.
- **Immutable** — S3 Object Lock, WORM (ransomware).
- **Encryption** — at rest (SSE-KMS).
- **Access** — separate IAM/credentials, not the app role.

## When to use what

| Environment | Recommendation |
|-------|--------------|
| Dev/test | `pg_dump -Fc` is enough |
| Prod OLTP | Physical + PITR + quarterly restore drill |
| Cross-region DR | Replica + object storage backups |
| Major upgrade | Logical replication or blue/green ([06-blue-green](06-blue-green.md)) |
| Compliance audit | Retention policy + documented drills |

## Common mistakes

1. Only pg_dump on 2 TB — RPO of 24h, restore takes days.
2. Backup on the same disk as PGDATA — a fire means losing everything.
3. Never tested restore — "we have a backup" ≠ "recovery works".
4. Confusing a VM snapshot with a consistent DB backup without WAL.

## Checklist

- [ ] Why pg_dump ≠ PITR
- [ ] The role of WAL in physical backup
- [ ] Off-site and encryption
- [ ] RPO/RTO for your shop API
- [ ] Restore drill on the calendar

## Next

pgBackRest: [02-pgbackrest.md](02-pgbackrest.md).
