# 11. Lab: JSON events

## Lab goal

Send a **domain event** from file [`order-created.json`](examples/events/order-created.json), read it and change `schemaVersion` / `orderId` — see that the contract is **your** responsibility.

## Prerequisites

- Kafka stand up.
- [10. Serialization](10-serialization.md).

---

## Task 1. Topic for orders

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic orders.events \
  --partitions 3 --replication-factor 1 \
  --if-not-exists
```

---

## Task 2. Produce with key = orderId

**Why:** all events for one order in one partition.

From the **repo root** (Git Bash / WSL / Linux):

```bash
printf '%s\n' "ord-10042|$(cat courses/kafka-basic/examples/events/order-created.json)" | \
  docker exec -i mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.events \
  --property parse.key=true \
  --property key.separator='|'
```

> Line format: `orderId|{...json in one line...}`. In PowerShell: read the file and paste into the string `ord-10042|...` manually.

---

## Task 3. Consume and check fields

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.events \
  --from-beginning \
  --property print.key=true \
  --property print.partition=true \
  --timeout-ms 8000
```

**What you’ll see:** key `ord-10042`, JSON with `eventType":"order.created"`, `totalCents":4599`.

---

## Task 4. Second event “paid”

Create minimal JSON (manually or `echo`):

```bash
printf '%s\n' 'ord-10042|{"eventType":"order.paid","eventId":"evt-paid-1","occurredAt":"2026-05-18T14:35:00Z","schemaVersion":1,"order":{"orderId":"ord-10042","status":"PAID"}}' | \
  docker exec -i mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.events \
  --property parse.key=true \
  --property key.separator='|'
```

Consumer with `--from-beginning` — **both** events in **one** partition.

---

## Task 5. “Breaking” change (thought experiment)

Send an event where `totalCents` is the string `"4599"` (as in the task — one producer line):

```bash
printf '%s\n' 'ord-10043|{"eventType":"order.created","eventId":"evt-bad-1","schemaVersion":2,"order":{"orderId":"ord-10043","totalCents":"4599"}}' | \
  docker exec -i mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.events \
  --property parse.key=true \
  --property key.separator='|'
```

**Why:** in consumer code `int(totalCents)` will crash — an argument for Schema Registry.

---

## Success criteria

- [ ] Event from `order-created.json` in topic `orders.events`
- [ ] Key matches `orderId`, both `ord-10042` events in one partition
- [ ] Consumer read valid JSON with `eventType` and `eventId`
- [ ] You understand the risk of `schemaVersion:2` with string `totalCents`

## Takeaways for work

- Keep **sample events** in `examples/events/` next to the course.
- Key = aggregate id (`orderId`).

Next lesson: [12. Patterns](12-patterns.md).
