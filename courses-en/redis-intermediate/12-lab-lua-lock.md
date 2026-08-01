# 12. Lab: distributed lock with Lua

## Lab goal

Implement lock **acquire** and **release** via Lua on the single stand; confirm a second client cannot release someone else's lock.

## Prerequisites

`docker compose up -d` in `deploy/redis`.

---

## Task 1. Acquire script

Save to a variable or `acquire.lua` file:

```lua
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'EX', tonumber(ARGV[2])) then
  return 1
end
return 0
```

```bash
ACQUIRE='if redis.call("SET", KEYS[1], ARGV[1], "NX", "EX", tonumber(ARGV[2])) then return 1 end return 0'
docker exec mock-redis redis-cli DEL lab:lock:resource
docker exec mock-redis redis-cli EVAL "$ACQUIRE" 1 lab:lock:resource worker-a 30
```

**What you'll see:** `(integer) 1`.

Retry from worker-b:

```bash
docker exec mock-redis redis-cli EVAL "$ACQUIRE" 1 lab:lock:resource worker-b 30
```

**What you'll see:** `(integer) 0`.

---

## Task 2. Release script (compare-and-del)

```lua
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
```

```bash
RELEASE='if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) end return 0'
docker exec mock-redis redis-cli EVAL "$RELEASE" 1 lab:lock:resource worker-b
docker exec mock-redis redis-cli EVAL "$RELEASE" 1 lab:lock:resource worker-a
docker exec mock-redis redis-cli EXISTS lab:lock:resource
```

**What you'll see:** first release — `0`, second — `1`, key deleted.

---

## Task 3. TTL and a "dead" worker

```bash
docker exec mock-redis redis-cli EVAL "$ACQUIRE" 1 lab:lock:resource worker-crash 5
docker exec mock-redis redis-cli TTL lab:lock:resource
sleep 6
docker exec mock-redis redis-cli EVAL "$ACQUIRE" 1 lab:lock:resource worker-b 30
```

**What you'll see:** after TTL expires, worker-b acquires the lock again.

---

## Task 4. SCRIPT LOAD

```bash
SHA=$(docker exec mock-redis redis-cli SCRIPT LOAD "$ACQUIRE" | tr -d '\r')
docker exec mock-redis redis-cli DEL lab:lock:resource
docker exec mock-redis redis-cli EVALSHA "$SHA" 1 lab:lock:resource w1 10
```

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | Only one acquire returns 1 |
| 2 | A foreign release does not delete the key |
| 3 | After TTL the lock can be acquired again |
| 4 | `EVALSHA` works after `SCRIPT LOAD` |

## Takeaways for work

- Always put a **TTL** on the lock.
- Release the lock only with **token verification**.
- For financial transactions — a stronger coordinator than a Redis lock.

Next lesson: [13. Reliability](13-reliability.md).
