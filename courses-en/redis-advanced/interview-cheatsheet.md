# Interview cheatsheet — Redis Advanced

Tables for review before the interview. Format: **question → short answer (≈30 s) → deep dive (2–3 min)**.

Full chapters: [11-interview-qa](11-interview-qa.md). Practice: [12-lab-mock-interview](12-lab-mock-interview.md).

**Stand:** [`deploy/redis`](../../deploy/redis/README.md) (cluster `7001-7006`) · **Predecessor:** [`redis-intermediate`](../redis-intermediate/README.md) · **Firewall:** [`linux-intermediate/07-firewall`](../linux-intermediate/07-firewall.md) · **K8s:** [`kuber-intermediate/01-statefulset`](../kuber-intermediate/01-statefulset.md)

---

## Architecture and model

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 1 | Redis vs PG as cache? | In-memory, structures, sub-ms; not ACID SoT | Cache/session/rate limit; explicit loss without AOF/cluster |
| 2 | Single-threaded? | One main command thread; scale by shards | I/O threads; KEYS blocks; Cluster = N threads ([01](01-internals.md)) |
| 3 | Pipeline? | Fewer RTTs, not atomicity | vs MULTI/Lua; pipeline size |
| 4 | MULTI vs Lua? | MULTI queue; Lua conditions atomically | WATCH; Cluster same slot |
| 5 | RDB vs AOF? | Snapshot vs log | everysec; rewrite; fork COW |

---

## Replication and HA

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 6 | Async replication loss? | Write after ACK may not reach replica | WAIT rarely; failover promote lag |
| 7 | Sentinel vs Cluster? | Sentinel failover; Cluster sharding | When one master is enough ([02](02-cluster.md)) |
| 8 | How many Sentinels? | 3+ odd | Quorum; split-brain |
| 9 | Read replica? | Eventual reads | Lag; not read-your-writes |
| 10 | CLUSTERDOWN? | No quorum masters / slots | init-cluster; full coverage ([09](09-troubleshooting.md)) |

---

## Cluster and keys

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 11 | Hash slots? | 16384; CRC16 mod | Doesn’t change |
| 12 | MOVED vs ASK? | Permanent vs migration redirect | Slot map; ASKING |
| 13 | Hash tag? | `{x}` in key → same slot | Hot slot risk ([04](04-hot-keys-stampede.md)) |
| 14 | KEYS in prod? | No O(N) block | SCAN |
| 15 | CROSSSLOT? | Multi-key different slots | Hash tag / redesign |

---

## Memory and perf

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 16 | Policy for cache? | allkeys-lru/lfu + TTL | noeviction queues ([06](06-memory-advanced.md)) |
| 17 | High fragmentation? | RSS >> used | defrag; OOM killer |
| 18 | Hot key? | commandstats, --hotkeys staging | Shard key; local cache |
| 19 | Stampede? | Mass miss → DB | jitter, lock, singleflight ([05](05-lab-stampede.md)) |
| 20 | Big values? | Network, replication | S3 + id; UNLINK |

---

## Security / patterns / cloud

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 21 | Protect Redis? | Private, SG, ACL, TLS, ufw | Defense depth ([07](07-security.md), [firewall](../linux-intermediate/07-firewall.md)) |
| 22 | ACL vs requirepass? | Multi-user, commands, keys | default off |
| 23 | Redlock? | Controversial; fencing, clocks | SET NX; etcd/DB critical ([15](15-patterns-redlock.md)) |
| 24 | Rate limit? | INCR+EXPIRE; ZSET sliding | Hot key shard |
| 25 | Pub/Sub vs Streams? | Pub/Sub volatile; Streams log+groups | No persistence pub/sub |

---

## Design / ecosystem

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 26 | Session store? | TTL, replication, encrypt PII | noeviction instance |
| 27 | Redis vs Memcached? | Structures, persistence vs simple MT cache | Use-case fit |
| 28 | ElastiCache? | Managed HA/patch; you size keys | Cluster mode ([17](17-k8s-operators.md)) |
| 29 | Valkey? | OSS fork, RESP compatible | License; modules check ([16](16-valkey-stack.md)) |
| 30 | Design 50k RPS cache? | RAM estimate, cluster, stampede, metrics | [13](13-system-design.md) |

---

## “Interview day” commands

```bash
redis-cli -c -p 7001 CLUSTER INFO
redis-cli INFO memory
redis-cli SLOWLOG GET 10
redis-cli LATENCY DOCTOR
redis-cli ACL LIST
```

---

## Cluster stand (ports)

| Node | Client | Bus |
|------|--------|-----|
| redis-1 | 7001 | 17001 |
| redis-2 | 7002 | 17002 |
| … | … | … |
| redis-6 | 7006 | 17006 |

`bash scripts/init-cluster.sh` after `docker compose -f docker-compose.cluster.yml up -d`
