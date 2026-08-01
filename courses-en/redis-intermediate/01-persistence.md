# 01. Persistence: RDB and AOF

## Intro: "Redis was restarted — half the carts disappeared"

Friday, deploying a new API version. The Redis container got `docker compose restart` without a volume — and **all sessions and carts** vanished. The team argues: "Redis is a database." No: by default Redis is an **in-memory** store; data survives a restart only if **persistence** (RDB and/or AOF) is enabled and a volume with `/data` is mounted.

At intermediate you choose the mode deliberately: a snapshot every N minutes, a journal of every write, or a hybrid — and you understand the cost in disk and recovery time.

## What you'll learn

- How **RDB** differs from **AOF**.
- The `save`, `appendonly`, `appendfsync` parameters.
- How to read `INFO persistence`.
- Trade-offs: data loss vs latency vs file size.

## RDB — memory snapshot

**RDB** is a binary dump of the entire database at a point in time (`dump.rdb`).

| Parameter | Meaning |
|----------|--------|
| `save 60 1000` | BGSAVE if there were ≥1000 changes in 60 s |
| `stop-writes-on-bgsave-error yes` | don't write if the snapshot failed |
| `rdbcompression yes` | compression (less disk, a bit of CPU) |

The **BGSAVE** process: fork → child writes to disk → parent serves requests. On large instances, fork can cause a brief **latency spike** (copy-on-write).

**RDB pros:** compact file, fast cold start, convenient for backups.

**Cons:** between snapshots you may **lose** the latest writes (window = `save` interval + load).

## AOF — command journal

**AOF** appends every mutating command to `appendonly.aof`.

| `appendfsync` | Behavior | Risk |
|---------------|-----------|------|
| `always` | fsync after every write | minimal loss, high latency |
| `everysec` | fsync once a second | up to ~1 s loss on OS crash |
| `no` | OS flushes the buffer itself | faster, higher risk |

Periodically Redis does an AOF **rewrite** (compact "snapshot-like" form of commands) — `auto-aof-rewrite-percentage`, `auto-aof-rewrite-min-size`.

**AOF pros:** smaller loss window with `everysec`; clear audit trail.

**Cons:** larger file; recovery slower than RDB on huge databases.

## Hybrid (Redis 7+)

You can keep **both**: RDB for fast start + AOF for recent writes. On the single training stand, AOF is enabled:

[`deploy/redis/config/redis-single.conf`](../../deploy/redis/config/redis-single.conf):

```text
appendonly yes
appendfsync everysec
save 60 1000
```

## On the stand (single)

```bash
cd deploy/redis
docker compose up -d
docker exec mock-redis redis-cli INFO persistence
```

Pay attention to:

- `aof_enabled`, `aof_last_rewrite_time_sec`
- `rdb_last_save_time`, `rdb_bgsave_in_progress`
- `loading` — whether loading from disk is in progress at startup

Forced snapshot:

```bash
docker exec mock-redis redis-cli BGSAVE
docker exec mock-redis redis-cli LASTSAVE
```

## Common mistakes

| Symptom | Cause | Solution |
|---------|---------|---------|
| Empty after restart | no volume / `appendonly no` | volume + AOF or RDB |
| Disk 100%, Redis read-only | AOF grew, no rewrite | disk space, `BGREWRITEAOF` |
| Lags every N minutes | `save` on a huge DB | rarer `save`, AOF only, more RAM |
| "Backup" via `KEYS *` | not a snapshot, blocks | `BGSAVE`, copy `dump.rdb` |
| AOF corrupted after crash | partial write | `redis-check-aof`, repair |

## In production

- **Cache** without persistence is fine (data is rebuilt from the primary DB).
- **Queue / sessions** — AOF `everysec` or managed with Multi-AZ.
- Backups: copy RDB **after** a successful BGSAVE to S3 (lab 18).
- Test **restore** on a stand quarterly — the file may not open.

## Summary

RDB — periodic snapshot, fast restart. AOF — command journal, less loss between snapshots. The training single stand uses **AOF everysec + save 60 1000** — a reasonable compromise for labs.

## Checklist

- What happens to data on `kill -9` redis 30 s after a write with only RDB `save 300 1`?
- How does `BGSAVE` differ from `SAVE`?
- Which `appendfsync` would you choose for user sessions?
- Where on disk is `dump.rdb`? (`CONFIG GET dir`)

Next lesson: [02. Lab: RDB/AOF](02-lab-rdb-aof.md).
