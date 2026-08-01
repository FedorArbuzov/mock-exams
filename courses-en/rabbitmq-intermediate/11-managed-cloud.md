# 11. Managed messaging: Amazon MQ for RabbitMQ

## Intro: "we stood up Rabbit on EC2, and there's no one to patch it"

Self-hosted RabbitMQ on a VM or in Kubernetes gives you full control — and full responsibility: Erlang cookie, clustering, quorum, backups, TLS, upgrades. **Amazon MQ** is an AWS managed service with a **RabbitMQ** engine (or ActiveMQ). The team gets an AMQP endpoint, a Multi-AZ deployment, and integration with **VPC**, **Secrets Manager**, and **CloudWatch** — without SSH-ing into the broker.

This chapter is **theoretical**: the mock-exams course doesn't require an AWS account. For AWS practice, see [aws-basic](../aws-basic/README.md); for SQS queues — [aws-intermediate](../aws-intermediate/README.md).

## What you'll learn

- The **Amazon MQ** models (RabbitMQ vs ActiveMQ).
- **Single-instance** vs **cluster** (Multi-AZ).
- Networking: **private broker**, security groups, no public AMQP.
- Differences from self-hosted and from **SQS**.
- When MQ, when SQS/Kafka.

---

## Amazon MQ for RabbitMQ

| Parameter | Typical choice |
|----------|----------------|
| Engine | RabbitMQ 3.x (version pinned by AWS) |
| Deployment | **CLUSTER_MULTI_AZ** for prod |
| Host class | `mq.m5.large` and up, by load |
| Access | users in the MQ console / LDAP (Enterprise) |

Applications connect over the same **AMQP 5671** (TLS) / **5672** in a private subnet. The **Management plugin** is available on a separate port (restrict the SG to bastion / VPN only).

**Quorum queues** are supported on compatible RabbitMQ versions in Amazon MQ — check the [AWS documentation](https://docs.aws.amazon.com/amazon-mq/) at implementation time.

## Networking and security

```text
[App in private subnet] --AMQP TLS--> [Amazon MQ broker ENI]
                                        |
                                   CloudWatch logs
```

- Broker in **private subnets** without public accessibility.
- **Security group**: ingress 5671 only from the applications' SG.
- Passwords in **Secrets Manager**, with rotation.
- **IAM** does not replace RabbitMQ users for AMQP — you need separate credentials (unlike IAM auth in some other services).

## Amazon MQ vs SQS

| | Amazon MQ (Rabbit) | SQS |
|---|-------------------|-----|
| Protocol | AMQP 0-9-1 | AWS API |
| Routing | exchanges, bindings | queue + DLQ |
| Ordering | FIFO within a single queue (limited) | FIFO queues separately |
| Ops | AWS patching, sizing | serverless |
| Course | this chapter | [07-sqs-dlq](../aws-intermediate/07-sqs-dlq.md) |

**SQS** is simpler for Lambda + serverless ([aws-intermediate](../aws-intermediate/README.md)). **RabbitMQ** is for when you need **complex topologies** (topic, headers, DLX chains, TTL), existing AMQP clients, federation.

## Amazon MQ vs self-hosted (deploy/rabbitmq)

| | `deploy/rabbitmq` | Amazon MQ |
|---|-------------------|-----------|
| Cost | Docker locally | $$$ instance hours |
| Cluster | `docker-compose.cluster.yml` | Multi-AZ managed |
| Prometheus | `:15692` on the environment | CloudWatch + optionally the Prometheus plugin |
| Learning | full ctl access | limited admin |

The course patterns (**DLX**, **quorum**, **confirms**) transfer 1:1; only the endpoint and backup policy change.

## Amazon MQ vs Kafka (MSK)

| Scenario | Leaning |
|----------|------------|
| Task queue, work distribution, RPC reply | RabbitMQ |
| Event log, replay, stream processing | [Kafka](../kafka-intermediate/README.md) |
| AWS-native, Lambda triggers | SQS |

## Migration and hybrid

- **Dual write** during migration from on-prem — risk of duplicates; better to use **strangler**: new services on MQ, old ones drain.
- **Shovel / federation** — inter-broker replication (advanced, not on the environment).
- DLQ monitoring — CloudWatch custom metric or a Prometheus sidecar scrape (if enabled).

## Checklist

- How does Amazon MQ differ from SQS?
- Why a Multi-AZ cluster?
- Do DLX and quorum transfer from the local course?
- When choose MSK over MQ?

Next step: [12-final-project.md](12-final-project.md).
