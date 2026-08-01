# 09. pgbench methodology

## Scenario from work

"We bumped `shared_buffers` — TPS went up 40%" — but the test was 10 seconds, cold cache, and JIT was turned on at the same time. Another team runs `pgbench -c 200` on a laptop with no pooler and publishes "Postgres handles 50k TPS". **pgbench** is a tool, not the truth; methodology is what matters.

The course uses pgbench for **before/after** on a single change, not for marketing.

## What you'll learn

- pgbench flags and the scale factor
- Common benchmarking mistakes
- The link to PgBouncer and JIT
- Custom scripts

## What pgbench measures

A built-in benchmark: **TPS** (transactions per second), **latency** (avg, stddev, sometimes percentiles in newer versions).

```bash
pgbench -i -s 10 "postgresql://course:course@localhost:5432/course"
pgbench -c 10 -j 2 -T 60 "postgresql://course:course@localhost:5432/course"
```

| Flag | Meaning |
|------|-------|
| `-i` | Init — create the `pgbench_*` schema |
| `-s scale` | Multiplier ~100k accounts rows (scale 10 ≈ 1M) |
| `-c clients` | Number of connections (= concurrency) |
| `-j threads` | Client threads (≤ cores usually) |
| `-T seconds` | Run duration |
| `-P sec` | Progress report |
| `-M prepared` | Prepared statements (more realistic for an ORM) |

The standard workload is a simplified TPC-B (a mix of SELECT/UPDATE/INSERT).

## Methodology for a fair test

```text
1. Fix: -c, -j, -T, -M, hardware, PG version
2. Warm-up: a separate 30s run that doesn't count
3. At least 3 runs, take the median
4. One parameter per iteration (index OR shared_buffers OR jit)
5. SET jit = off for an OLTP-like comparison
6. Look at latency stddev, not just TPS
7. Record the cache state (restart vs steady)
```

## Common mistakes

| Mistake | Why it's bad |
|--------|--------------|
| Cold cache on the first run | Overstated "tuning" effect |
| `-c` >> CPU cores | Context switching, not Postgres throughput |
| Changing 3 GUCs at once | Unclear what helped |
| Ignoring p99 latency | TPS is OK, users suffer |
| Docker on Mac latency | Not comparable to bare-metal prod |
| No pooler at 100+ clients | `too many connections` |

## The link to PgBouncer

At `-c 50`, compare:

```bash
pgbench -c 50 -j 4 -T 30 "postgresql://course:course@localhost:5432/course"
pgbench -c 50 -j 4 -T 30 "postgresql://course:course@localhost:6432/course"
```

See [intermediate/16-lab-pgbouncer](../postgresql-intermediate/16-lab-pgbouncer.md).

## Custom script

```bash
pgbench -f custom.sql -c 5 -T 20 -M prepared URL
```

`custom.sql`:

```sql
\set device_id random(1, 1000)
SELECT count(*) FROM perf.events WHERE device_id = :device_id;
```

Useful for testing **your** queries, not just TPC-B.

## Interpreting the results

```text
transaction type: <builtin: TPC-B (sort of)>
scaling factor: 10
query mode: simple
number of clients: 10
number of threads: 2
duration: 30 s
number of transactions actually processed: 45231
latency average = 6.612 ms
latency stddev = 3.104 ms
tps = 1507.234567 (including connections establishing)
```

TPS falls as `-c` grows without a pool — Little's law + lock contention.

## Common mistakes (prod)

Publishing pgbench TPS as "API capacity" without accounting for JOINs, ORM, network.

## Checklist

- [ ] Scale factor — what it means
- [ ] Why TPS falls as `-c` grows without a pool
- [ ] Why 3+ runs
- [ ] JIT off for an OLTP benchmark
- [ ] Custom script for your own queries

## Next

Lab: [10-lab-pgbench-tuning.md](10-lab-pgbench-tuning.md).
