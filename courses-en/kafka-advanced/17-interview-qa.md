# 17. Interview Q&A — top 30 questions with answers

Format: **question** → **short answer** (30 s) → **deep dive** (2–3 min). Full table: [`interview-cheatsheet.md`](interview-cheatsheet.md).

---

## Architecture and storage

### 1. How does Kafka differ from RabbitMQ?

**Short:** Kafka is a distributed **commit log** with retention; Rabbit is a **smart broker** with queues and per-message ack.

**Deep dive:** Kafka consumers pull, replay, share load via partitions; Rabbit has routing exchanges, TTL, DLX. Kafka is for event streaming and analytics; Rabbit for task queues and complex routing.

### 2. What is a partition and why a key?

**Short:** A partition is an ordered log; the key selects the partition for ordering per entity.

**Deep dive:** `hash(key) % N`; without a key — round-robin. Consumer scale ≤ number of partitions. Hot partition if one key dominates.

### 3. What is an offset?

**Short:** The position of a record in a partition; a consumer commit stores progress.

**Deep dive:** Offset is per partition, not global. `__consumer_offsets` is a compacted topic. Reset policy `earliest`/`latest` for a new group.

### 4. Leader and ISR?

**Short:** The leader serves read/write; ISR are the replicas that have caught up to the leader.

**Deep dive:** A producer with `acks=all` waits for ISR. A follower drops out — ISR shrinks. URP if a replica lags. Election only from ISR (clean).

### 5. What's in a log segment?

**Short:** `.log` + `.index` + `.timeindex`; closed segments are deleted/compacted.

**Deep dive:** The active segment is append-only; it rolls by size/time. Fetch uses the index. Tiered storage offloads closed segments ([06](06-tiered-storage.md)).

---

## Producer / Consumer

### 6. acks=0, 1, all?

**Short:** 0 — fire-and-forget; 1 — leader; all — ISR ack.

**Deep dive:** With `min.insync.replicas=2` and `acks=all` — strongest durability; higher latency. `acks=1` risks loss on a leader crash before replication.

### 7. Idempotent producer?

**Short:** PID + sequence — broker dedupe within a partition.

**Deep dive:** Enable `enable.idempotence=true`; requires `acks=all`, retries>0. Does not replace transactional consume-process-produce.

### 8. Consumer rebalance?

**Short:** Redistribution of partitions when a group member joins/leaves.

**Deep dive:** Stop-the-world in eager; cooperative-sticky moves less. Static `group.instance.id` reduces churn. Rebalance → duplicates if commit happens after processing.

### 9. At-least-once vs exactly-once?

**Short:** At-least-once + idempotent sink; EOS — Kafka transactions.

**Deep dive:** EOS: read-process-write in a single transaction (Streams, transactional producer). An external DB needs an idempotency key.

### 10. Consumer lag?

**Short:** `logEndOffset - committedOffset` per partition.

**Deep dive:** Lag growth — slow consumers or too few partitions. Don't confuse with follower replication lag.

---

## KRaft / ZK / Ops

### 11. KRaft vs ZooKeeper?

**Short:** KRaft stores metadata in the Kafka quorum; ZK is a separate ensemble (legacy).

**Deep dive:** Fewer components, Kafka 4.x without ZK. Migration — a controlled project ([02](02-kraft.md), [04](04-zookeeper-legacy.md)).

### 12. What does the controller do?

**Short:** Assigns partition leaders, tracks ISR, reassignment.

**Deep dive:** There's one active controller; in KRaft — via the metadata log. Controller overload at 100k+ partitions.

### 13. Under-replicated partition?

**Short:** A replica is not in ISR or lags.

**Deep dive:** Stop broker, slow disk, network. Fix broker, preferred leader election, reassignment ([15](15-troubleshooting.md)).

### 14. unclean.leader.election?

**Short:** Choosing a leader outside ISR — risk of **data loss**, availability ↑.

**Deep dive:** Default false in prod. Use only with an explicit DR policy.

### 15. How do you choose the number of partitions?

**Short:** Target parallelism + throughput per partition; not thousands without need.

**Deep dive:** Upper bound by consumers; re-partition is possible but changes key ordering paths. Metadata overhead on the broker.

---

## Streams / Ecosystem

### 16. Kafka Streams vs Flink?

**Short:** Streams — a library in a JVM app; Flink — a distributed cluster for scale/CEP.

**Deep dive:** [09](09-ksql-flink.md). Flink: event time, checkpoints to S3. Streams is simpler ops for small topologies.

### 17. KTable vs KStream?

**Short:** Stream — events; Table — last value per key (changelog).

**Deep dive:** Join stream-table; GlobalKTable for broadcast. State in RocksDB + changelog.

### 18. Why the Schema Registry?

**Short:** Compatibility of Avro/Protobuf/JSON schema; a central contract.

**Deep dive:** BACKWARD/FULL compatibility; with a breaking change — a new schema version. See kafka-intermediate.

### 19. Kafka Connect?

**Short:** A framework of source/sink connectors to external systems.

**Deep dive:** A worker cluster, offsets in internal topics. MM2 is Connect-based ([10](10-multi-dc.md)).

### 20. MirrorMaker 2?

**Short:** Replication between **clusters**, not between brokers of a single cluster.

**Deep dive:** Offset sync, heartbeats, `sourceCluster.topic` naming. Active-active needs conflict resolution.

---

## Security / Cloud

### 21. How do you secure Kafka in prod?

**Short:** TLS + SASL/mTLS + ACL deny default + audit.

**Deep dive:** [13](13-security-advanced.md). Separate principals per service. MSK IAM.

### 22. MSK vs self-hosted?

**Short:** MSK removes broker patching; you handle topics, ACL, clients.

**Deep dive:** [11](11-managed-kafka.md). Cost at scale, VPC integration.

### 23. Tiered storage?

**Short:** Cold segments in S3; hot tail locally.

**Deep dive:** [06](06-tiered-storage.md). Historical fetch latency ↑.

---

## Design / Reliability

### 24. How do you design ordering?

**Short:** Same key → same partition; global ordering — a single partition (doesn't scale).

**Deep dive:** Multi-region — no global order without a single writer.

### 25. DLQ pattern?

**Short:** Poison message → dead-letter topic; fix → replay.

**Deep dive:** [21](21-poison-dlq-replay.md). Idempotent replay.

### 26. Retention vs compaction?

**Short:** Delete by time/size vs keep the last key.

**Deep dive:** `__consumer_offsets` compacted. Changelog topics for Streams.

### 27. max.message.bytes vs performance?

**Short:** Large messages are bad; use reference storage (S3).

**Deep dive:** Align producer, broker, consumer fetch sizes. Batch compression zstd.

### 28. Why not a stretch cluster across 2 DCs?

**Short:** FSYNC latency and split-brain risk; two clusters + MM2.

**Deep dive:** [10](10-multi-dc.md).

### 29. Hot partition symptoms?

**Short:** One broker's CPU/disk higher; one partition lags.

**Deep dive:** Salt keys, more partitions, change partitioning logic.

### 30. Question for the candidate: design an event bus for 50k events/s

**Short:** Ingress, partition count, RF=3, min ISR, Schema Registry, monitoring lag/URP, DLQ.

**Deep dive:** [19](19-system-design.md). Separate clusters per env. Capacity-plan brokers + disk. Avoid giant messages.

---

**Practice:** [18-lab-mock-interview](18-lab-mock-interview.md) · **Cheatsheet:** [interview-cheatsheet](interview-cheatsheet.md).
