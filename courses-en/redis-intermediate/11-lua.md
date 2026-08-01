# 11. Lua in Redis

## Intro: "two INCRs — and the API limit was breached"

Rate limit: `GET` the limit, in the app `if count < 10`, then `INCR`. Between coroutines both passed the check — the **11th** request slipped through. You need **atomicity**: check + change in one round-trip.

**Lua scripting** in Redis runs a script **atomically** (nothing interleaves between commands in the script).

## What you'll learn

- `EVAL` / `EVALSHA` and `SCRIPT LOAD`.
- Limits: one event loop, the script must be fast.
- Patterns: rate limit, compare-and-set, **distributed lock** (carefully).
- Why Redlock is controversial and what to use instead.

## Basic syntax

```bash
EVAL "return redis.call('GET', KEYS[1])" 1 mykey
```

| Argument | Meaning |
|----------|--------|
| script | Lua 5.1 |
| numkeys | how many of the following are KEYS |
| KEYS[1] | first key |
| ARGV[1] | argument |

`redis.call()` — an error aborts the script; `redis.pcall()` — like a command that returns an error reply.

## Atomic INCR with a limit

```lua
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
if current >= tonumber(ARGV[1]) then
  return 0
end
return redis.call('INCR', KEYS[1])
```

```bash
EVAL "<script>" 1 ratelimit:user:42 10
```

## Distributed lock (training pattern)

Classic (simplified, **not** full Redlock):

```lua
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'EX', ARGV[2]) then
  return 1
end
return 0
```

- `KEYS[1]` — `lock:resource`
- `ARGV[1]` — unique token (worker UUID)
- `ARGV[2]` — TTL in seconds

Release the lock only if the token matches (second Lua — lab 12).

**In prod:** for strict coordination more often **PostgreSQL advisory lock**, **etcd**, or a broker; a Redis lock is fine for **best-effort** (cache rebuild), not for money.

## Limits

| Rule | Reason |
|---------|---------|
| Keep the script short | blocks Redis single-thread |
| No long loops | latency for everyone |
| Determinism | replication: same effect |
| Keys in one slot | for Cluster — all KEYS in one slot |

## On the stand

```bash
docker exec mock-redis redis-cli EVAL "return 1+1" 0
docker exec mock-redis redis-cli SCRIPT LOAD "return redis.call('PING')"
```

## Common mistakes

| Symptom | Cause | Solution |
|---------|---------|---------|
| `NOSCRIPT` | cache cleared | `EVAL` or `SCRIPT LOAD` |
| Hang | infinite loop in Lua | iteration limit, review |
| Lock never released | no TTL | always `EX` |
| Two lock owners | SET NX only, no verify | compare-del in Lua |
| `CROSSSLOT` | keys in Cluster | hash tag `{id}` |

## In production

- Keep scripts in the repo, version the SHA.
- Metric: `slowlog` on `EVAL`.
- ACL: separate user with `+eval` only for needed keys.

## Summary

Lua gives atomicity without MULTI/EXEC for branching logic. Lock via `SET NX EX` + verify token — the basic pattern for lab 12.

## Checklist

- Why are two separate `redis-cli` calls not atomic?
- Why a token in the lock value?
- Why does a lock need a TTL?
- When is Lua overkill?

Next lesson: [12. Lab: lock](12-lab-lua-lock.md).
