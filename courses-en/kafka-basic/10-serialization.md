# 10. Serialization: JSON and why Schema Registry

## Intro: “the amount field became a string”

**Billing** expects JSON `{"amount": 100}`. **Checkout** shipped a version with `"amount": "100.00"`. The consumer crashes on `int(amount)`. Without a schema **contract**, the event stream breaks quietly. In Kafka, value and key are a **byte array**; what’s inside is an agreement between teams and tools.

## What you'll learn

- **Serializer/Deserializer** in clients.
- Pros and cons of **JSON** in a topic.
- Why **Schema Registry** and Avro/Protobuf (preview for intermediate).
- Practices: **envelope**, versioning, sample events.

## Bytes on the wire

Producer:

```text
Object → Serializer → bytes → Kafka → bytes → Deserializer → Object
```

Console producer sends **UTF-8 strings** — that’s already serialization “as text”.

| Format | Pros | Cons |
|--------|------|------|
| **JSON** | readability, debugging | size, no strict schema |
| **Avro** + Registry | schema evolution, compact | Registry infrastructure |
| **Protobuf** | performance, types | codegen, Registry |
| **JSON Schema** | compromise | less common in the JVM world |

## JSON in the basic course

Enough for labs and small services:

```json
{
  "eventType": "order.created",
  "eventId": "evt-uuid",
  "occurredAt": "2026-05-18T14:32:01Z",
  "schemaVersion": 1,
  "order": { "orderId": "ord-10042", "totalCents": 4599 }
}
```

Sample in the repo: [`examples/events/order-created.json`](examples/events/order-created.json).

**Rules:**

- Required fields for idempotency: `eventId`, `eventType`.
- Schema version: `schemaVersion` or in `eventType` (`order.created.v2`).
- Dates in **ISO-8601 UTC**.
- Money in **minor units** (cents), not float.

## Envelope pattern

Wrapper around the payload:

```json
{
  "meta": { "traceId": "...", "source": "checkout" },
  "data": { "... domain ..." }
}
```

Convenient for tracing; don’t mix meta and domain without need.

## Why Schema Registry

**Problem:** producer and consumer deploy **independently**. A field was renamed — old consumers break.

**Schema Registry** (Confluent or compatible):

- stores **Avro/JSON Schema/Protobuf** with versions;
- producer writes **magic byte + schema id + payload**;
- consumer fetches the schema by id;
- **compatibility** rules: BACKWARD, FORWARD, FULL.

In [`deploy/kafka`](../../deploy/kafka/README.md) Registry is started via overlay `docker-compose.extras.yml` — **kafka-intermediate** course.

## Headers

Without changing value:

```text
content-type: application/json
traceparent: 00-abc-...
```

Kafka **headers** — separate key/value bytes; handy for tracing and routing.

## On the stand: send a JSON file

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic orders.events \
  --partitions 3 --replication-factor 1 \
  --if-not-exists
```

From the host (path to the file in the repo):

```bash
cat courses/kafka-basic/examples/events/order-created.json | \
  docker exec -i mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.events
```

Consumer:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.events \
  --from-beginning --timeout-ms 5000
```

## Common mistakes

| Mistake | Consequence | Solution |
|---------|-------------|----------|
| Float for money | 0.1 + 0.2 | integer cents |
| No `eventId` | duplicates irreversible | UUID in every event |
| Breaking change without version | consumer crash | new eventType / Avro compatibility |
| Huge JSON in a message | RecordTooLarge | object reference in S3 |
| Trust `content-type` without checks | injection | validate JSON schema |

## In production

- CI: **contract tests** (Pact, schema compatibility check).
- **Dead letter** for invalid JSON.
- PII: don’t put in Kafka what you can’t keep per retention.
- Single **event catalog** (AsyncAPI, Markdown in the repo).

## Summary

Kafka doesn’t know your JSON — only bytes. JSON is fine to start; team growth leads to **Schema Registry** and Avro/Protobuf. Contract, `eventId`, and versioning are required discipline.

## Checklist

- What is a serializer in one phrase?
- Why `eventId` with at-least-once?
- How does BACKWARD compatibility differ from FORWARD?
- Where is the `order.created` sample in the course?

Next lesson: [11. Lab: JSON events](11-lab-serialization.md).
