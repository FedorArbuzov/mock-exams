# 15. Lab: heavy keys, SCAN and SLOWLOG

## Lab goal

Create a **large hash**, measure **MEMORY USAGE**, land in **SLOWLOG** via `HGETALL`, find the key with **SCAN** and delete it safely. Reinforce [14. CLI](14-cli-observability.md).

## Prerequisites

- The stand is healthy.
- Prefix: **`lab:heavy:`**

---

## Task 1. Create a "heavy" hash

**Why:** simulating a bad design (thousands of fields in a single key).

```bash
for i in $(seq 1 2000); do
  docker exec mock-redis redis-cli HSET "lab:heavy:profile" "field:$i" "value-$i" >/dev/null
done
docker exec mock-redis redis-cli HLEN lab:heavy:profile
```

**What you'll see:** `(integer) 2000`.

---

## Task 2. MEMORY USAGE

```bash
docker exec mock-redis redis-cli MEMORY USAGE lab:heavy:profile
docker exec mock-redis redis-cli INFO memory | grep used_memory_human
```

**What you'll see:** a number of bytes (tens/hundreds of KB depending on the version).

---

## Task 3. HGETALL and SLOWLOG

```bash
docker exec mock-redis redis-cli SLOWLOG RESET
docker exec mock-redis redis-cli HGETALL lab:heavy:profile | wc -l
docker exec mock-redis redis-cli SLOWLOG GET 5
```

**What you'll see:** `HGETALL` may appear in the slowlog (if it takes longer than the 10ms threshold).

**Lesson:** in prod — `HSCAN lab:heavy:profile 0 COUNT 50`.

---

## Task 4. SCAN by prefix

```bash
docker exec mock-redis redis-cli SCAN 0 MATCH 'lab:heavy:*' COUNT 50
```

**What you'll see:** a cursor and a list of keys (possibly `lab:heavy:profile`).

Create a second key:

```bash
docker exec mock-redis redis-cli SET lab:heavy:flag 1
docker exec mock-redis redis-cli SCAN 0 MATCH 'lab:heavy:*' COUNT 50
```

---

## Task 5. HSCAN instead of HGETALL

```bash
docker exec mock-redis redis-cli HSCAN lab:heavy:profile 0 COUNT 10
```

**What you'll see:** a cursor and a portion of fields — the pagination model.

---

## Task 6. Redis Commander

[http://localhost:8081](http://localhost:8081) — the key size, type hash.

---

## Task 7. Cleanup

```bash
docker exec mock-redis redis-cli DEL lab:heavy:profile lab:heavy:flag
docker exec mock-redis redis-cli SLOWLOG RESET
```

---

## Success criteria

- [ ] A hash with 2000 fields created
- [ ] `MEMORY USAGE` run
- [ ] SLOWLOG reviewed after a heavy command
- [ ] SCAN found keys by `lab:heavy:*`
- [ ] HSCAN demonstrated
- [ ] Keys deleted

## What to take to work

- A field/size limit per key in code review.
- O(N) operations — only via SCAN/HSCAN with COUNT.
- In an incident: slowlog → MEMORY USAGE → refactor the structure.

Next lesson: [16. Redis vs Memcached vs Kafka](16-vs-memcached-kafka.md).
