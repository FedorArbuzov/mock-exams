# 03. Lab: KRaft — metadata, broker API, cluster describe

## Lab goal

On the **KRaft** sandbox, confirm the cluster is in **ZooKeeper-free** mode, read **broker / cluster** info via the CLI, create a topic, and connect the `describe` output to the theory in [01-internals](01-internals.md) and [02-kraft](02-kraft.md).

## Prerequisites

- [`02-kraft`](02-kraft.md) has been read.
- Sandbox:

```bash
cd deploy/kafka
docker compose up -d
docker compose ps
```

`mock-kafka` → **healthy**. Bootstrap **inside the container:** `localhost:9092`. From the host: `localhost:9094`.

---

## Task 1. Verify ZK is absent

**Why:** to distinguish the compose profiles.

```bash
docker compose ps
docker ps --filter name=zookeeper
```

**What you'll see:** only `mock-kafka`, `mock-kafka-ui` (names may differ by compose version). **No** `mock-zookeeper`.

For comparison later: [05-lab-zookeeper](05-lab-zookeeper.md) brings up `docker-compose.zk.yml`.

---

## Task 2. Broker API versions

**Why:** in interviews they sometimes ask about client compatibility.

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-broker-api-versions.sh \
  --bootstrap-server localhost:9092
```

**What you'll see:** a long list of API keys and min/max versions for broker `1`.

---

## Task 3. Cluster ID and describe cluster

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-cluster.sh \
  --bootstrap-server localhost:9092 describe
```

**What you'll see:** `Cluster ID`, the list of brokers, the **controller** node id (often the same `1` in single-node).

Note it down: **Controller:** `N` — this is the active controller for metadata.

---

## Task 4. Topic with RF=1 and log dirs

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.kraft.meta \
  --partitions 3 --replication-factor 1 \
  --if-not-exists

docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --describe --topic lab.kraft.meta
```

**What you'll see:** three partitions, `Leader: 1`, `Replicas: 1`, `Isr: 1`.

---

## Task 5. Config source (topic-level)

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name lab.kraft.meta --describe
```

**What you'll see:** inherited broker defaults (retention, compression, …).

Change retention for practice:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --alter --entity-type topics --entity-name lab.kraft.meta \
  --add-config retention.ms=3600000
```

Repeat `--describe` — a **DYNAMIC_TOPIC_CONFIG** will appear.

---

## Task 6. (Optional) Three-broker KRaft

If the machine has ≥ 4 GB RAM:

```bash
docker compose down
docker compose -f docker-compose.cluster.yml up -d
```

Create a topic with `RF=3`:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.kraft.ha \
  --partitions 6 --replication-factor 3

docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.kraft.ha
```

**What you'll see:** leaders distributed across `1/2/3`, ISR with three replicas.

Return to single-node: `docker compose -f docker-compose.cluster.yml down` and `docker compose up -d`.

---

## Success criteria

- [ ] Confirmed KRaft (no ZK in the default compose).
- [ ] Read `kafka-cluster.sh describe` and the controller's node id.
- [ ] Created a topic, explained the `Leader` / `Isr` line.
- [ ] Changed a dynamic topic config.

## If it doesn't work

| Symptom | Action |
|---------|----------|
| Connection refused | `docker compose logs kafka`, wait for healthy |
| Cluster describe is empty | bootstrap `localhost:9092` **inside** exec |
| RF=3 error | is `docker-compose.cluster.yml` up? |

**Next:** [04-zookeeper-legacy](04-zookeeper-legacy.md).
