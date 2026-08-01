# 21. Capacity: partitions, throughput, hot keys

## Intro: "we increased partitions — it got worse"

The team bumped partitions from 6 to 48 "for speed", and p99 went up: more file descriptors, heavier rebalance, and **one hot key** still loads a single partition. Capacity planning for Kafka isn't a linear "more partitions = faster".

## What you'll learn

- How **partitions** affect consumer parallelism.
- **Hot partition** / hot key.
- Throughput: **batch**, **compression**, **disk**, **network**.
- The upper bounds on partitions per cluster (orders of magnitude).
- When to **add brokers** rather than partitions.

---

## Partitions and parallelism

The maximum number of consumers in a group actually doing work = the **number of partitions** of the topic (for that topic).

| Partitions | Consumers (max useful) |
|------------|----------------------------|
| 6 | 6 |
| 6 | 10 → 4 idle |

**Rule:** partitions ≥ peak consumer parallelism; don't make 1000 without need.

## Hot key

One key (`userId=1` celebrity) → **one** partition → higher disk and CPU on a single broker.

Symptoms:

- Lag only on **partition N**.
- Leader broker N — high **BytesInPerSec** on the topic.

Mitigations:

- Change the key (add salt, a sub-key) — breaks per-entity ordering.
- **Burst** into a separate topic.
- Asynchronous aggregation.

## Broker limits (guidelines)

They depend on hardware; for planning:

- Tens of TB per cluster — normal with tiered storage (advanced).
- **Partition count** per cluster: thousands — fine, tens of thousands — needs calculation.
- `num.network.threads`, `num.io.threads` — tuning for the load.

## Disk

Sequential writes are Kafka's strength; **random reads** during a catch-up consumer load the disk.

- `retention.ms` / `retention.bytes` — the size.
- **Compression** on the producer — less IO.

## Network

Cross-AZ traffic with RF=3: every write is replicated **across AZs** — count on **×2–3** traffic.

## Producer vs consumer bound

| Bottleneck | Sign |
|-------------|---------|
| Producer | broker `RequestHandler` busy, little consumer lag |
| Consumer | lag grows, broker idle |
| Disk | high IO wait, slow fetch |

## On the stand

Lab [22](22-lab-hot-partition.md) — skew by key.

## Common mistakes

| Mistake | Cause |
|--------|---------|
| partitions = 1 on high load | no parallelism |
| partitions = 1000 "for growth" | rebalance/coordinator overhead |
| Ignoring a hot key | scaling consumers doesn't help |
| RF=3 without a network budget | cloud bills |

## In production

- Load test (kafka-producer-perf-test / end-to-end).
- Dashboard skew: max(partition size) / avg.
- Policy: a new topic — justify the partition count.

## Summary

Capacity is a balance of **partitions, keys, brokers, disk**; a hot partition is fixed by **key design**, not only hardware.

## Checklist

- [ ] You linked partition count and consumer parallelism.
- [ ] You explained a hot key.
- [ ] You named RF and the network multiplier.

**Next:** [22. Lab: hot partition](22-lab-hot-partition.md).
