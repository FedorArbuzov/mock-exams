# Redis — Advanced

Advanced level for **interviews** and **production**: **Redis internals**, **Cluster** (hash slots, resharding), **hot keys and cache stampede**, **memory** (eviction, fragmentation, lazy free), **security** (ACL, rename-command, TLS), **troubleshooting** (OOM, latency, CLUSTERDOWN), **system design**, **Redlock and patterns**, **Valkey / Redis Stack**, **operators in Kubernetes**, **mock interview**, and **capstone**.

**Prerequisites:** [`redis-basic`](../redis-basic/README.md) — data types, TTL, pub/sub. [`redis-intermediate`](../redis-intermediate/README.md) — replication, Sentinel, persistence, basic `maxmemory`.

**Locally:** [`deploy/redis`](../../deploy/redis/README.md)

| Profile | Command | Connect from host |
|---------|---------|---------------------|
| Single instance | `docker compose up -d` | `localhost:6379` |
| Master + replica | `docker compose -f docker-compose.replication.yml up -d` | `6379` / `6380` |
| Sentinel | `docker compose -f docker-compose.sentinel.yml up -d` | `26379` (Sentinel) |
| **Cluster (this course)** | `docker compose -f docker-compose.cluster.yml up -d` + `bash scripts/init-cluster.sh` | `localhost:7001-7006` (`redis-cli -c`) |

Before switching compose stacks, **stop** the previous one — otherwise port conflicts on `6379` / `7001-7006`.

## How to read chapters

Each lesson is a **book chapter** for interview prep, not a dry cheat sheet.

1. **Theory** (01, 02, 04…) — workplace scenario → concepts → stand demo → common mistakes → “in the interview” → summary.
2. **Lab** (03, 05, 08…) — goal → prerequisites → tasks → “what you’ll see” / “if it doesn’t work” → success criteria.
3. After blocks 11–12 — go through [`interview-cheatsheet.md`](interview-cheatsheet.md) without peeking at answers.

**Time:** ~60–90 minutes per “theory + lab” pair; [capstone](18-capstone.md) — **4–6 hours**.

## Curriculum

### Internals and cluster (01–03)

| # | Lesson |
|---|------|
| 01 | [Redis internals](01-internals.md) |
| 02 | [Redis Cluster](02-cluster.md) |
| 03 | [Lab: cluster 7001-7006](03-lab-cluster.md) |

### Load and memory (04–06)

| 04 | [Hot keys and cache stampede](04-hot-keys-stampede.md) |
| 05 | [Lab: stampede](05-lab-stampede.md) |
| 06 | [Memory: advanced](06-memory-advanced.md) |

### Security (07–08)

| 07 | [Security advanced](07-security.md) |
| 08 | [Lab: rename-command](08-lab-rename-commands.md) |

### Ops and interview (09–14)

| 09 | [Troubleshooting](09-troubleshooting.md) |
| 10 | [Lab: OOM recovery](10-lab-oom-recovery.md) |
| 11 | [Interview Q&A (top 30)](11-interview-qa.md) |
| 12 | [Lab: mock interview](12-lab-mock-interview.md) |
| 13 | [System design](13-system-design.md) |
| 14 | [Lab: system design](14-lab-system-design.md) |

### Patterns and ecosystem (15–18)

| 15 | [Patterns: Redlock, rate limit](15-patterns-redlock.md) |
| 16 | [Valkey and Redis Stack](16-valkey-stack.md) |
| 17 | [K8s: StatefulSet and operators](17-k8s-operators.md) |
| 18 | [Capstone](18-capstone.md) |

### Cheatsheet and examples

| — | [Interview cheatsheet](interview-cheatsheet.md) |
| — | [examples/cluster-notes.md](examples/cluster-notes.md) |
| — | [examples/redis-security.conf](examples/redis-security.conf) |

## What you should end up with

- Explain the **single-threaded event loop**, **pipelining**, and why **large keys** hurt.
- Design **hash tags**, understand **16384 slots**, **MOVED/ASK**, and **failover** in Cluster.
- Mitigate **hot key** and **cache stampede** (TTL jitter, singleflight, local cache).
- Configure **maxmemory**, **eviction**, and read **mem_fragmentation_ratio**.
- Enable **ACL**, **rename-command**, and tie them to **host firewall** ([linux-intermediate: firewall](../linux-intermediate/07-firewall.md)).
- Recover an instance after **OOM** and diagnose **latency spikes**.
- Answer **system design** “cache + sessions for 50k RPS” with trade-offs.
- Critically evaluate **Redlock** and alternatives.
- Compare **Valkey**, **Redis OSS**, **ElastiCache / MemoryDB**, and **operators** in k8s.

## Related courses

| Course | Link |
|------|-------|
| [`redis-basic`](../redis-basic/README.md) | types, TTL, basic commands |
| [`redis-intermediate`](../redis-intermediate/README.md) | replica, Sentinel, RDB/AOF |
| [`linux-intermediate`](../linux-intermediate/07-firewall.md) | ufw/nftables around Redis |
| [`kuber-intermediate`](../kuber-intermediate/01-statefulset.md) | StatefulSet for Redis/Valkey |
| [`aws-intermediate`](../aws-intermediate/README.md) | ElastiCache, VPC, security groups |
