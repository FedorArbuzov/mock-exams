# 12. Lab: read_committed (conceptual)

## Lab goal

Without mandatory Java code, understand the **contract** of a transactional write and **`isolation.level=read_committed`**: what happens on an open / commit / abort of a transaction and how to verify it on the stand via the **documentation**, the **internal topics**, and (optionally) a sample application.

## Prerequisites

- [11. Transactions](11-transactions-eos.md).
- The cluster is running.

> **Note:** `kafka-console-producer` is not intended for full transactions. This lab is about **operational and architectural** understanding; if you wish, reproduce it in a small Java main with `KafkaProducer`.

---

## Task 1. Internal transaction topics

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 --list | grep -E 'transaction|__transaction'
```

**What you'll see:** `__transaction_state` (the name may differ slightly by version) — RF=3 on the cluster.

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic __transaction_state 2>/dev/null | head -5
```

---

## Task 2. Scenario table (in writing)

Fill this in for yourself:

| Step | Producer | Consumer `read_uncommitted` | Consumer `read_committed` |
|-----|----------|---------------------------|---------------------------|
| begin + send, txn open | — | sees it? | sees it? |
| commit txn | — | | |
| begin + send + **abort** | — | | |

**Answers:** open — an uncommitted reader sees uncommitted data; committed — only after commit; abort — a committed reader doesn't see the aborted batch.

---

## Task 3. Client properties (checklist)

Copy the minimal set into `txn-notes.md`:

**Producer**

```properties
enable.idempotence=true
acks=all
transactional.id=lab-read-committed-1
```

**Consumer**

```properties
isolation.level=read_committed
enable.auto.commit=false
```

---

## Task 4. (Optional) Java mini-demo

Pseudocode of the stages:

1. Create topic `lab.txn.demo` RF=3.
2. Producer: `initTransactions`, `beginTransaction`, send 2 records, do **not** commit.
3. Consumer A `read_uncommitted` — sees 2 records.
4. Consumer B `read_committed` — does **not** see them (or waits).
5. `commitTransaction` — after poll, B sees 2.
6. A new txn + `abortTransaction` — B doesn't see the aborted data.

---

## Task 5. Kafka UI

Consumer Groups → if there's a transactional consumer, look at the lag. Topics → `lab.txn.demo` — messages appear after commit.

---

## Task 6. Link with EOS

In 5 sentences: why an **idempotent producer** is necessary but **not sufficient** for an "atomic read-process-write" without a **transaction** or **Streams**.

---

## Success criteria

- [ ] You found the **transaction state** topic on the cluster.
- [ ] You filled in the open/commit/abort scenario table.
- [ ] You listed the producer/consumer properties for read_committed.
- [ ] You explained the boundary of EOS **within Kafka** vs an external DB.

**Next:** [13. Schema Registry](13-schema-registry.md) — switch the stand to [`docker-compose.extras.yml`](../../deploy/kafka/docker-compose.extras.yml).
