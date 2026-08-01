# 18. Lab: backup and restore RDB

## Lab goal

Take a **consistent** `dump.rdb` backup from a running instance and restore data via [`examples/backup-restore.sh`](examples/backup-restore.sh) or manually.

## Prerequisites

```bash
cd deploy/redis
docker compose up -d
chmod +x ../../courses/redis-intermediate/examples/backup-restore.sh
```

---

## Task 1. Data for the backup

```bash
docker exec mock-redis redis-cli SET lab:backup:user:1 "alice"
docker exec mock-redis redis-cli SET lab:backup:user:2 "bob"
docker exec mock-redis redis-cli DBSIZE
```

---

## Task 2. BGSAVE and copying RDB

```bash
docker exec mock-redis redis-cli BGSAVE
until docker exec mock-redis redis-cli INFO persistence | grep -q 'rdb_bgsave_in_progress:0'; do sleep 1; done
docker exec mock-redis redis-cli LASTSAVE

mkdir -p /tmp/redis-backup-lab
docker cp mock-redis:/data/dump.rdb /tmp/redis-backup-lab/dump-lab.rdb
ls -la /tmp/redis-backup-lab/
```

**What you'll see:** a non-zero `dump-lab.rdb` file.

---

## Task 3. Backup script (from the repository)

From the repository root:

```bash
./courses/redis-intermediate/examples/backup-restore.sh backup ./tmp-redis-backup
ls -la ./tmp-redis-backup/
```

---

## Task 4. Simulate data loss

```bash
docker exec mock-redis redis-cli FLUSHDB
docker exec mock-redis redis-cli GET lab:backup:user:1
```

**What you'll see:** `(nil)`.

---

## Task 5. Restore

```bash
./courses/redis-intermediate/examples/backup-restore.sh restore ./tmp-redis-backup/dump-*.rdb
# or a specific file:
# ./courses/redis-intermediate/examples/backup-restore.sh restore /tmp/redis-backup-lab/dump-lab.rdb
```

Manual option:

```bash
docker cp /tmp/redis-backup-lab/dump-lab.rdb mock-redis:/data/dump.rdb
docker restart mock-redis
until docker exec mock-redis redis-cli PING | grep -q PONG; do sleep 1; done
docker exec mock-redis redis-cli GET lab:backup:user:1
```

**What you'll see:** `alice`.

---

## Task 6. AOF (observation)

```bash
docker exec mock-redis redis-cli INFO persistence | grep aof
docker exec mock-redis ls -la /data/
```

Understanding: with AOF enabled, recovery may use both AOF and RDB — see [01-persistence](01-persistence.md).

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | BGSAVE finished without error |
| 2 | `dump.rdb` copied to the host |
| 3 | After FLUSHDB data is gone |
| 4 | After restore keys are restored |
| 5 | You know when an off-host backup (S3) is needed |

## In production

- Automatic ElastiCache snapshots / cron BGSAVE + upload to S3.
- Test restore **quarterly**.
- Encrypt backups at rest.

Next lesson: [19. ElastiCache](19-managed-elasticache.md).
