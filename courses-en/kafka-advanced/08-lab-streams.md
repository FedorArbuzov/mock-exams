# 08. Lab: Kafka Streams — concepts and kcat pipeline simulation

## Lab goal

Without a mandatory JVM cluster, **model** a Streams topology: **input → repartition by key → aggregate topic**, understand the **changelog**, and optionally read the **properties** of a standalone application. A full Streams JAR in Docker is not required.

## Prerequisites

- [07-kafka-streams](07-kafka-streams.md).
- KRaft sandbox: `cd deploy/kafka && docker compose up -d`.

---

## Task 1. Domain topics

```bash
export BS=localhost:9092

docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server $BS \
  --create --topic lab.streams.orders \
  --partitions 3 --replication-factor 1 --if-not-exists

docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server $BS \
  --create --topic lab.streams.orders.by-customer \
  --partitions 3 --replication-factor 1 --if-not-exists
```

**Scenario:** KStream `orders` → `groupBy(customerId)` → count → sink `orders.by-customer` (in Streams this is internal + output).

---

## Task 2. Produce simulation (kcat)

From the host (`key:value`):

```bash
echo 'c1:{"orderId":"o1","customerId":"c1","amount":10}' | kcat -b localhost:9094 -t lab.streams.orders -K: -P
echo 'c1:{"orderId":"o2","customerId":"c1","amount":20}' | kcat -b localhost:9094 -t lab.streams.orders -K: -P
echo 'c2:{"orderId":"o3","customerId":"c2","amount":5}'  | kcat -b localhost:9094 -t lab.streams.orders -K: -P
```

**Why the key `c1`:** all events for customer c1 will land in **one partition** — like `groupByKey` in Streams.

---

## Task 3. "Manual aggregator" (console consumer)

Until there is a Streams app, count manually or with a script. To understand partition stickiness:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server $BS \
  --topic lab.streams.orders \
  --from-beginning \
  --property print.key=true \
  --timeout-ms 8000
```

Write down: partition 0/1/2 for each key.

---

## Task 4. Write the "aggregation result" (sink simulation)

```bash
echo 'c1:{"customerId":"c1","count":2,"sum":30}' | kcat -b localhost:9094 -t lab.streams.orders.by-customer -K: -P
echo 'c2:{"customerId":"c2","count":1,"sum":5}'  | kcat -b localhost:9094 -t lab.streams.orders.by-customer -K: -P
```

In a real Streams changelog topic, the name would be something like `my-app-customer-count-changelog`.

---

## Task 5. Optional — Streams app properties

Create a local file `streams-app.properties` (don't commit secrets):

```properties
application.id=lab-streams-count-v1
bootstrap.servers=localhost:9094
default.key.serde=org.apache.kafka.common.serialization.Serdes$StringSerde
default.value.serde=org.apache.kafka.common.serialization.Serdes$StringSerde
processing.guarantee=at_least_once
num.stream.threads=1
state.dir=/tmp/kafka-streams
```

| Property | Meaning |
|----------|--------|
| `application.id` | consumer group + prefix for internal topics |
| `processing.guarantee` | `at_least_once` vs `exactly_once_v2` |
| `state.dir` | RocksDB local path |
| `num.stream.threads` | parallelism inside the process |

**In the interview:** changing `application.id` → new state, not a continuation of the old one.

Example topology (pseudocode to map onto the lab):

```java
KStream<String, String> orders = builder.stream("lab.streams.orders");
orders.groupByKey()
      .count(Materialized.as("customer-count"))
      .toStream()
      .to("lab.streams.orders.by-customer");
```

---

## Task 6. Internal topics (observation)

After starting a **real** Streams application (outside this lab), run:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server $BS --list | grep -E 'lab-streams|changelog|repartition'
```

In this lab the list may be empty — the goal is to know **what to look for**.

---

## Success criteria

- [ ] Created input/output topics, sent keyed events.
- [ ] Explained why a key matters in `groupBy`.
- [ ] Filled in the properties table and the role of `application.id`.
- [ ] Named the two internal topic types (changelog, repartition).

**Next:** [09-ksql-flink](09-ksql-flink.md).
