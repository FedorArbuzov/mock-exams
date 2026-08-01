# Kafka — Basic

Basic level: **why Kafka**, **topics and partitions**, **producer/consumer**, **retention**, **serialization**, **patterns**, **lag and CLI**.

**Prerequisites:** basic Linux and Docker ([`linux-basic`](../linux-basic/README.md) or [`linux-intermediate`](../linux-intermediate/README.md) — `docker compose` and a terminal are enough).

**Locally:** [`deploy/kafka`](../../deploy/kafka/README.md) — `docker compose up -d`, bootstrap from the host: **`localhost:9094`**, Kafka UI: [http://localhost:8080](http://localhost:8080).

**Next:** [`kafka-intermediate`](../kafka-intermediate/README.md) (replication, Schema Registry, Connect), [`kafka-advanced`](../kafka-advanced/README.md).

## How to read the chapters

Each lesson is a **book chapter**, not a cheat sheet. Recommended order within a pair:

1. Read the **theory** (01, 02, 04…) — don’t skip the intro and “common mistakes”.
2. Open the **lab** (03-lab, 05-lab…) with the stand up via `docker compose up -d` in `deploy/kafka`.
3. Complete tasks **in order**; compare output with the “what you’ll see” block.
4. If something doesn’t match — [`deploy/kafka/README.md`](../../deploy/kafka/README.md) (healthcheck, ports, consumer group).

**Theory structure:** intro (workplace scenario) → what you’ll learn → concepts → stand example → mistakes → in production → summary → checklist.

**Lab structure:** goal → prerequisites → tasks 1…N (why / commands / what you’ll see) → success criteria.

**Time:** about **40–50 minutes** per “theory + lab” pair; [final project](19-final-project.md) — **2–3 hours**.

**Connection cheat sheet:**

| From | Bootstrap |
|------|-----------|
| Host (kcat, IDE) | `localhost:9094` |
| Inside `mock-kafka` | `localhost:9092` |
| Kafka UI | inside compose: `kafka:9092` |

CLI in the container: `/opt/kafka/bin/kafka-*.sh` (see labs).

## Curriculum

### Fundamentals (01–03)

1. [Why Kafka](01-why-kafka.md)
2. [Architecture: broker, topic, partition](02-architecture.md)
3. [Lab: first topic](03-lab-first-topic.md)

### Producer / Consumer (04–07)

4. [Producer: key, acks](04-producer.md) · 5. [Lab: producer and keys](05-lab-producer.md)
6. [Consumer: poll, group, offset](06-consumer.md) · 7. [Lab: consumer group](07-lab-consumer.md)

### Storage and data (08–11)

8. [Retention and segments](08-retention.md) · 9. [Lab: retention](09-lab-retention.md)
10. [Serialization and Schema Registry](10-serialization.md) · 11. [Lab: JSON events](11-lab-serialization.md)

### Patterns and reliability (12–15)

12. [Patterns: event, log aggregation](12-patterns.md) · 13. [Lab: mini pipeline](13-lab-pipeline.md)
14. [Failures: rebalance, duplicates, lag](14-failures.md) · 15. [Lab: consumer lag](15-lab-lag.md)

### Operations and comparison (16–19)

16. [CLI: topics, groups](16-cli.md) · 17. [Lab: describe and offsets](17-lab-cli.md)
18. [Kafka vs RabbitMQ vs SQS](18-vs-queues.md)
19. [Final project](19-final-project.md)

## What you should end up with

- Explain how an **event log** differs from a **task queue**.
- Create a topic, write and read messages via CLI and kcat.
- Understand **partition**, **offset**, **consumer group**, and **lag**.
- Configure short **retention** and send **JSON events**.
- Build a simple **pipeline** of two topics and diagnose via **Kafka UI** and CLI.

## Examples

| Path | Purpose |
|------|---------|
| [`examples/events/order-created.json`](examples/events/order-created.json) | sample domain event for labs 11 and 19 |
