# 04. Lab: producer tuning on the cluster

## Lab goal

Create a topic, compare produce with different **`linger.ms`** (qualitatively, via consumer lag by delivery time), enable **`compression`**, send a volume of records, and check **segment size** / throughput in the UI.

## Prerequisites

- [03. Producer tuning](03-producer-tuning.md).
- The `docker-compose.cluster.yml` cluster is running.

---

## Task 1. Topic

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.producer.tune \
  --partitions 3 --replication-factor 3
```

---

## Task 2. The "fast" producer (linger=0)

A shell script (1000 messages):

```bash
for i in $(seq 1 1000); do
  printf 'key-%s|%s\n' "$((i % 3))" "payload-$i"
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.producer.tune \
  --producer-property acks=all \
  --producer-property linger.ms=0 \
  --producer-property batch.size=16384 \
  --property parse.key=true --property key.separator='|'
```

Time the loop's execution (or use `time` in bash).

---

## Task 3. The "batching" producer (linger=50)

Repeat with a different topic so as not to mix things up:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.producer.tune.linger \
  --partitions 3 --replication-factor 3

for i in $(seq 1 1000); do
  printf 'key-%s|%s\n' "$((i % 3))" "payload-$i"
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.producer.tune.linger \
  --producer-property acks=all \
  --producer-property linger.ms=50 \
  --producer-property batch.size=65536 \
  --property parse.key=true --property key.separator='|'
```

**What you'll see:** often **linger=50** produces fewer small requests — wall-clock time may be comparable or slightly faster per batch; on a small volume the difference is small — the point of the lab is the **mechanism**, not the benchmark.

---

## Task 4. Compression

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.producer.compress \
  --partitions 3 --replication-factor 3 \
  --config compression.type=producer

# repeating payload — compresses well
for i in $(seq 1 500); do
  printf 'k1|%s\n' "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.producer.compress \
  --producer-property compression.type=lz4 \
  --producer-property acks=all
```

In Kafka UI → topic → look at **size** / segments (qualitatively: lz4 reduces bytes on disk).

---

## Task 5. Check the distribution across partitions

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.producer.tune \
  --from-beginning --timeout-ms 3000 \
  --property print.partition=true \
  --property print.key=true
```

**What you'll see:** keys `key-0`, `key-1`, `key-2` land in **different** partitions consistently.

---

## Success criteria

- [ ] Three topics created with **RF=3**.
- [ ] Produce with **acks=all** without errors on a healthy cluster.
- [ ] You explained why **linger** and **batch.size** exist, and named the latency/throughput trade-off.
- [ ] You sent a batch with **lz4** and noted the compression effect on repeating data.

**Next:** [05. Consumer tuning](05-consumer-tuning.md).
