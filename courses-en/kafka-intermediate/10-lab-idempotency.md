# 10. Lab: duplicates on retry and idempotent processing

## Lab goal

Model **at-least-once** (re-sending the same event), show **duplicates** on the consumer side, and "fix" it with a training **dedup table** (file/memory), and explain that an **idempotent producer** solves duplicates **in the log**, not in your DB.

## Prerequisites

- [09. Delivery semantics](09-delivery-semantics.md).

---

## Task 1. Topic

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.idempotency \
  --partitions 3 --replication-factor 3
```

---

## Task 2. The "duplicating" producer

Send the **same** business event three times (imitating a retry without idempotence):

```bash
for _ in 1 2 3; do
  printf 'order-42|{"eventId":"evt-001","orderId":"order-42","amount":99}\n'
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.idempotency \
  --producer-property acks=all \
  --property parse.key=true --property key.separator='|'
```

---

## Task 3. Consumer without dedup

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.idempotency \
  --group lab-idem-naive \
  --from-beginning --timeout-ms 5000
```

**What you'll see:** **three** identical JSONs — a naive handler would charge 99 three times.

---

## Task 4. Dedup by eventId (a training script)

Create a file `processed.txt` (empty) on the host. Pseudo-logic when reading each line:

1. Parse the `eventId`.
2. If `eventId` is already in `processed.txt` — **skip**.
3. Otherwise — "apply the payment", append `eventId` to the file.

Run this manually for the three lines from task 3.

**What you'll see:** actual processing **once**, despite three records in the log.

---

## Task 5. Idempotent producer (concept)

In Java/Kotlin:

```properties
enable.idempotence=true
acks=all
```

On a **network retry** of the same record the broker will keep **one** copy in the partition. Repeat **task 2** in an application with idempotence (optional) — there's one record in the log.

On the CLI without code: note in your report the difference between a **duplicate in the log** vs a **duplicate in the DB**.

---

## Task 6. A new consumer group — three messages again

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.idempotency \
  --group lab-idem-fresh \
  --from-beginning --timeout-ms 5000
```

**What you'll see:** three lines again — the dedup file protects only **your** process; a new group reads the log from scratch.

---

## Success criteria

- [ ] You showed **three** records in the topic from the "retry".
- [ ] You implemented **dedup by eventId** manually.
- [ ] You explained: an idempotent producer ≠ idempotency **downstream**.
- [ ] You understand why a **unique eventId** in the event contract exists.

**Next:** [11. Transactions](11-transactions-eos.md).
