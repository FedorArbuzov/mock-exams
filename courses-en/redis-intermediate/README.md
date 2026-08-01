# Redis — Intermediate

Intermediate level: **persistence (RDB/AOF)**, **replication and manual failover**, **Sentinel**, **Streams**, **ACL**, **Lua**, **reliable queues**, **monitoring**, **backups**, **ElastiCache**.

**Prerequisites:** [`redis-basic`](../redis-basic/README.md) (data types, TTL, basic `redis-cli`) and Docker ([`linux-basic`](../linux-basic/README.md) or [`linux-intermediate`](../linux-intermediate/README.md)).

**Locally:** [`deploy/redis`](../../deploy/redis/README.md).

| Stand | Compose | Host ports |
|-------|---------|----------------|
| Single instance (Streams, ACL, Lua, slowlog, backup) | `docker compose up -d` | `6379`, UI `8081` |
| Master + replica | `docker compose -f docker-compose.replication.yml up -d` | master `6379`, replica `6380` |
| Sentinel HA | `docker compose -f docker-compose.sentinel.yml up -d` | master `6379`, Sentinel `26379` |

Before switching stands, stop the previous compose — otherwise `6379` / `8081` will conflict (see the stand README).

**Next:** [`redis-advanced`](../redis-advanced/README.md) (Cluster, Redis Stack).

**Related:** [`kafka-basic`](../kafka-basic/README.md) — comparing Streams with consumer groups; [`aws-basic`](../aws-basic/07-databases.md) — ElastiCache.

## How to read chapters

Each lesson is a **book chapter**, not a cheat sheet. Recommended order within a pair:

1. Read the **theory** (01, 03, 05…) — don't skip the intro and "common mistakes".
2. Open the **lab** (02-lab, 04-lab…) with the matching compose in `deploy/redis`.
3. Complete tasks **in order**; compare output with the "what you'll see" block.
4. If something doesn't match — [`deploy/redis/README.md`](../../deploy/redis/README.md).

**Theory structure:** intro (workplace scenario) → what you'll learn → concepts → stand example → mistakes → in production → summary → checklist.

**Lab structure:** goal → prerequisites → tasks 1…N (why / commands / what you'll see) → success criteria.

**Time:** about **45–60 minutes** per "theory + lab" pair; [final project](20-final-project.md) — **2–3 hours**.

**Connection cheat sheet:**

| Stand | Write | Read | Sentinel |
|-------|--------|--------|----------|
| Single | `localhost:6379` | same | — |
| Replication | `6379` (master) | `6380` (replica) | — |
| Sentinel | discover via `SENTINEL get-master-addr-by-name` | replica per client policy | `localhost:26379` |

CLI: `redis-cli -h localhost -p 6379` or `docker exec -it mock-redis redis-cli`.

## Curriculum

### Persistence (01–02)

1. [RDB and AOF](01-persistence.md) · 2. [Lab: RDB/AOF](02-lab-rdb-aof.md)

### Replication (03–04)

3. [Master–replica replication](03-replication.md) · 4. [Lab: replica and manual failover](04-lab-replica-failover.md)

### Sentinel (05–06)

5. [Redis Sentinel](05-sentinel.md) · 6. [Lab: automatic failover](06-lab-sentinel.md)

### Streams (07–08)

7. [Streams: event log in Redis](07-streams.md) · 8. [Lab: consumer group](08-lab-streams-consumer.md)

### Security (09–10)

9. [ACL: users and commands](09-acl.md) · 10. [Lab: read-only user](10-lab-acl-readonly.md)

### Scripts (11–12)

11. [Lua in Redis](11-lua.md) · 12. [Lab: distributed lock](12-lab-lua-lock.md)

### Reliability (13–14)

13. [Queues, BLPOP, at-least-once](13-reliability.md) · 14. [Lab: BLPOP queue](14-lab-blpop-queue.md)

### Operations (15–18)

15. [Monitoring and metrics](15-monitoring.md) · 16. [Lab: SLOWLOG](16-lab-slowlog.md)
17. [Operations: memory, eviction, FLUSH](17-operations.md) · 18. [Lab: backup and restore](18-lab-backup.md)

### Cloud and finale (19–20)

19. [Managed: ElastiCache](19-managed-elasticache.md)
20. [Final project](20-final-project.md)

## What you should end up with

- Choose **RDB vs AOF** for the scenario and read `INFO persistence`.
- Configure **master/replica**, check lag, and do a **manual** promote.
- Observe **Sentinel failover** and find the current master.
- Build a **Stream + consumer group**, compare with a Kafka consumer group.
- Restrict access via **ACL** (read-only user).
- Write **Lua** for an atomic lock.
- Build a **task queue** on Lists + BLPOP with idempotency.
- Read **SLOWLOG**, **INFO**, take an RDB/AOF **backup**.
- Explain when to take **ElastiCache** instead of self-hosted Redis.

## Examples

| Path | Purpose |
|------|------------|
| [`examples/acl-readonly.acl`](examples/acl-readonly.acl) | ACL for lab 10 |
| [`examples/backup-restore.sh`](examples/backup-restore.sh) | backup script for lab 18 |
