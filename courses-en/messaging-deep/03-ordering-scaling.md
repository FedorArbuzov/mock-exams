# 03. Ordering, keys, scaling consumption

## Intro

"We need strict ordering of all orders" — at 50k RPS that means **one** consumer. Ordering is **always** paid for. The question is: **by which key** do you need it.

---

## Kafka: partition key

```text
key = order_id → all of the order's events go to one partition → ordering within the order
```

| Partition | Consumers in group | Parallelism |
|-----------|------------------|-------------|
| N | up to N | max N concurrent |

To increase throughput → **more partitions**, not "more messages into one".

---

## Rabbit: a single queue

**FIFO** ordering within a single queue. Scale-out → **multiple consumers** on a queue → ordering is **not guaranteed** globally.

**Consistent hash exchange** — shard by key across multiple queues.

---

## SQS

| Type | Ordering | Throughput |
|-----|---------|------------|
| Standard | best-effort | very high |
| FIFO | strict per MessageGroupId | 300 msg/s (without batch) |

`MessageGroupId` = the analog of a partition key.

---

## Redis Streams

Consumer group: messages in stream ID order; **multiple** consumers share the stream through pending entries.

Suitable for **moderate** throughput, not for a petabyte log.

---

## Hot partition / hot key

One key → one partition → bottleneck. Solutions:

- sub-keys (shard order_id);
- async aggregation;
- separate out the "hot" path.

---

## Summary

Ordering = **scope by key**. Scale = **more shards** (partition, queue, group id).

---

## Checklist

- [ ] What is the ordering key for an order?
- [ ] How many partitions do you need with 10 consumers?
- [ ] Is FIFO SQS enough for your RPS?

**Next:** [04. Kafka](04-kafka.md).
