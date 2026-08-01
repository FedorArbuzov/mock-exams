# 13. Final project: order notification routing

## Intro: assembling the basics into one loop

Separately, you can do direct, fanout, topic, work queue and ack. The **finale** is an **order notification routing** scenario on [`deploy/rabbitmq`](../../deploy/rabbitmq/README.md): an order event fans out across channels (SMS, email), regional filtering (EU), audit receives **everything**, a failed payment goes to a separate queue. No new services — `rabbitmqadmin` / `rabbitmqctl` in `mock-rabbitmq`, UI **15672**, optionally [`examples/publish-consume.sh`](examples/publish-consume.sh).

## What you'll learn (course wrap-up)

- Design a **topology** of exchange + queues + bindings.
- Publish a **set of events** and verify routing with a table.
- Describe a **runbook** and consumer failure behavior (ack/requeue).

## Requirements

| # | Requirement | Criterion |
|---|------------|----------|
| 1 | Environment | `docker compose up -d`, `smoke.sh` OK |
| 2 | Topic | exchange `proj.orders.topic`, pattern `orders.#` → audit |
| 3 | Region | `orders.eu.*` → queue `proj.orders.eu.q` |
| 4 | Direct notify | exchange `proj.notify.direct`, rk `notify.sms` / `notify.email` |
| 5 | Work | queue `proj.notify.worker.q` + 3+ messages, get/ack processing |
| 6 | Events | at least 5 publishes with different rk (see scenario) |
| 7 | Document | `PROJECT.md` following the template |
| 8 | Comparison | 1 paragraph: the same scenario in Kafka — [18-vs-queues](../kafka-basic/18-vs-queues.md) |

---

## Domain scenario

The **orders** service publishes:

| routing key | Meaning |
|-------------|--------|
| `orders.eu.created` | an EU order — audit + eu queue + fanout notify |
| `orders.us.created` | a US order — audit + notify (not eu) |
| `orders.eu.payment.failed` | an EU payment error — audit + eu + the **failed** queue |
| `notify.sms` / `notify.email` | tasks in the worker (direct) |

---

## Phase 1. Environment setup

```bash
cd deploy/rabbitmq
docker compose up -d
bash scripts/smoke.sh
```

Optional:

```bash
source courses/rabbitmq-basic/examples/publish-consume.sh
rmq_smoke
```

---

## Phase 2. Topology (mandatory)

### 2.1 Topic + audit + EU

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=proj.orders.topic type=topic durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=proj.orders.audit.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=proj.orders.eu.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=proj.orders.failed.q durable=true

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=proj.orders.topic destination=proj.orders.audit.q routing_key='orders.#'
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=proj.orders.topic destination=proj.orders.eu.q routing_key='orders.eu.*'
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=proj.orders.topic destination=proj.orders.failed.q routing_key='orders.*.payment.failed'
```

### 2.2 Fanout notify (after order.created)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=proj.orders.fanout type=fanout durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=proj.orders.notify.fanout.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=proj.orders.fanout destination=proj.orders.notify.fanout.q
```

*(In real code a separate service reads the fanout and publishes to `proj.notify.direct`; in the project it's enough to **document** this step in PROJECT.md.)*

### 2.3 Direct notify + worker

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=proj.notify.direct type=direct durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=proj.notify.sms.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=proj.notify.email.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=proj.notify.worker.q durable=true

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=proj.notify.direct destination=proj.notify.sms.q routing_key=notify.sms
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=proj.notify.direct destination=proj.notify.email.q routing_key=notify.email
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=proj.notify.direct destination=proj.notify.worker.q routing_key=notify.task
```

---

## Phase 3. Publishing events

```bash
# EU created
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=proj.orders.topic routing_key=orders.eu.created \
  payload='{"order_id":1001,"region":"eu"}'

# US created
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=proj.orders.topic routing_key=orders.us.created \
  payload='{"order_id":1002,"region":"us"}'

# EU payment failed
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=proj.orders.topic routing_key=orders.eu.payment.failed \
  payload='{"order_id":1001,"error":"card_declined"}'

# Fanout (simulating post-create)
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=proj.orders.fanout routing_key=x payload='{"order_id":1001,"step":"notify"}'

# Direct tasks
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=proj.notify.direct routing_key=notify.sms payload='{"order_id":1001,"text":"SMS"}'
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=proj.notify.direct routing_key=notify.email payload='{"order_id":1001,"text":"Email"}'
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=proj.notify.direct routing_key=notify.task payload='{"order_id":1001,"job":"render"}'
```

Verification:

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep proj.
```

Fill in the table in `PROJECT.md` (expected minimums):

| queue | expected msg (guideline) |
|-------|--------------------------|
| `proj.orders.audit.q` | ≥ 3 |
| `proj.orders.eu.q` | ≥ 2 |
| `proj.orders.failed.q` | ≥ 1 |
| `proj.notify.sms.q` | 1 |

---

## Phase 4. Consumers (emulation)

Process the **worker queue** with `ack_requeue_false` until it's empty. Get one message from `proj.orders.eu.q` with `ack_requeue_true` and repeat — record the redelivery in the report.

---

## Phase 5. Runbook (template)

In `PROJECT.md`, a **Runbook: messages don't arrive** section:

1. **Symptom:** depth is growing, consumers = 0.
2. **UI:** Exchanges → bindings; does the routing key match?
3. **CLI:** `list_bindings`, `list_queues`.
4. **Unroutable:** publish with a wrong rk — 0 in the target queue.
5. **Poison:** reject without requeue / DLX (intermediate).
6. **Escalation:** a screenshot of the topology + an example payload.

---

## PROJECT.md template

```markdown
# RabbitMQ Basic — Final Project

## Author / date

## Environment
- compose, container mock-rabbitmq
- credentials course/course (lab only)

## Topology (diagram or list)
- proj.orders.topic → …
- proj.notify.direct → …

## Routing matrix
| publish rk | audit | eu | failed | sms | … |
|------------|-------|-----|--------|-----|---|

## Events (publish log)
- order_id 1001 …

## Ack / retry
- example ack_requeue_true

## Runbook
- (insert the section)

## Kafka comparison
- topic + groups vs exchanges + queues

## Conclusions
- 3 bullets
```

---

## Grading criteria (self-check)

- [ ] All exchanges/queues from phase 2 are created
- [ ] The routing table is filled in and matches `list_queues`
- [ ] Topic: `orders.us.created` **not** in `proj.orders.eu.q`
- [ ] `orders.eu.payment.failed` in audit and failed
- [ ] The worker queue is processed with ack
- [ ] The runbook is readable without verbal explanations
- [ ] A link to [`deploy/rabbitmq/README.md`](../../deploy/rabbitmq/README.md)

## Next

- [`rabbitmq-intermediate`](../rabbitmq-intermediate/README.md) — DLX, quorum, federation
- [kafka-basic/18](../kafka-basic/18-vs-queues.md) — broker comparison
- [aws-intermediate/07-sqs-dlq](../aws-intermediate/07-sqs-dlq.md) — queues in AWS

Congratulations on completing **RabbitMQ — Basic**.
