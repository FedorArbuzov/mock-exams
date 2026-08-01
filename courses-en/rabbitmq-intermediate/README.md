# RabbitMQ — Intermediate

Continuation of the basic RabbitMQ course (planned [rabbitmq-basic](../rabbitmq-basic/README.md)): **quorum queues**, **Dead Letter Exchange (DLX)**, **TTL and priorities**, **publisher confirms**, **monitoring** (Management API, Prometheus `:15692`), an overview of **Amazon MQ**, and a **final project** — a reliable order pipeline with DLX.

**Prerequisites:** understanding of exchange/queue/binding, `basic.publish` / `basic.consume`, ack/nack, vhost, and the Management UI.

**Local:** [`deploy/rabbitmq`](../../deploy/rabbitmq/README.md).

## Course environment

| Mode | Compose | When |
|-------|---------|--------|
| Single node (DLX, TTL, confirms, monitoring) | `docker compose up -d` | chapters 03–10, final project is fine on single |
| 3-node cluster (quorum HA) | `docker compose -f docker-compose.cluster.yml up -d` + [`init-cluster.sh`](../../deploy/rabbitmq/scripts/init-cluster.sh) | chapters 01–02, optional for quorum in production |

```bash
cd deploy/rabbitmq
docker compose up -d
docker compose ps
```

| Service | URL / port |
|--------|------------|
| AMQP | `amqp://course:course@localhost:5672/` |
| Management UI | [http://localhost:15672](http://localhost:15672) — `course` / `course` |
| Prometheus metrics | [http://localhost:15692/metrics](http://localhost:15692/metrics) |

**Cluster (optional):**

```bash
docker compose -f docker-compose.cluster.yml up -d
bash scripts/init-cluster.sh
```

| Node | AMQP | UI |
|------|------|-----|
| rabbitmq-1 | 5672 | 15672 |
| rabbitmq-2 | 5673 | 15673 |
| rabbitmq-3 | 5674 | 15674 |

On a **single node**, quorum queues are declared for lab exercises (without replica fault tolerance) — the basic compose is enough.

Before switching environments: `docker compose down` (and cluster compose), otherwise you'll get a port conflict.

## How to read the chapters

1. **Theory** (01, 03, 05…) — a scenario from the field, the mechanism, common mistakes.
2. **Lab** (02, 04…) — commands against the running environment, checked against "what you'll see".
3. Compare queue JSON arguments against the examples in [`deploy/rabbitmq/examples`](../../deploy/rabbitmq/examples/) and in the course [`examples/`](examples/).

**Time:** ~**50–65 minutes** per "theory + lab" pair; the [final project](12-final-project.md) — **3–4 hours**.

## Curriculum (6 topics + final)

| # | Theory | Lab |
|---|--------|------|
| 1 | [Quorum queues](01-quorum-queues.md) | [02](02-lab-quorum.md) |
| 2 | [Dead Letter Exchange](03-dead-letter-exchange.md) | [04](04-lab-dlx.md) |
| 3 | [TTL and priority](05-ttl-priority.md) | [06](06-lab-ttl-dlx-chain.md) |
| 4 | [Publisher confirms](07-publisher-confirms.md) | [08](08-lab-confirms.md) |
| 5 | [Monitoring](09-monitoring.md) | [10](10-lab-management-drill.md) |
| 6 | [Managed: Amazon MQ](11-managed-cloud.md) | — |
| 7 | [Final project](12-final-project.md) | |

## What you should end up with

- Declaring **`x-queue-type=quorum`**, understanding the difference from classic mirrored and when a **cluster** is required.
- Building **DLX → DLQ**, wiring it to [`dlx-policy.json`](../../deploy/rabbitmq/examples/dlx-policy.json).
- Configuring **TTL** (message / queue) and **priority**, combining them with DLX.
- Enabling **publisher confirms** and handling `basic.nack` / timeout.
- Reading the **Management API**, **rabbitmqctl**, and **Prometheus** metrics on `:15692`.
- Comparing against **[SQS DLQ](../aws-intermediate/07-sqs-dlq.md)** and **[Kafka delivery semantics](../kafka-intermediate/09-delivery-semantics.md)**.
- Designing an **order pipeline** with DLX in the final project.

## Course examples

| Path | Purpose |
|------|------------|
| [`examples/quorum-queue-declare.json`](examples/quorum-queue-declare.json) | declaring a quorum queue (Management API) |
| [`examples/dlx-setup.sh`](examples/dlx-setup.sh) | exchange/queue/binding for the DLX lab |
| [`deploy/rabbitmq/examples/dlx-policy.json`](../../deploy/rabbitmq/examples/dlx-policy.json) | DLX arguments for the work queue |

## Related courses

| Course | Relation |
|------|-------|
| [kafka-intermediate](../kafka-intermediate/README.md) | replication, at-least-once, lag vs queue depth |
| [kafka-intermediate/09-delivery-semantics.md](../kafka-intermediate/09-delivery-semantics.md) | confirms ≈ acks, consumer idempotency |
| [aws-intermediate/07-sqs-dlq.md](../aws-intermediate/07-sqs-dlq.md) | DLQ via `maxReceiveCount` vs DLX in RabbitMQ |
| [aws-intermediate/08-lab-sqs-dlq.md](../aws-intermediate/08-lab-sqs-dlq.md) | poison message lab in SQS |
| [aws-basic/09-messaging.md](../aws-basic/09-messaging.md) | SNS/SQS overview |
| [observability-intermediate](../observability-intermediate/README.md) | Prometheus + Grafana for DLQ depth alerts |

## Environment smoke test

```bash
cd deploy/rabbitmq
bash scripts/smoke.sh
# Windows: .\scripts\smoke.ps1
```
