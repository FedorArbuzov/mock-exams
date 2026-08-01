# 15. Patterns: Redlock, rate limit, idempotency

## Intro: “we added Redlock — got double charges”

The team wrapped a payment in Redlock across 5 Redis nodes. With a **GC pause** of 40 ms and **clock skew**, two API instances both “held” the lock — double charge. Distributed locks are **harder** than they look; for cache refresh, `SET NX EX` is enough.

## What you'll learn

- **Distributed lock**: SET NX, Redlock, alternatives.
- **Rate limiting** (fixed, sliding, token bucket in Redis).
- **Idempotency keys** for APIs.
- When Redis **should not** be the lock service.

---

## Lock on a single instance

```bash
SET resource:lock:42 <token> NX EX 30
```

Unlock **only if the token matches** (Lua):

```lua
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
```

| Risk | Mitigation |
|------|------------|
| TTL expired, work continues | Fencing token in DB |
| Process died, lock stuck | TTL |
| Non-atomic unlock | Lua compare-and-del |

---

## Redlock (Antirez)

Algorithm on **N** independent masters (usually 5), quorum `N/2+1`, random TTL.

**Martin Kleppmann critique:**

- No **fencing** — a stale lock holder can still write to the DB.
- Depends on **synchronized clocks** and GC pauses.
- “Independent” nodes on one hypervisor — an illusion.

**In the interview:** know Redlock, but propose **PostgreSQL advisory lock**, **etcd/Consul**, **SQS visibility** for the critical path.

---

## Rate limiting

### Fixed window

```bash
INCR ratelimit:{ip}:2025051814
EXPIRE ratelimit:{ip}:2025051814 60
```

Problem: burst at the minute boundary.

### Sliding window (ZSET)

```text
ZADD key now now
ZREMRANGEBYSCORE key -inf now-60
ZCARD key
```

### Token bucket (Lua)

Atomically refill and take tokens — more precise, more complex in code.

**Hot key:** `ratelimit:global` → sharded `ratelimit:{ip % 32}`.

---

## Idempotency

```text
SET idempotency:{paymentId} processing NX EX 86400
```

After success — `SET ... completed` with result body hash. Repeat POST with the same key → return the saved response.

---

## Tool choice

| Task | Redis pattern |
|--------|----------------|
| Cache refresh mutex | SET NX on **one** cache Redis |
| Payment idempotency | DB unique + idempotency key table |
| Global leader election | Consul / k8s lease |
| Rate limit API | Redis counter / Gateway |

---

## Summary

1. **SET NX EX + token + Lua unlock** — baseline.
2. **Redlock** — know it, evaluate critically.
3. Rate limit — watch **hot key** and atomicity.

**Next:** [16. Valkey](16-valkey-stack.md).
