# 05. Lab: ZooKeeper mode — docker-compose.zk.yml

## Lab goal

Bring up the **legacy** Kafka + ZooKeeper stack from [`deploy/kafka/docker-compose.zk.yml`](../../deploy/kafka/docker-compose.zk.yml), compare the bootstrap and UI with the KRaft profile, perform basic operations, and **shut down the profile cleanly**.

## Prerequisites

- [04-zookeeper-legacy](04-zookeeper-legacy.md).
- Ports **2181**, **9092**, **8080** are free.
- Stop the default KRaft if it's occupying 8080/9094:

```bash
cd deploy/kafka
docker compose down
```

---

## Task 1. Bring up the ZK profile

```bash
cd deploy/kafka
docker compose -f docker-compose.zk.yml up -d
docker compose -f docker-compose.zk.yml ps
```

**What you'll see:** `mock-zookeeper`, `mock-kafka-zk`, `mock-kafka-ui-zk`.

| Service | Port from host |
|--------|----------------|
| ZooKeeper | 2181 |
| Kafka | **9092** (not 9094) |
| Kafka UI | 8080 |

---

## Task 2. Smoke: list topics

```bash
docker exec mock-kafka-zk kafka-topics.sh \
  --bootstrap-server localhost:9092 --list
```

If `kafka-topics.sh` is not in PATH (Confluent image):

```bash
docker exec mock-kafka-zk bash -c \
  'kafka-topics --bootstrap-server localhost:9092 --list 2>/dev/null || \
   /usr/bin/kafka-topics --bootstrap-server localhost:9092 --list'
```

**What you'll see:** an empty list or internal topics.

From the host (kcat):

```bash
kcat -b localhost:9092 -L
```

---

## Task 3. Create a topic and produce

```bash
docker exec mock-kafka-zk kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.zk.legacy \
  --partitions 3 --replication-factor 1

docker exec -it mock-kafka-zk kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.zk.legacy
```

Type `msg-1`, `msg-2`, Ctrl+D.

```bash
docker exec mock-kafka-zk kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.zk.legacy --from-beginning --timeout-ms 5000
```

---

## Task 4. ZK four-letter words (optional)

```bash
docker exec mock-zookeeper bash -c 'echo ruok | nc localhost 2181'
docker exec mock-zookeeper bash -c 'echo stat | nc localhost 2181'
```

**What you'll see:** `ruok` → `imok`; `stat` — the `leader`/`follower` mode, connections.

**In the interview:** disable four-letter words in prod (`whitelist`).

---

## Task 5. Comparison with KRaft (notes)

Fill in the table in your notebook:

| | KRaft (`docker compose up`) | ZK (`docker-compose.zk.yml`) |
|--|----------------------------|------------------------------|
| Bootstrap from host | 9094 | 9092 |
| Kafka container | mock-kafka | mock-kafka-zk |
| Third component | none | ZooKeeper |
| Image | apache-kafka / bitnami (see compose) | Confluent cp-kafka |

---

## Task 6. Shutdown and return

```bash
docker compose -f docker-compose.zk.yml down
docker compose up -d
```

**Why:** the next advanced/intermediate labs expect KRaft on **9094**.

---

## Success criteria

- [ ] Brought up ZK + Kafka, created a topic, read the messages.
- [ ] Explained the difference between port 9092 vs 9094.
- [ ] Stopped the ZK profile, restored the default compose.

## If it doesn't work

| Symptom | Solution |
|---------|---------|
| Kafka won't start | `docker compose -f docker-compose.zk.yml logs kafka` — wait for `zookeeper:2181` |
| Port 8080 busy | stop the other compose |
| `kafka-topics.sh` not found | use `kafka-topics` without `.sh` in the Confluent image |

**Next:** [06-tiered-storage](06-tiered-storage.md).
