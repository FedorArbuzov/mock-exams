# 17. Operations: memory, eviction, FLUSH

## Intro: "Redis ate all RAM on the node — Kubernetes crashed"

Without `maxmemory` Redis can grow until the **OOM killer** takes not only itself but neighboring pods. An operator picks a **limit** and an **eviction policy**, knows the difference between `FLUSHDB` / `FLUSHALL`, and plans **maintenance** without surprises.

## What you'll learn

- `maxmemory` and `maxmemory-policy` policies.
- `allkeys-lru` vs `volatile-lru` vs `noeviction`.
- Safe work with `FLUSH`, `DEBUG`.
- Planned restart, versions, `redis-cli --bigkeys`.

## maxmemory

On the single stand:

```text
maxmemory 256mb
maxmemory-policy allkeys-lru
```

On the master of the replication stand — `noeviction` (don't lose keys unexpectedly on primary).

| Policy | Behavior |
|--------|-----------|
| `noeviction` | write error when memory is full |
| `allkeys-lru` | deletes any keys LRU |
| `volatile-lru` | only keys with TTL |
| `allkeys-lfu` | LFU (frequency) |
| `volatile-ttl` | shortest TTL first |

**Cache:** `allkeys-lru` / `allkeys-lfu`.  
**Queue/sessions without TTL:** be careful with LRU — prefer `noeviction` + alert + scale.

## Checking memory

```bash
INFO memory
CONFIG GET maxmemory
CONFIG GET maxmemory-policy
MEMORY STATS
```

## FLUSH — catastrophe zone

| Command | Effect |
|---------|--------|
| `FLUSHDB` | clear the current DB |
| `FLUSHALL` | all DBs |

In prod — **forbid** via ACL (`-flushall`). On the stand:

```bash
# only if you understand the consequences
SELECT 1
FLUSHDB
```

## Maintenance

| Task | Approach |
|--------|--------|
| Upgrade minor | replica promote / rolling |
| OS patch | Sentinel failover |
| Expand RAM | raise limit, restart |
| Find large keys | `redis-cli --bigkeys`, `MEMORY USAGE` |

## SCAN instead of KEYS

```bash
SCAN 0 MATCH 'app:*' COUNT 100
```

Iterative, doesn't block the event loop like `KEYS *`.

## On the stand

```bash
docker exec mock-redis redis-cli CONFIG GET maxmemory
docker exec mock-redis redis-cli CONFIG GET maxmemory-policy
```

Pressure simulation (carefully, small limit):

```bash
docker exec mock-redis redis-cli CONFIG SET maxmemory 1mb
docker exec mock-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

Restore after the lab:

```bash
docker compose restart redis
```

## Common mistakes

| Symptom | Cause | Solution |
|---------|---------|---------|
| `OOM command not allowed` | maxmemory + noeviction | RAM or policy |
| Cache "evicts" important data | allkeys on mixed workload | separate instances |
| Incident after FLUSHALL | ACL | `-@dangerous` |
| Growth without keys | replication backlog, AOF | `INFO`, disk |
| Hot key | one key 80% of traffic | sharding |

## In production

- Separate clusters: **cache** vs **persistent data**.
- Runbook: who may FLUSH, how to restore from backup ([18](18-lab-backup.md)).
- In K8s: memory requests/limits with headroom for RSS.

## Summary

Redis operations — memory limit, deliberate eviction, forbid dangerous commands, SCAN for inventory. Backup is a separate chapter.

## Checklist

- When is `noeviction` better than `allkeys-lru`?
- Why is `FLUSHALL` dangerous?
- How do you find the largest key?
- Why a separate Redis for cache and for a queue?

Next lesson: [18. Lab: backup](18-lab-backup.md).
