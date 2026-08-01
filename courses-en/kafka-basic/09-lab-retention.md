# 09. Lab: short retention

## Lab goal

Create a topic with **retention 60 seconds**, write messages, confirm that after a pause **old** records are unavailable with `--from-beginning` (within delete policy).

## Prerequisites

- Stand [`deploy/kafka`](../../deploy/kafka/README.md) healthy.
- Theory [08. Retention](08-retention.md) read.

> On a single-broker stand segment deletion can take **up to 1–2 minutes** (log cleaner interval). If the experiment “didn’t work” in 60 s — wait 120 s and retry the consumer.

---

## Task 1. Topic with retention.ms=60000

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.short-retention \
  --partitions 1 --replication-factor 1 \
  --config retention.ms=60000 \
  --if-not-exists

docker exec mock-kafka /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name lab.short-retention --describe
```

**What you’ll see:** `retention.ms=60000`.

---

## Task 2. Write timestamps

```bash
for i in 1 2 3; do
  echo "batch-1-msg-$i-$(date -u +%H:%M:%S)" | docker exec -i mock-kafka \
    /opt/kafka/bin/kafka-console-producer.sh \
    --bootstrap-server localhost:9092 \
    --topic lab.short-retention
done
```

Check immediately:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.short-retention \
  --from-beginning --timeout-ms 5000
```

**What you’ll see:** 3 messages `batch-1-*`.

---

## Task 3. Pause and a new batch

Wait **90 seconds** (phone timer).

```bash
echo "batch-2-only-$(date -u +%H:%M:%S)" | docker exec -i mock-kafka \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.short-retention
```

---

## Task 4. Consumer from the start of the log

New group so offsets don’t confuse you:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.short-retention \
  --group lab-retention-test \
  --from-beginning \
  --timeout-ms 8000
```

**What you’ll see (expected):** only `batch-2-only-…` or empty + batch-2 — **without** `batch-1-*` (if retention and cleaner ran).

**If you still see batch-1:** wait another 60 s, retry consumer with a new group:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group lab-retention-test --delete
```

---

## Task 5. Alter retention (optional)

Shorten to 10 s for a repeat experiment:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name lab.short-retention \
  --alter --add-config retention.ms=10000
```

---

## Success criteria

- [ ] Topic `lab.short-retention` with `retention.ms=60000`
- [ ] Right after batch-1 the consumer saw 3 messages
- [ ] After a pause ≥90 s `--from-beginning` does **not** show batch-1 (or only batch-2)
- [ ] You understand that consumer lag does not “save” deleted segments

## Takeaways for work

- Retention is set on the **topic**, not the consumer.
- For training topics — short retention so you don’t fill the disk.

Next lesson: [10. Serialization](10-serialization.md).
