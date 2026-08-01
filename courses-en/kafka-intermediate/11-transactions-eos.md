# 11. Transactions and EOS: read_committed

## Intro: "the consumer saw a half-written batch"

A transactional producer writes messages within a **transaction**; until **commit** they are **invisible** to a `read_committed` consumer. On **abort** — it's as if the batch never happened (for an isolated reader). This is the basis of **exactly-once** between Kafka topics in Streams and in consume-transform-produce chains.

## What you'll learn

- **transactional.id**, producer epochs.
- **Commit** / **abort** of a transaction.
- **`isolation.level=read_committed`**.
- **Control messages** (transaction markers).
- The transaction log and RF on the cluster.
- Limitations: only Kafka clients that support the API.

---

## Transactional producer

```properties
enable.idempotence=true
transactional.id=my-service-1   # unique in the cluster, stable across restarts
```

Life cycle:

1. `initTransactions()`
2. `beginTransaction()`
3. `send()` …
4. `commitTransaction()` or `abortTransaction()`

**Fence:** a new producer with the same `transactional.id` "pushes out" the old one — protection against a zombie writer after a long GC pause.

## What the consumer sees

| isolation.level | Behavior |
|-----------------|-----------|
| `read_uncommitted` (default) | all messages, including open txn |
| `read_committed` | only after txn commit; waits for an open txn until timeout |

For EOS a downstream consumer on a "clean" topic usually uses **`read_committed`**.

## Multiple topics

A single transaction can write to **several partitions** atomically (within Kafka). The **consume-transform-produce** pattern in Kafka Streams uses this for EOS.

## Transaction state log

The internal topic `__transaction_state` — on the cluster compose it's **RF=3**, **min ISR=2**. Without this, transactions won't survive a broker failure.

## read_committed and lag

A consumer can "get stuck" on an open transaction (a hung producer) until `transaction.max.timeout.ms` — an operational risk.

## On the stand (conceptually)

A full transactional produce in `kafka-console-producer` is **limited**. Lab 12 is a **concept** + reading the docs and the UI; for code — Java `KafkaProducer` with a `transactional.id`.

Example properties (for reference):

```properties
transactional.id=lab-txn-1
enable.idempotence=true
acks=all
```

Consumer:

```properties
isolation.level=read_committed
```

## Common mistakes

| Mistake | Cause |
|--------|---------|
| Forgot `read_committed` | the consumer sees uncommitted data / duplicates on abort |
| Changing `transactional.id` every deploy | unnecessary fencing, epoch confusion |
| Transactions on the hot path without need | latency, operational complexity |
| Writing to the DB and Kafka without outbox | EOS only in Kafka, not end-to-end |

## In production

- EOS where there's **Kafka Streams** or a strict CTP pipeline.
- For "Kafka + PostgreSQL" the **outbox pattern** is often simpler than Kafka transactions.
- Monitoring: `transaction-coordinator` metrics, aborted transaction rate.

## Summary

Kafka transactions are **isolation of writes in the log**; **read_committed** is a filter on reads. End-to-end exactly-once across microservices is a separate engineering project.

## Checklist

- [ ] You know the role of `transactional.id`.
- [ ] You can explain `read_committed` vs `read_uncommitted`.
- [ ] You understand fencing a zombie producer.

**Next:** [12. Lab: read_committed](12-lab-read-committed.md) (conceptual).
