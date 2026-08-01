# 14. CLI: INFO, SCAN, SLOWLOG, MONITOR

## Intro: "p99 spiked — what's going on in Redis?"

The API suddenly got slow. Postgres is fine, but Redis is at **99% CPU** — it turned out a deploy script ran `KEYS app:*` in production. The operator opened **SLOWLOG**, saw the command, found the owner. This chapter is **diagnostics without a GUI**: INFO, safe key traversal, slowlog and a cautious MONITOR.

## What you'll learn

- The **INFO** sections for ops and development.
- **SCAN** instead of **KEYS**.
- **SLOWLOG** — finding slow commands.
- **MONITOR** — only on dev/stage.
- Basic **LATENCY DOCTOR** (preview).

## INFO — the dashboard

```bash
docker exec mock-redis redis-cli INFO
docker exec mock-redis redis-cli INFO server
docker exec mock-redis redis-cli INFO memory
docker exec mock-redis redis-cli INFO stats
docker exec mock-redis redis-cli INFO clients
docker exec mock-redis redis-cli INFO replication
```

| Section | Questions |
|--------|---------|
| **server** | version, uptime, tcp_port |
| **memory** | used, max, fragmentation |
| **stats** | ops/sec, hits/misses, evicted_keys |
| **clients** | connected_clients, blocked_clients |
| **replication** | role master/replica (intermediate) |
| **cpu** | used_cpu_sys/user |

Useful **stats** fields:

```text
instantaneous_ops_per_sec
keyspace_hits
keyspace_misses
evicted_keys
```

Hit rate (approximately): `hits / (hits + misses)`.

## SCAN — iterating over keys

**KEYS pattern** — O(N) over **all** keys, blocks the instance.

**SCAN cursor [MATCH pattern] [COUNT hint]** — iterative:

```bash
docker exec mock-redis redis-cli SCAN 0 MATCH 'lab:*' COUNT 100
```

Repeat with the new cursor until the cursor becomes `0`.

| | KEYS | SCAN |
|---|------|------|
| Blocking | yes, over the whole N | short steps |
| "See everything at once" guarantee | yes | may return duplicates if data changes |
| Prod | **forbidden** | yes |

## SLOWLOG

On the stand: `slowlog-log-slower-than 10000` (10 ms).

```bash
docker exec mock-redis redis-cli SLOWLOG GET 10
docker exec mock-redis redis-cli SLOWLOG LEN
```

Each entry: id, timestamp, **duration μs**, the command and its arguments.

An artificially slow command (labs only):

```bash
docker exec mock-redis redis-cli DEBUG SLEEP 0.02
docker exec mock-redis redis-cli SLOWLOG GET 1
```

`DEBUG SLEEP` — the **training stand only**.

Clearing the slowlog:

```bash
docker exec mock-redis redis-cli SLOWLOG RESET
```

## MONITOR

A stream of **all** commands in real time:

```bash
docker exec -it mock-redis redis-cli MONITOR
```

| | |
|---|---|
| Pro | instant "who's writing" debugging |
| Con | huge overhead, **not prod** |

Stop: Ctrl+C.

## CLIENT LIST and the memory of a large key

```bash
docker exec mock-redis redis-cli CLIENT LIST | head -5
docker exec mock-redis redis-cli MEMORY USAGE lab:some:key
```

`MEMORY USAGE` (Redis 4+) — an estimate of bytes per key (lab 15).

## LATENCY (preview)

```bash
docker exec mock-redis redis-cli LATENCY DOCTOR
```

Text recommendations about latency — useful on stage.

## On the stand: incident checklist

1. `INFO memory` — OOM/eviction?
2. `INFO stats` — evicted_keys, connections?
3. `SLOWLOG GET 20`
4. `SCAN` by the service prefix, not `KEYS`
5. Redis Commander [http://localhost:8081](http://localhost:8081) — visually

## Common mistakes

| Mistake | Consequence | Fix |
|--------|-------------|---------|
| `KEYS *` in cron | freeze | SCAN + metrics in the application |
| MONITOR on prod | CPU spike | structured client logging |
| Ignoring blocked_clients | BLPOP/BLMOVE hung | CLIENT LIST, timeouts |
| SLOWLOG threshold too high | you don't see 5ms problems | lower it on stage |

## In production

- Export **redis_exporter** → Prometheus/Grafana.
- Alerts: memory %, evictions, connected_clients, master down.
- Runbook: "latency" → slowlog → top commands → big keys (lab 15).

## Summary

**INFO** — the first screen. **SCAN** — a safe traversal. **SLOWLOG** — a history of slowdowns. **MONITOR** — the last mile on dev. Heavy keys — [15. Lab](15-lab-heavy-keys.md).

## Checklist

- Which command should you use instead of KEYS?
- Where do you look at evicted_keys?
- Why is MONITOR dangerous on prod?
- What does a cursor of 0 mean in SCAN?

Next lesson: [15. Lab: heavy keys](15-lab-heavy-keys.md).
