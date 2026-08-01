# 02. Lab: RDB and AOF on the single stand

## Lab goal

On a live instance from [`deploy/redis`](../../deploy/redis/README.md) (`docker compose up -d`) you will see how a **write hits disk**, how to read `INFO persistence`, and what happens on **restart** with a volume.

## Prerequisites

- Docker is running.
- Port `6379` is free (stop the replication/sentinel compose if you started them).

```bash
cd deploy/redis
docker compose down
docker compose up -d
docker compose ps
```

`mock-redis` is **healthy**.

---

## Task 1. Baseline

**Why:** capture state before experiments.

```bash
docker exec mock-redis redis-cli INFO persistence | egrep 'aof_|rdb_|loading'
docker exec mock-redis redis-cli CONFIG GET save
docker exec mock-redis redis-cli CONFIG GET appendonly
```

**What you'll see:** `aof_enabled:1`, `appendfsync` via `CONFIG GET appendfsync`, `save` with a rule like `60 1000`.

---

## Task 2. Write and BGSAVE

**Why:** create data and get an RDB manually.

```bash
docker exec mock-redis redis-cli SET lab:persist:key1 "value-$(date +%s)"
docker exec mock-redis redis-cli DBSIZE
docker exec mock-redis redis-cli BGSAVE
```

Wait for completion:

```bash
docker exec mock-redis redis-cli INFO persistence | grep rdb_bgsave_in_progress
```

When `rdb_bgsave_in_progress:0`:

```bash
docker exec mock-redis redis-cli LASTSAVE
docker exec mock-redis redis-cli CONFIG GET dir
```

**What you'll see:** UNIX timestamp from `LASTSAVE`, directory `/data` (in the volume).

File check:

```bash
docker exec mock-redis ls -la /data
```

Expect `dump.rdb` and, with AOF enabled — `appendonly.aof`.

---

## Task 3. AOF in action

**Why:** confirm mutating commands land in the journal.

```bash
docker exec mock-redis redis-cli SET lab:persist:key2 incremental
docker exec mock-redis redis-cli INCR lab:persist:counter
ls -la deploy/redis  # on the host the volume isn't visible — look in the container:
docker exec mock-redis ls -la /data/appendonly.aof 2>/dev/null || \
  docker exec mock-redis ls -la /data
```

Optionally — rewrite stats:

```bash
docker exec mock-redis redis-cli INFO persistence | grep aof_
```

---

## Task 4. Restart and verify data

**Why:** the main persistence criterion — data after restart.

```bash
docker restart mock-redis
until docker exec mock-redis redis-cli PING | grep -q PONG; do sleep 1; done
docker exec mock-redis redis-cli GET lab:persist:key1
docker exec mock-redis redis-cli GET lab:persist:counter
```

**What you'll see:** values still there.

If keys are missing — check the volume in `docker compose.yml` and that you didn't run `docker compose down -v`.

---

## Task 5. (Optional) RDB loss window

**Why:** feel the trade-off of **RDB only** (not required on a stand copy).

For understanding only — **do not** leave this in prod:

```bash
docker exec mock-redis redis-cli CONFIG SET save ""
docker exec mock-redis redis-cli CONFIG SET appendonly no
# write a key, kill the container before BGSAVE — the key may disappear
```

Restore settings from `redis-single.conf` with a restart:

```bash
docker compose restart redis
```

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | `INFO persistence` shows AOF enabled |
| 2 | After `BGSAVE` — `rdb_bgsave_in_progress:0` |
| 3 | `/data` has `dump.rdb` |
| 4 | After `docker restart mock-redis` keys `lab:persist:*` are readable |
| 5 | You can explain the RDB vs AOF difference in your own words |

## Takeaways for work

- For a **cache**, persistence is often off; for a **queue/sessions** — AOF or managed backup.
- Operator check: `INFO persistence`, disk space, success of the last BGSAVE.

Next lesson: [03. Replication](03-replication.md).
