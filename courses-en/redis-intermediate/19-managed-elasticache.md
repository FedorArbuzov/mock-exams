# 19. Managed Redis: Amazon ElastiCache

## Intro: "we ran Redis on EC2 — forgot to patch, went down on OOM"

Self-hosted Redis ([deploy/redis](../../deploy/redis/README.md), Sentinel, Cluster) gives control, but **you** are the SRE: patches, failover, backups, monitoring. **Amazon ElastiCache** is managed Redis (and Memcached): AWS runs the hosts, Multi-AZ failover, snapshots, and VPC integration.

This chapter's theory builds on [aws-basic: databases](../aws-basic/07-databases.md) (ElastiCache section).

## What you'll learn

- When ElastiCache instead of EC2/Docker Redis.
- Modes: single node, replication group, Multi-AZ.
- Networking: subnet group, security groups.
- Parameters, backups, updates.
- Differences from the training Sentinel stand.

## Managed vs self-hosted

| | Self-hosted (course) | ElastiCache |
|--|-------------------|-------------|
| Failover | Sentinel / manual | Multi-AZ automatic |
| Patches | you | maintenance window |
| Backups | BGSAVE + S3 script | snapshots, PITR (depends on version) |
| RAM scale | VM migration | vertical scale, shard (cluster mode) |
| Cost | EC2 + your time | premium for managed |

## Topology

```text
App (private subnet, ECS/EKS/EC2)
    → Security Group: TCP 6379 from app-sg
    → ElastiCache Replication Group
          Primary (write)
          Replica(s) (read, AZ failover)
```

**Subnet group** — only the listed private subnets.  
**Security group** — don't open 6379 to `0.0.0.0/0`.

Link to VPC from [aws-basic 04](../aws-basic/04-vpc-networking.md): Redis does **not** live in a public subnet.

## Modes

| Mode | Use case |
|-------|----------|
| Single node | dev/test |
| Replication group + 1 replica | prod read scale |
| Multi-AZ | auto failover primary |
| Cluster mode enabled | sharding, > one node's RAM |

Training [`docker-compose.sentinel.yml`](../../deploy/redis/docker-compose.sentinel.yml) ≈ the **logic** of a replication group + Sentinel, but without the AWS API.

## Parameters and compatibility

- **Parameter group**: `maxmemory-policy`, `timeout`, `notify-keyspace-events`.
- Engine version — client compatibility (`redis-py`, Lettuce).
- **AUTH token** + **RBAC** (ACL users in the cloud) — analog of [09-acl](09-acl.md).

## Backups and restore

| Capability | Meaning |
|-------------|--------|
| Snapshot | manual/automatic RDB-like snapshot |
| Backup window | low load |
| Restore into a new cluster | DR drill |

Matches practices from [18-lab-backup](18-lab-backup.md), but via console/Terraform.

## Monitoring

CloudWatch:

- `CPUUtilization`
- `DatabaseMemoryUsagePercentage`
- `CurrConnections`
- `ReplicationLag` (for replica)
- `Evictions` (on eviction)

Analogues of `INFO` and SLOWLOG — [15-monitoring](15-monitoring.md); in AWS you can enable **Slow Log** delivery to CloudWatch Logs.

## When Redis, when DynamoDB/RDS

From [07-databases](../aws-basic/07-databases.md):

| Task | Service |
|--------|--------|
| Cache, sessions, rate limit, pub/sub | ElastiCache Redis |
| TB queue, replay | MSK (Kafka) |
| Primary transactional DB | RDS/Aurora |
| Key-value without Redis API | DynamoDB |

Don't keep the **only** copy of orders in Redis — cache aside: write to RDS, invalidate the cache.

## Migrating from the training stand

1. Stand up a replication group in a private subnet.
2. Export data: `BGSAVE` / RIOT / redis-shake (for large volumes).
3. Switch `REDIS_URL` in the app, enable TLS.
4. Load test and failover drill in a maintenance window.

## Common mistakes

| Symptom | Cause | Solution |
|---------|---------|---------|
| Timeout from app | SG / subnet | 6379 from app-sg, same VPC |
| Data loss | Redis as primary DB | RDS + cache |
| High bill | oversized node | rightsizing, cluster shards |
| Stale cache | no TTL/invalidation | TTL, pub/sub invalidation |
| AUTH failed | token rotation | Secrets Manager |

## Summary

ElastiCache moves Sentinel/backup/patch operations into AWS. Course concepts (replication, ACL, memory, slowlog) are the **same**; what changes is the control plane and VPC/IAM integration.

## Checklist

- Where in the VPC should ElastiCache live?
- How does a replication group differ from a single node?
- Which CloudWatch metric catches memory filling up?
- Why doesn't a cache replace Postgres?

Next lesson: [20. Final project](20-final-project.md).
