# 03. Lab: first keys, TTL and types

## Lab goal

Bring up the Redis stand, run **SET/GET/DEL**, set a **TTL**, check **TYPE** and **EXISTS**. Note the difference between connecting from the host (`localhost:6379`) and the CLI inside **`mock-redis`**.

## Prerequisites

- Docker running, port **6379** free.
- From the repository root:

```bash
cd deploy/redis
docker compose up -d
docker compose ps
```

The `mock-redis` container is in **healthy** status (wait 10–30 s). Details: [`deploy/redis/README.md`](../../deploy/redis/README.md).

Optional smoke test:

```bash
bash scripts/smoke.sh
```

Key prefix in this lab: **`lab:basic:`** — so you don't interfere with others.

---

## Task 1. Ping and INFO

**Why:** make sure the CLI reached the instance.

```bash
docker exec mock-redis redis-cli ping
docker exec mock-redis redis-cli INFO server | grep redis_version
```

**What you'll see:** `PONG` and the line `redis_version:7.2...`.

**If Connection refused:** `docker compose logs redis`, wait for the healthcheck.

---

## Task 2. SET, GET, DEL

**Why:** the basic string cycle.

```bash
docker exec mock-redis redis-cli SET lab:basic:hello "Hello Redis"
docker exec mock-redis redis-cli GET lab:basic:hello
docker exec mock-redis redis-cli EXISTS lab:basic:hello
docker exec mock-redis redis-cli DEL lab:basic:hello
docker exec mock-redis redis-cli EXISTS lab:basic:hello
```

**What you'll see:** `OK`, `Hello Redis`, `(integer) 1`, `(integer) 1`, `(integer) 0`.

---

## Task 3. TTL and EXPIRE

**Why:** cache and sessions always have a limited time to live.

```bash
docker exec mock-redis redis-cli SET lab:basic:ttl "temp" EX 120
docker exec mock-redis redis-cli TTL lab:basic:ttl
```

Wait 5 s and again:

```bash
docker exec mock-redis redis-cli TTL lab:basic:ttl
```

**What you'll see:** the TTL decreasing (about 115 after the pause).

Extend the life:

```bash
docker exec mock-redis redis-cli EXPIRE lab:basic:ttl 300
docker exec mock-redis redis-cli TTL lab:basic:ttl
```

---

## Task 4. SET NX and a counter

**Why:** an idempotent "grab the slot" and an atomic INCR.

```bash
docker exec mock-redis redis-cli SET lab:basic:lock token1 NX EX 30
docker exec mock-redis redis-cli SET lab:basic:lock token2 NX EX 30
```

**What you'll see:** the first `OK`, the second `(nil)` — the key already exists.

```bash
docker exec mock-redis redis-cli INCR lab:basic:views
docker exec mock-redis redis-cli INCR lab:basic:views
docker exec mock-redis redis-cli GET lab:basic:views
```

**What you'll see:** `(integer) 2`.

---

## Task 5. TYPE and WRONGTYPE

**Why:** one key — one type.

```bash
docker exec mock-redis redis-cli SET lab:basic:mixed "str"
docker exec mock-redis redis-cli TYPE lab:basic:mixed
docker exec mock-redis redis-cli LPUSH lab:basic:mixed item
```

**What you'll see:** `string`, then the `WRONGTYPE` error.

Fix:

```bash
docker exec mock-redis redis-cli DEL lab:basic:mixed
docker exec mock-redis redis-cli LPUSH lab:basic:mixed item
docker exec mock-redis redis-cli TYPE lab:basic:mixed
```

**What you'll see:** `list`.

---

## Task 6. Redis Commander (optional)

Open [http://localhost:8081](http://localhost:8081) — find the `lab:basic:*` keys.

---

## Task 7. Cleanup (optional)

```bash
docker exec mock-redis redis-cli DEL lab:basic:ttl lab:basic:lock lab:basic:views lab:basic:mixed
```

Don't use `FLUSHALL` on a shared stand.

---

## Success criteria

- [ ] `mock-redis` healthy, `PING` → `PONG`
- [ ] SET/GET/DEL run without errors
- [ ] TTL decreases, `EXPIRE` updates the expiry
- [ ] `SET NX` returned `(nil)` the second time
- [ ] `INCR` produced a counter of 2
- [ ] You understand the `WRONGTYPE` error and how to fix it

## What to take to work

- In the course labs the CLI is: `docker exec mock-redis redis-cli …`
- From the host (applications): `localhost:6379`
- Always a **prefix** and a **TTL** for temporary data

Next lesson: [04. Data types](04-data-types.md).
