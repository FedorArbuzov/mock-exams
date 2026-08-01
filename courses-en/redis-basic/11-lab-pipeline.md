# 11. Lab: pipeline and MULTI/EXEC

## Lab goal

Load a batch of keys via **`--pipe`**, run **MULTI/EXEC** for linked counters, and optionally demonstrate **WATCH** with a conflict.

## Prerequisites

- [10. Pipeline and transactions](10-pipeline-transactions.md).
- Prefixes: **`lab:pipe:`**, **`lab:tx:`**

---

## Task 1. Prepare the counters

```bash
docker exec mock-redis redis-cli MSET lab:tx:a 100 lab:tx:b 50
docker exec mock-redis redis-cli MGET lab:tx:a lab:tx:b
```

**What you'll see:** `100`, `50`.

---

## Task 2. Pipeline via --pipe

**Why:** one round-trip per batch of commands.

Create a file (or a heredoc in bash):

```bash
printf '%s\n' \
  'SET lab:pipe:k1 v1' \
  'SET lab:pipe:k2 v2' \
  'SET lab:pipe:k3 v3' \
  'INCR lab:pipe:counter' \
  | docker exec -i mock-redis redis-cli --pipe
```

**What you'll see:** lines like `All data transferred` / a reply counter (depends on the cli version).

Check:

```bash
docker exec mock-redis redis-cli MGET lab:pipe:k1 lab:pipe:k2 lab:pipe:k3
docker exec mock-redis redis-cli GET lab:pipe:counter
```

---

## Task 3. MULTI/EXEC in the interactive CLI

**Why:** atomically decrease `a` and increase `b` (a transfer of 10 units).

```bash
docker exec -it mock-redis redis-cli
```

Inside:

```text
MULTI
DECRBY lab:tx:a 10
INCRBY lab:tx:b 10
EXEC
MGET lab:tx:a lab:tx:b
```

**What you'll see:** `90`, `60`.

---

## Task 4. WATCH and a conflict (optional)

Terminal A:

```bash
docker exec -it mock-redis redis-cli
```

```text
SET lab:tx:version 1
WATCH lab:tx:version
MULTI
SET lab:tx:data "draft"
EXEC
```

While A is in MULTI (after WATCH, before EXEC), in B:

```bash
docker exec mock-redis redis-cli INCR lab:tx:version
```

In A run `EXEC`.

**What you'll see:** `(nil)` or an empty EXEC result — the transaction was cancelled because the watched key changed.

Reset:

```bash
docker exec mock-redis redis-cli DEL lab:tx:version lab:tx:data
```

---

## Task 5. Comparison: without MULTI

```bash
docker exec mock-redis redis-cli DECRBY lab:tx:a 5
docker exec mock-redis redis-cli INCRBY lab:tx:b 5
```

Between the commands another client could theoretically interleave — for basic, understanding the risk is enough.

---

## Task 6. Cleanup

```bash
docker exec mock-redis redis-cli DEL lab:pipe:k1 lab:pipe:k2 lab:pipe:k3 lab:pipe:counter lab:tx:a lab:tx:b
```

---

## Success criteria

- [ ] `--pipe` created ≥3 keys and an INCR
- [ ] MULTI/EXEC changed `a` and `b` consistently
- [ ] (opt.) WATCH + someone else's INCR cancelled EXEC
- [ ] You understand the difference between pipeline and MULTI

## What to take to work

- Bulk loading of labs — `--pipe`; in an application — the client's pipeline API.
- Financial micro-operations — MULTI or Lua, not a GET/SET loop from the host.

Next lesson: [12. Memory and eviction](12-memory-eviction.md).
