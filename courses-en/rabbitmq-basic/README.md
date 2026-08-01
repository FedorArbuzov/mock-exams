# RabbitMQ — Basic

Basic level: **why RabbitMQ**, **exchange / queue / binding**, **work queues**, **fanout**, **direct and topic routing**, **ack and prefetch**, **comparison with Kafka and SQS**, **a mini-project for routing order notifications**.

**Prerequisites:** basic Linux and Docker ([`linux-basic`](../linux-basic/README.md) or [`linux-intermediate`](../linux-intermediate/README.md) — `docker compose`, `docker exec`, terminal). It helps to complete [kafka-basic](../kafka-basic/README.md) (log vs queue) or at least [18-vs-queues](../kafka-basic/18-vs-queues.md).

**Locally:** [`deploy/rabbitmq`](../../deploy/rabbitmq/README.md) — `docker compose up -d`, from the host:

| Service | URL / port |
|--------|------------|
| AMQP | `localhost:5672` (`amqp://course:course@localhost:5672/`) |
| Management UI | [http://localhost:15672](http://localhost:15672) — `course` / `course` |
| Prometheus metrics | `http://localhost:15692/metrics` (optional) |

CLI inside the **`mock-rabbitmq`** container: `rabbitmqctl`, `rabbitmqadmin -u course -p course …`.

Smoke: `bash scripts/smoke.sh` in `deploy/rabbitmq`. Snippets: [`examples/publish-consume.sh`](examples/publish-consume.sh).

**Next:** [`rabbitmq-intermediate`](../rabbitmq-intermediate/README.md) (DLX, quorum, federation). Broker comparison: [messaging-deep](../messaging-deep/README.md) (full track) or [kafka-basic/18](../kafka-basic/18-vs-queues.md) (brief). AWS queues: [aws-intermediate/07-sqs-dlq](../aws-intermediate/07-sqs-dlq.md).

## How to read the chapters

Each lesson is a **book chapter**, not a cheat sheet. Recommended order within a pair:

1. Read the **theory** (01, 02, 04…) — don't skip the "common mistakes".
2. Open the **lab** (03, 05…) with the environment up via `docker compose up -d` in `deploy/rabbitmq`.
3. Complete the tasks **by number**; compare the output with the "what you'll see" block.
4. If the broker doesn't respond — [`deploy/rabbitmq/README.md`](../../deploy/rabbitmq/README.md) (healthcheck, `ACCESS_REFUSED`, binding).

**Theory structure:** intro (a scenario from work) → what you'll learn → concepts → example on the environment → mistakes → in production → summary → checklist.

**Lab structure:** goal → prerequisites → tasks 1…N (why / commands / what you'll see) → success criteria.

**Time:** about **40–50 minutes** for a "theory + lab" pair; the [final project](13-final-project.md) — **2–3 hours**.

**Connection cheat sheet:**

| From | Address |
|--------|--------|
| AMQP from the host | `amqp://course:course@localhost:5672/` |
| Management UI | [localhost:15672](http://localhost:15672) |
| Inside the Docker network | `amqp://course:course@rabbitmq:5672/` |
| `rabbitmqadmin` / `rabbitmqctl` | `docker exec mock-rabbitmq …` |

## Curriculum

### Basics (01–03)

1. [Why RabbitMQ: queues, Kafka, SQS](01-why-rabbitmq.md)
2. [Architecture: broker, exchange, queue, binding](02-architecture.md)
3. [Lab: first queue and binding](03-lab-first-queue.md)

### Work queues (04–05)

4. [Work queues: competing consumers](04-work-queues.md) · 5. [Lab: work queue](05-lab-work-queue.md)

### Pub/Sub (06–07)

6. [Pub/Sub: fanout exchange](06-pubsub-fanout.md) · 7. [Lab: fanout](07-lab-fanout.md)

### Routing (08–09)

8. [Routing: direct and topic](08-routing-direct-topic.md) · 9. [Lab: direct and topic](09-lab-routing.md)

### Reliability (10–11)

10. [Ack, nack and prefetch](10-ack-prefetch.md) · 11. [Lab: ack and nack](11-lab-ack-nack.md)

### Comparison and finale (12–13)

12. [RabbitMQ vs Kafka vs SQS (interview)](12-vs-kafka-sqs.md)
13. [Final project: order notifications](13-final-project.md)

## What you should end up with

- You explain **when RabbitMQ**, and when **Kafka** or **SQS** (with a reference to [kafka-basic/18](../kafka-basic/18-vs-queues.md)).
- You declare an **exchange**, **queue**, **binding** and publish with a **routing key**.
- You build a **work queue** with multiple consumers and understand **round-robin**.
- You use **fanout** to broadcast a single event to multiple queues.
- You route via **direct** and **topic** (`*` and `#`).
- You configure **manual ack**, **nack/requeue** and **prefetch**.
- You assemble **notification routing** for an order (the final project).

## Examples

| Path | Purpose |
|------|------------|
| [`examples/publish-consume.sh`](examples/publish-consume.sh) | publish/get functions for the labs (source from bash) |
