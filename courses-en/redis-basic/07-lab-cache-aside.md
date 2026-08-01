# 07. Lab: cache-aside by hand

## Lab goal

Model **cache-aside** for a "product": miss → write from the "DB" (a fake JSON) → hit. Add a **TTL with jitter** and **invalidation** via `DEL`. Optionally — a **lock** against stampede.

## Prerequisites

- [06. Caching patterns](06-patterns-cache.md).
- Prefix: **`lab:cache:`**

The "database" in this lab is a string that you set by hand.

---

## Task 1. Miss

```bash
docker exec mock-redis redis-cli GET lab:cache:product:101
```

**What you'll see:** `(nil)`.

---

## Task 2. Load from the "DB" and SET

**Why:** only on a miss do we write to Redis.

```bash
docker exec mock-redis redis-cli SET lab:cache:product:101 \
  '{"sku":"101","name":"Redis Handbook","priceCents":2900}' \
  EX 300
```

Check the hit:

```bash
docker exec mock-redis redis-cli GET lab:cache:product:101
docker exec mock-redis redis-cli TTL lab:cache:product:101
```

**What you'll see:** the JSON and a TTL ≤ 300.

---

## Task 3. Key version

**Why:** a schema change without a conflict.

```bash
docker exec mock-redis redis-cli SET lab:cache:product:v2:101 \
  '{"sku":"101","name":"Redis Handbook","priceCents":2500,"v":2}' \
  EX 320
docker exec mock-redis redis-cli GET lab:cache:product:101
docker exec mock-redis redis-cli GET lab:cache:product:v2:101
```

**What you'll see:** the old and new versions coexist until the TTL.

---

## Task 4. Invalidation on an "update in the admin panel"

```bash
docker exec mock-redis redis-cli DEL lab:cache:product:101 lab:cache:product:v2:101
docker exec mock-redis redis-cli EXISTS lab:cache:product:v2:101
```

**What you'll see:** `(integer) 0`.

Recreate the cache with a new price `1990`:

```bash
docker exec mock-redis redis-cli SET lab:cache:product:v2:101 \
  '{"sku":"101","priceCents":1990,"v":2}' EX 300
```

---

## Task 5. Lock on a miss (optional)

**Why:** a single "winner" builds the cache.

```bash
docker exec mock-redis redis-cli DEL lab:cache:product:202 lab:cache:lock:product:202
docker exec mock-redis redis-cli SET lab:cache:lock:product:202 1 NX EX 10
docker exec mock-redis redis-cli SET lab:cache:lock:product:202 1 NX EX 10
```

**What you'll see:** the first `OK`, the second `(nil)`.

The winner stores the data and releases the lock:

```bash
docker exec mock-redis redis-cli SET lab:cache:product:202 '{"sku":"202"}' EX 300
docker exec mock-redis redis-cli DEL lab:cache:lock:product:202
```

---

## Task 6. Hit/miss statistics

```bash
docker exec mock-redis redis-cli INFO stats | grep keyspace
```

**What you'll see:** `keyspace_hits` and `keyspace_misses` (they grow as the stand is used).

---

## Task 7. Cleanup

```bash
docker exec mock-redis redis-cli DEL lab:cache:product:101 lab:cache:product:v2:101 lab:cache:product:202 lab:cache:lock:product:202
```

---

## Success criteria

- [ ] A miss and a subsequent hit demonstrated
- [ ] A TTL set on the cache key
- [ ] `DEL` as invalidation before an update
- [ ] (opt.) `SET NX` lock — only one OK
- [ ] `keyspace_hits` / `keyspace_misses` reviewed

## What to take to work

- A key with a **version** (`v2`) simplifies rollout.
- **Invalidation** = `DEL`, not just waiting for the TTL.
- A lock is the simplest protection against stampede on a hot key.

Next lesson: [08. Pub/Sub](08-pubsub.md).
