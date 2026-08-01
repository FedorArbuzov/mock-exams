# 07. Databases in AWS

## Managed vs self-hosted

| Approach | Pros | Cons |
|---|---|---|
| **RDS / Aurora** (managed SQL) | Backups, engine patches, Multi-AZ | More expensive, less OS control |
| **EC2 + Postgres** | Full control | You're the DBA — patches, HA |
| **DynamoDB** (NoSQL managed) | Scale, serverless | A different data model |

For production, it's almost always **managed**.

## RDS (Relational Database Service)

Supports **PostgreSQL, MySQL, MariaDB, Oracle, SQL Server**.

```text
App (private subnet)
    → Security Group: 5432 from app-sg
    → RDS instance (private subnet, Multi-AZ optional)
```

| Option | Meaning |
|---|---|
| **Multi-AZ** | A synchronous standby replica in another AZ (failover ~ a minute) |
| **Read Replica** | An asynchronous read replica |
| **Automated backups** | Point-in-time recovery |
| **Parameter group** | Engine settings (`max_connections`) |

**Subnet group** — RDS lives only in the specified private subnets.

## Aurora

An AWS-optimized SQL-compatible engine (PostgreSQL/MySQL API). Storage **grows automatically**, up to 15 read replicas, fast failover.

More expensive than RDS, but for high loads it's the standard.

## DynamoDB

**NoSQL**, key-value and document, **serverless** in its model:

| Concept | Description |
|---|---|
| **Table** | A collection of items |
| **Partition key** | Distribution across shards |
| **Sort key** | Optional, composite key |
| **GSI / LSI** | Secondary indexes |
| **On-demand vs provisioned** | Pay per request vs reserved RCU/WCU |

Example item (image metadata in the final project):

```json
{
  "image_id": "abc-123",
  "bucket": "my-course-bucket",
  "s3_key": "uploads/abc-123.jpg",
  "width": 1920,
  "created_at": "2026-05-16T12:00:00Z"
}
```

**Single-table design** is an advanced pattern; for the course a single `images` table is enough.

## ElastiCache (briefly)

Managed **Redis** or **Memcached** — a cache for sessions, rate limiting, not a primary DB. Practice and ElastiCache in detail: [redis-intermediate/19-managed-elasticache](../redis-intermediate/19-managed-elasticache.md), lab environment [deploy/redis](../../deploy/redis/README.md).

## Choosing a database

| Task | Service |
|---|---|
| Transactions, JOINs, reports | RDS / Aurora (Postgres) |
| Millions of keys, predictable latency, serverless | DynamoDB |
| Cache | ElastiCache |
| Full-text search | OpenSearch (a separate service) |

## Backups and DR

- RDS: automated snapshots + retention.
- DynamoDB: **PITR** (point-in-time recovery), on-demand backup.
- Cross-region replica — for disaster recovery (cost + complexity).

## Connection secrets

Don't hardcode the password in code:

```text
RDS master password → Secrets Manager / SSM Parameter Store
    → App reads it at startup (IAM role)
```

## Local emulation

LocalStack: a simplified RDS, DynamoDB API at `localhost:4566`. Transaction behavior and performance are not like AWS — but it's enough for **learning the API and Terraform**.

## Checklist

- Why put RDS in a private subnet?
- How does Multi-AZ differ from a Read Replica?
- When to use DynamoDB instead of Postgres?
- What is a partition key?
- Where should you store the database password?

Next lesson: [08-serverless-lambda.md](08-serverless-lambda.md).
