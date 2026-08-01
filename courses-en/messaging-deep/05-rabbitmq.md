# 05. RabbitMQ: exchanges, routing, DLX

## Intro

RabbitMQ is an **AMQP message broker** with flexible **routing**. It's ideal when a message is a **task** or a **command**, not an eternal fact for analytics.

[rabbitmq-basic/12](../rabbitmq-basic/12-vs-kafka-sqs.md) — a quick comparison; practice — [`deploy/rabbitmq`](../../deploy/rabbitmq/README.md).

---

## Exchanges

| Type | Routing |
|-----|---------------|
| **direct** | routing key = binding key |
| **fanout** | to all queues |
| **topic** | pattern `orders.*.created` |
| **headers** | by headers |

```text
publisher → exchange → bindings → queues → consumers
```

---

## When Rabbit — yes

- **Work queue** + prefetch + competing consumers.
- **Complex routing** without code in the consumer.
- **TTL**, **priority**, **per-message** DLX.
- **RPC** (reply-to + correlation_id).
- On-prem / multi-cloud without AWS lock-in.

---

## When Rabbit — no

- A new service reads a **month of history**.
- A single **petabyte** event lake.
- The team **doesn't want** to operate an Erlang cluster → SQS/MSK managed.

---

## Quorum queues (production)

Classic mirrors are being deprecated; **quorum queues** — RAFT, better durability.

[rabbitmq-intermediate](../rabbitmq-intermediate/README.md).

---

## Publisher confirms + consumer ack

| Stage | Guarantee |
|------|----------|
| confirm | the broker accepted it |
| manual ack | the consumer finished |

Both are needed for a reliable chain.

---

## Summary

Rabbit is a **Swiss Army knife of routing** for task messages. It does not replace Kafka's **event log**.

---

## Checklist

- [ ] Which exchange type for EU/US notifications?
- [ ] Is a DLX configured?
- [ ] Quorum or classic?

**Next:** [06. SQS](06-sqs.md).
