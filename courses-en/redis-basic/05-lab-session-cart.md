# 05. Lab: session (HASH) and cart (SET)

## Lab goal

Model a **user session** in a HASH following [`session.json`](examples/session.json) and a **cart** as a SET of SKUs with a TTL. Verify partial field updates and the idempotency of `SADD`.

## Prerequisites

- The stand is up (`deploy/redis`, `mock-redis` healthy).
- You've read [04. Data types](04-data-types.md).
- Prefix: **`lab:cart:`**

---

## Task 1. Create a session

**Why:** a hash stores fields without rewriting the whole object.

Take a `sessionId` and fields from the example (or your own):

```bash
docker exec mock-redis redis-cli HSET lab:cart:session:sess-demo \
  userId "user-881" \
  email "learner@example.com" \
  locale "ru-RU" \
  roles "student"

docker exec mock-redis redis-cli EXPIRE lab:cart:session:sess-demo 1800
docker exec mock-redis redis-cli TTL lab:cart:session:sess-demo
```

**What you'll see:** `(integer) 4` fields, TTL about 1800.

```bash
docker exec mock-redis redis-cli HGET lab:cart:session:sess-demo locale
docker exec mock-redis redis-cli HMGET lab:cart:session:sess-demo userId email
```

---

## Task 2. Update lastSeen without a full rewrite

**Why:** the typical "the user performed an action" request.

```bash
docker exec mock-redis redis-cli HSET lab:cart:session:sess-demo lastSeenAt "2026-05-18T15:00:00Z"
docker exec mock-redis redis-cli HGETALL lab:cart:session:sess-demo
```

**What you'll see:** all the fields, including the new `lastSeenAt`.

Extend the session TTL on activity:

```bash
docker exec mock-redis redis-cli EXPIRE lab:cart:session:sess-demo 1800
```

---

## Task 3. Cart as a SET

**Why:** unique SKUs; a repeated `SADD` does not duplicate.

```bash
docker exec mock-redis redis-cli SADD lab:cart:basket:user-881 BOOK-KAFKA-101 BOOK-REDIS-101
docker exec mock-redis redis-cli SADD lab:cart:basket:user-881 BOOK-KAFKA-101
docker exec mock-redis redis-cli SCARD lab:cart:basket:user-881
docker exec mock-redis redis-cli SMEMBERS lab:cart:basket:user-881
```

**What you'll see:** `SCARD` = 2.

```bash
docker exec mock-redis redis-cli EXPIRE lab:cart:basket:user-881 86400
```

---

## Task 4. Remove an item and verify

```bash
docker exec mock-redis redis-cli SREM lab:cart:basket:user-881 BOOK-REDIS-101
docker exec mock-redis redis-cli SISMEMBER lab:cart:basket:user-881 BOOK-REDIS-101
docker exec mock-redis redis-cli SMEMBERS lab:cart:basket:user-881
```

**What you'll see:** `(integer) 0` for `SISMEMBER`, one SKU remaining.

---

## Task 5. Linking a session to a user (optional)

**Why:** find `userId` by `sessionId` — a reverse index.

```bash
docker exec mock-redis redis-cli SET lab:cart:session-index:sess-demo user-881 EX 1800
docker exec mock-redis redis-cli GET lab:cart:session-index:sess-demo
```

In the application the index is updated together with creating the session.

---

## Task 6. Check in Redis Commander

[http://localhost:8081](http://localhost:8081) — the `lab:cart:*` keys, types hash/set/string.

---

## Task 7. Cleanup

```bash
docker exec mock-redis redis-cli DEL lab:cart:session:sess-demo lab:cart:basket:user-881 lab:cart:session-index:sess-demo
```

---

## Success criteria

- [ ] Session HASH with ≥4 fields and a TTL of 1800 s
- [ ] `HSET` of a single field does not overwrite the rest
- [ ] Cart SET: 2 unique SKUs after a double `SADD` of the same SKU
- [ ] `SREM` removes the item
- [ ] (opt.) session → userId index

## What to take to work

- Session → **HASH** + **EXPIRE** on every request (sliding session).
- Cart → **SET** or a HASH with qty (if you need quantity — a hash field `qty:SKU`).
- The sample JSON is in the repository; in Redis it's hash fields.

Next lesson: [06. Caching patterns](06-patterns-cache.md).
