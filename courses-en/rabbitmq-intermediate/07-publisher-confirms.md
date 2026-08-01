# 07. Publisher confirms: reliable publishing

## Intro: "the API returned 200, but the order never appeared in the queue"

The HTTP client got a timeout from your API, even though the service did call `basic.publish` — but the broker crashed before writing to disk, or the channel closed with a **flow control** error. Without confirmation from the broker, the producer lives in the illusion of **at-most-once**. **Publisher confirms** are a mechanism where RabbitMQ asynchronously (or synchronously in a batch) tells you the message was **accepted** or **rejected**.

The Kafka analog is **`acks=all`** and the `RecordMetadata` response ([producer tuning](../kafka-intermediate/03-producer-tuning.md)); in SQS — a successful `SendMessage` response (managed guarantees inside AWS).

## What you'll learn

- The **confirm.select** mode on a channel.
- **`basic.ack`** / **`basic.nack`** from the broker to the publisher (confirm callback).
- Correlation with the **delivery tag** and batch publish.
- The relationship with **mandatory** and **returns** (unroutable messages).
- Handling timeouts and producer retries.

---

## Enabling confirms

On an AMQP channel:

```python
ch.confirm_delivery()
# or low-level: channel.confirm_select()
```

After `publish`, the broker sends:

- **Ack confirm** — the message was written (for persistent — to disk according to policy).
- **Nack confirm** — not accepted (rare; resources, policy).

In **pika** / **amqp-client** — the `on_ack` / `on_nack` callbacks with a `delivery_tag`.

## Persistent messages

```python
properties=pika.BasicProperties(delivery_mode=2)
```

Without `delivery_mode=2`, a confirm means acceptance into RAM; on a crash, loss is possible — like `acks=1` without replication to all ISR in Kafka.

## Mandatory and returns

| Flag | Meaning |
|------|--------|
| `mandatory=true` | if there's no queue for the routing key — **return** to the publisher |
| confirms | the broker accepted it for routing / queueing |

For a reliable loop: **confirms + mandatory + handling basic.return** (or guaranteed bindings).

## Semantics

| Config | Publish semantics |
|--------|-------------------|
| fire-and-forget | at-most-once |
| confirms + persistent + quorum/classic durable | at-least-once on the broker ingest side |
| duplicate publish on retry | duplicates at the consumer → idempotency |

See [Kafka delivery semantics](../kafka-intermediate/09-delivery-semantics.md): confirms don't replace an idempotent consumer.

## Producer retries

On `nack` or timeout:

1. Exponential backoff.
2. Attempt limit → **log + alert** (not infinitely).
3. Optionally the **outbox pattern** in the DB: first record the "event", then a separate relay to RabbitMQ.

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| Confirms on a shared channel without tracking the tag | ack confusion |
| Not waiting for confirms at process exit | loss of the last publishes |
| Ignoring `basic.return` with mandatory | silent drop |
| Treating a confirm as processed-by-consumer | it's only ingest into the broker |

## In production

- Enable confirms on all critical publishers (orders, payments).
- Metrics: nack rate, confirm latency ([chapter 09](09-monitoring.md)).
- Load test: on a **memory alarm** the broker blocks publishers — you need backpressure on the API.

## Summary

Publisher confirms are the minimal "the broker accepted the message" contract. Paired with durable, DLX, and an idempotent consumer, they build a reliable pipeline.

## Checklist

- How does a confirm differ from a consumer ack?
- Why `delivery_mode=2`?
- What does `mandatory` do?
- The analog in Kafka?

Next lesson: [08-lab-confirms.md](08-lab-confirms.md).
