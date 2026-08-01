# 10. Lab: OOM recovery

## Lab goal

Artificially fill Redis up to **`maxmemory`** with `noeviction`, see **OOM on write**, then recover the service by **changing policy**, **selective deletion**, and **UNLINK** of a large key — without `FLUSHALL` (as in prod).

## Prerequisites

- [06. Memory](06-memory-advanced.md), [09. Troubleshooting](09-troubleshooting.md).
- Single-node:

```bash
cd deploy/redis && docker compose up -d
redis-cli PING
```

---

## Task 1. Set a hard limit

```bash
redis-cli CONFIG SET maxmemory 20mb
redis-cli CONFIG SET maxmemory-policy noeviction
redis-cli CONFIG GET maxmemory maxmemory-policy
```

---

## Task 2. Fill memory

```bash
redis-cli DEL lab:oom:big
# Create a large value (~ several MB, tune to the limit)
redis-cli DEBUG POPULATE 5000 lab:oom:key 1000
redis-cli INFO memory | grep used_memory_human
```

Add one large key (example):

```bash
redis-cli SET lab:oom:big "$(python3 -c 'print("x"*5000000)' 2>/dev/null || printf '%*s' 5000000 | tr ' ' x)"
```

Repeat `DEBUG POPULATE` or `SET` until you approach the limit.

Verify OOM:

```bash
redis-cli SET lab:oom:trigger should-fail
```

**What you’ll see:** `(error) OOM command not allowed when used memory > 'maxmemory'`.

**Reads** usually still work:

```bash
redis-cli GET lab:oom:key:1
```

---

## Task 3. Recovery without FLUSHALL

**Step A — enable eviction for cache keys:**

```bash
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli SET lab:oom:newkey recovered
redis-cli INFO stats | grep evicted_keys
```

**Step B — delete big key asynchronously:**

```bash
redis-cli MEMORY USAGE lab:oom:big
redis-cli UNLINK lab:oom:big
redis-cli INFO memory | grep used_memory_human
```

**Step C — reduce pressure (optional):**

```bash
redis-cli --scan --pattern 'lab:oom:key:*' | head -100 | xargs -r redis-cli UNLINK
```

---

## Task 4. Restore safe lab settings

```bash
redis-cli CONFIG SET maxmemory 0
redis-cli CONFIG SET maxmemory-policy noeviction
redis-cli DEL $(redis-cli --scan --pattern 'lab:oom:*' | tr '\n' ' ')
```

Or `docker compose restart` for a clean stand.

---

## Task 5. Runbook (in writing)

In 5–7 steps, describe a runbook for “OOM on prod cache”:

1. Confirm the symptom (`INFO memory`, alert).
2. Distinguish Redis OOM from **kernel OOM**.
3. Find top keys (`--bigkeys` / memory usage).
4. Mitigation (eviction, unlink, scale).
5. Postmortem (TTL, maxmemory sizing).

---

## Success criteria

- [ ] Reproduced `OOM command not allowed`.
- [ ] After `allkeys-lru` — writes work again.
- [ ] `UNLINK lab:oom:big` reduced `used_memory`.
- [ ] Runbook written.

---

## If it doesn’t work

| Symptom | Solution |
|---------|---------|
| OOM never happens | Lower `maxmemory` to `5mb` |
| `DEBUG POPULATE` disabled | Use only `SET` of large strings |
| Windows without python | PowerShell: `'x' * 1000000` into a variable and SET in chunks |

**Next:** [11. Interview Q&A](11-interview-qa.md).
