# 13. Lab: maxmemory and eviction

## Lab goal

Observe **used_memory** growing and **eviction** triggering under the `allkeys-lru` policy on the stand. Compare a key **with a TTL** and **without a TTL**. Don't use `FLUSHALL`.

## Prerequisites

- [12. Memory and eviction](12-memory-eviction.md).
- A stand with `maxmemory 256mb` ([`redis-single.conf`](../../deploy/redis/config/redis-single.conf)).
- Prefix: **`lab:evict:`**

**Warning:** this lab creates a lot of data; run it on a local stand and clean up the keys at the end.

---

## Task 1. Baseline metrics

```bash
docker exec mock-redis redis-cli CONFIG GET maxmemory
docker exec mock-redis redis-cli CONFIG GET maxmemory-policy
docker exec mock-redis redis-cli INFO memory | grep -E 'used_memory_human|maxmemory|mem_fragmentation'
docker exec mock-redis redis-cli INFO stats | grep evicted_keys
```

**What you'll see:** policy `allkeys-lru`, a limit of ~256mb.

---

## Task 2. Filling without a TTL (careful)

**Why:** under `allkeys-lru` such keys are evicted too.

A bash script (reduce `COUNT` if the lab runs slowly):

```bash
for i in $(seq 1 500); do
  docker exec mock-redis redis-cli SET "lab:evict:bulk:$i" "$(printf '%01024d' 0)" >/dev/null
done
```

Check memory:

```bash
docker exec mock-redis redis-cli INFO memory | grep used_memory_human
docker exec mock-redis redis-cli DBSIZE
```

**What you'll see:** `used_memory` growing; as it approaches the limit — `evicted_keys` growing.

```bash
docker exec mock-redis redis-cli INFO stats | grep evicted_keys
```

---

## Task 3. A key with a TTL vs without a TTL

```bash
docker exec mock-redis redis-cli SET lab:evict:hot "important" EX 3600
docker exec mock-redis redis-cli SET lab:evict:cold "less-important"
```

Keep adding junk keys (another 200 loop iterations or a `--pipe` file with SET).

Check whether `hot` and `cold` still exist:

```bash
docker exec mock-redis redis-cli EXISTS lab:evict:hot lab:evict:cold
```

**What you'll see:** one or both could have been evicted — LRU is approximate, the order is not strictly guaranteed.

---

## Task 4. OOM on noeviction (optional, local only)

**Don't do this on a shared stand.**

Temporarily (until the container restarts):

```bash
docker exec mock-redis redis-cli CONFIG SET maxmemory-policy noeviction
```

With memory almost full, try:

```bash
docker exec mock-redis redis-cli SET lab:evict:oom-test "$(printf '%05000000d' 0)"
```

**What you'll see:** possibly `(error) OOM command not allowed`.

Restore the policy:

```bash
docker exec mock-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## Task 5. Cleanup

Delete only your own keys:

```bash
docker exec mock-redis redis-cli --scan --pattern 'lab:evict:*' | head -20
```

Batch delete (bash):

```bash
docker exec mock-redis redis-cli --scan --pattern 'lab:evict:*' \
  | xargs -r docker exec -i mock-redis redis-cli DEL
```

On Windows without `xargs` — delete the range manually or recreate the volume:

```bash
cd deploy/redis
docker compose down -v
docker compose up -d
```

---

## Success criteria

- [ ] `maxmemory` and `maxmemory-policy` read
- [ ] `used_memory` grew during the mass SET
- [ ] `evicted_keys` > 0 after filling (or explained why it's 0 at a small volume)
- [ ] Lab keys deleted, `FLUSHALL` not used

## What to take to work

- Cache instance: **TTL on everything** + `volatile-lru` or a separate Redis.
- An alert on growing **evicted_keys** and a falling hit rate in the DB.

Next lesson: [14. CLI and observability](14-cli-observability.md).
