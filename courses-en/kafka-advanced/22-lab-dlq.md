# 22. Lab: DLQ — poison message and replay

## Goal

Model a **poison message**: a main topic, a DLQ topic, a manual "failed" record, and a **replay** into the main stream with an **idempotency key** check.

## Prerequisites

- [21-poison-dlq-replay](21-poison-dlq-replay.md).
- `deploy/kafka`, `docker compose up -d`.

---

## Task 1. Topics

```bash
BS=localhost:9092

for T in lab.orders.events lab.orders.events.dlq; do
  docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
    --bootstrap-server $BS \
    --create --topic $T --partitions 3 --replication-factor 1 --if-not-exists
done
```

---

## Task 2. "Good" and poison events

Format: `eventId|json` (key = eventId via kcat).

```bash
echo 'e1:{"eventId":"e1","orderId":"o1","amount":100}' | kcat -b localhost:9094 -t lab.orders.events -K: -P
echo 'e2:{"eventId":"e2","orderId":"o2","amount":-1}'  | kcat -b localhost:9094 -t lab.orders.events -K: -P
echo 'e3:{"eventId":"e3","orderId":"o3","amount":50}'  | kcat -b localhost:9094 -t lab.orders.events -K: -P
```

**Consumer rule (simulation):** `amount < 0` → poison.

---

## Task 3. Move the poison to the DLQ (manually)

Read e2 and write it to the DLQ with metadata in the payload:

```bash
echo 'e2:{"eventId":"e2","orderId":"o2","amount":-1,"_dlq":{"reason":"negative_amount","source":"lab.orders.events"}}' \
  | kcat -b localhost:9094 -t lab.orders.events.dlq -K: -P
```

In production the **error handler** does this automatically.

---

## Task 4. Consume only the "good" ones

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server $BS \
  --topic lab.orders.events \
  --from-beginning \
  --property print.key=true \
  --timeout-ms 6000
```

Note: e2 is still in the main topic (it isn't removed automatically). **Strategies:**

- **seek** past the poison;
- or a **transactional** skip;
- or a compacted tombstone (rare).

Discuss it in the interview.

---

## Task 5. Fix and replay

The corrected event:

```bash
echo 'e2:{"eventId":"e2","orderId":"o2","amount":99}' | kcat -b localhost:9094 -t lab.orders.events -K: -P
```

**Idempotency:** downstream stores `processed_eventIds`. A repeated replay of e1 must **not** double the side effect.

Table (tabletop):

| eventId | First process | Replay | Result |
|---------|----------------|--------|-----------|
| e1 | OK | skip | OK |
| e2 | fail → DLQ | OK after fix | OK once |

---

## Task 6. Consume the DLQ (audit)

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server $BS \
  --topic lab.orders.events.dlq \
  --from-beginning --timeout-ms 5000
```

---

## Success criteria

- [ ] Created main + DLQ topics.
- [ ] Sent a poison message, placed a copy in the DLQ with a reason.
- [ ] Replayed the corrected e2.
- [ ] Explained idempotency on replay.

**Next:** [23-capstone](23-capstone.md).
