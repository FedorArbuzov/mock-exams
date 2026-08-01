# 05. Lab: cache stampede and TTL jitter

## Lab goal

Simulate **simultaneous expiry** and compare behavior **without protection** vs **jitter + simple lock** on the single-node stand (`6379`). Understand the metrics you’d look at in an incident.

## Prerequisites

- [04. Hot keys and stampede](04-hot-keys-stampede.md).
- Single-node (simpler than Cluster):

```bash
cd deploy/redis
docker compose down 2>/dev/null || true
docker compose up -d
redis-cli PING
```

---

## Task 1. Baseline: one key, short TTL

```bash
redis-cli SET lab:stampede:item "payload-from-db" EX 3
redis-cli TTL lab:stampede:item
redis-cli GET lab:stampede:item
```

**What you’ll see:** TTL decreases; after 3 s — `(nil)`.

---

## Task 2. “Storm” without protection (simulation)

In **two** terminals at once after `EXPIRE` (or wait for TTL), run:

```bash
# Terminal A and B — within one second after TTL expiry
redis-cli GET lab:stampede:item
redis-cli GET lab:stampede:item
```

Record: both got a miss → in a real app both would hit the DB.

**Extension (optional):** bash script:

```bash
for i in $(seq 1 20); do
  redis-cli GET lab:stampede:item &
done
wait
```

After `SET ... EX 1` and `sleep 2` — 20 parallel misses.

---

## Task 3. TTL jitter

**Why:** spread out expiry moments.

```bash
for i in $(seq 1 100); do
  jitter=$((RANDOM % 30))
  redis-cli SET "lab:cache:$i" "v$i" EX $((60 + jitter)) >/dev/null
done
redis-cli --scan --pattern 'lab:cache:*' | wc -l
```

Check TTL distribution (sample):

```bash
redis-cli TTL lab:cache:1
redis-cli TTL lab:cache:50
```

**What you’ll see:** TTL from 60 to 89 — no single “peak” in one second.

---

## Task 4. Lock on miss (manual scenario)

```bash
redis-cli DEL lab:stampede:item lab:stampede:lock
redis-cli SET lab:stampede:item "warm" EX 5
```

Simulate the **first** client with a lock:

```bash
redis-cli GET lab:stampede:item
redis-cli SET lab:stampede:lock 1 NX EX 10
# “load from DB”
redis-cli SET lab:stampede:item "reloaded-$(date +%s)" EX 60
redis-cli DEL lab:stampede:lock
```

Second client while lock is held:

```bash
redis-cli SET lab:stampede:lock 1 NX EX 10
# (nil) — lock not acquired
redis-cli GET lab:stampede:item
```

**What you’ll see:** one “loader”, the second reads an already-filled key (or waits/retries in the app).

---

## Task 5. Interview reflection

In `examples/cluster-notes.md` or a separate block, answer in writing:

1. Why is a `SETNX` lock better than `SET lock 1` without `NX`?
2. What if the lock holder **dies** before `DEL`? (TTL on the lock.)
3. Why is Redlock overkill for a **single** instance?

---

## Success criteria

- [ ] Demonstrated miss on TTL expiry.
- [ ] 100 keys with jitter — TTLs are spread out.
- [ ] Lock: only one successful `SET NX`.
- [ ] Three reflection answers written.

---

## If it doesn’t work

| Symptom | Solution |
|---------|---------|
| `RANDOM` doesn’t work | PowerShell: `$j = Get-Random -Maximum 30` manually for a few keys |
| Port 6379 busy | `docker compose down` in other redis profiles |

**Next:** [06. Memory](06-memory-advanced.md).
