# 15. Monitoring Redis

## Intro: "users complain about slowness — and Grafana is empty"

Redis answers in milliseconds until it doesn't. Without metrics you only see "timeout". At intermediate you read **`INFO`**, **`SLOWLOG`**, latency doctor and know which alerts to set before OOM.

## What you'll learn

- `INFO` sections: memory, stats, replication, commandstats.
- `SLOWLOG`, `LATENCY DOCTOR`, `MEMORY DOCTOR`.
- Key metrics for alerts.
- Integration with Prometheus (overview).

## INFO — the main snapshot

```bash
INFO
INFO memory
INFO stats
INFO replication
INFO commandstats
```

| Field | Meaning |
|------|--------|
| `used_memory_human` | data RAM |
| `used_memory_rss` | process RSS |
| `mem_fragmentation_ratio` | >1.5 — possible fragmentation |
| `instantaneous_ops_per_sec` | load |
| `keyspace_hits` / `keyspace_misses` | cache hit rate |
| `blocked_clients` | waiting on BLPOP etc. |
| `connected_clients` | client count |

Hit rate (approximate):

```text
hits / (hits + misses)
```

## SLOWLOG

In [`redis-single.conf`](../../deploy/redis/config/redis-single.conf):

```text
slowlog-log-slower-than 10000
slowlog-max-len 128
```

10,000 microseconds = **10 ms** — commands slower than that enter the log.

```bash
SLOWLOG GET 10
SLOWLOG LEN
CONFIG GET slowlog-log-slower-than
```

## Latency

```bash
LATENCY DOCTOR
LATENCY GRAPH command
```

Shows typical problems: fork, AOF, eviction, disk.

## MONITOR (carefully)

```bash
MONITOR
```

Prints **every** command — only on dev; loads prod.

## Clients and key memory

```bash
CLIENT LIST
MEMORY USAGE app:big:key
```

For large keys — revisit the structure (Hash vs JSON string).

## On the stand

```bash
cd deploy/redis
docker compose up -d
docker exec mock-redis redis-cli INFO memory | head -20
docker exec mock-redis redis-cli CONFIG GET slowlog-log-slower-than
```

## Exporting metrics (overview)

- **redis_exporter** → Prometheus → Grafana.
- ElastiCache: CloudWatch `CPUUtilization`, `DatabaseMemoryUsagePercentage`, `ReplicationLag`.

## Common mistakes

| Symptom | Cause | Solution |
|---------|---------|---------|
| OOM | no maxmemory / policy | `maxmemory`, eviction |
| High RSS | fragmentation | restart, `activedefrag` |
| Rising latency | big keys, `KEYS *` | `SCAN`, split the key |
| `blocked_clients` grows | slow BLPOP | more workers |
| SLOWLOG empty | threshold too high | lower the threshold |

## In production

- Alerts: memory > 80%, replication lag, `rejected_connections`, master down.
- Dashboard: ops/sec, hit rate, slowlog rate, connected clients.
- Don't enable `MONITOR` in prod.

## Summary

`INFO` + `SLOWLOG` + latency tools — the basic operator toolkit. Lab 16 generates a slow command and reads SLOWLOG.

## Checklist

- How do you compute hit rate?
- What does `mem_fragmentation_ratio` > 1.5 mean?
- Why care about `blocked_clients`?
- Why is `KEYS *` dangerous?

Next lesson: [16. Lab: SLOWLOG](16-lab-slowlog.md).
