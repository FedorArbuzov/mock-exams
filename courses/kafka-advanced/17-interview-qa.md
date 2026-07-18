# 17. Interview Q&A — топ-30 вопросов с ответами

Формат: **вопрос** → **короткий ответ** (30 с) → **deep dive** (2–3 мин). Полная таблица: [`interview-cheatsheet.md`](interview-cheatsheet.md).

---

## Архитектура и хранение

### 1. Чем Kafka отличается от RabbitMQ?

**Коротко:** Kafka — distributed **commit log** с retention; Rabbit — **smart broker** с очередями и ack per message.

**Deep dive:** Kafka consumers pull, replay, share load через partition; Rabbit routing exchanges, TTL, DLX. Kafka для event streaming и analytics; Rabbit для task queues и complex routing.

### 2. Что такое partition и зачем key?

**Коротко:** Partition — упорядоченный лог; key выбирает partition для порядка по сущности.

**Deep dive:** `hash(key) % N`; без key — round-robin. Масштаб consumer ≤ число partition. Hot partition если один key доминирует.

### 3. Что такое offset?

**Коротко:** Позиция записи в partition; consumer commit хранит прогресс.

**Deep dive:** Offset per partition, не global. `__consumer_offsets` compacted topic. Reset policy `earliest`/`latest` при новой группе.

### 4. Leader и ISR?

**Коротко:** Leader обслуживает read/write; ISR — реплики, догнавшие leader.

**Deep dive:** Producer `acks=all` ждёт ISR. Follower выпал — shrink ISR. URP если replica отстаёт. Election только из ISR (clean).

### 5. Что в сегменте log?

**Коротко:** `.log` + `.index` + `.timeindex`; закрытые сегменты удаляются/compaction.

**Deep dive:** Active segment append-only; roll по размеру/времени. Fetch использует index. Tiered storage offloads closed segments ([06](06-tiered-storage.md)).

---

## Producer / Consumer

### 6. acks=0, 1, all?

**Коротко:** 0 — fire-and-forget; 1 — leader; all — ISR ack.

**Deep dive:** С `min.insync.replicas=2` и `acks=all` — strongest durability; latency выше. `acks=1` риск потери при crash leader до replicate.

### 7. Идемпотентный producer?

**Коротко:** PID + sequence — broker dedupe в рамках partition.

**Deep dive:** Включить `enable.idempotence=true`; требует `acks=all`, retries>0. Не заменяет transactional consume-process-produce.

### 8. Consumer rebalance?

**Коротко:** Перераспределение partition при join/leave группы.

**Deep dive:** Stop-the-world в eager; cooperative-sticky меньше движения. Static `group.instance.id` уменьшает churn. Rebalance → дубли если commit после обработки.

### 9. At-least-once vs exactly-once?

**Коротко:** At-least-once + idempotent sink; EOS — transactions Kafka.

**Deep dive:** EOS: read-process-write в одной transaction (Streams, transactional producer). External DB нужен idempotency key.

### 10. Consumer lag?

**Коротко:** `logEndOffset - committedOffset` per partition.

**Deep dive:** Lag рост — медленные consumers или мало partition. Не путать с replication lag follower.

---

## KRaft / ZK / Ops

### 11. KRaft vs ZooKeeper?

**Коротко:** KRaft хранит metadata в Kafka quorum; ZK — отдельный ensemble (legacy).

**Deep dive:** Меньше компонентов, Kafka 4.x без ZK. Миграция — controlled project ([02](02-kraft.md), [04](04-zookeeper-legacy.md)).

### 12. Что делает controller?

**Коротко:** Назначает partition leaders, следит за ISR, reassignment.

**Deep dive:** Active controller один; KRaft — через metadata log. Controller overload при 100k+ partition.

### 13. Under-replicated partition?

**Коротко:** Реплика не в ISR или отстаёт.

**Deep dive:** Stop broker, disk slow, network. Fix broker, preferred leader election, reassignment ([15](15-troubleshooting.md)).

### 14. unclean.leader.election?

**Коротко:** Выбор leader вне ISR — риск **потери данных**, availability ↑.

**Deep dive:** Default false в prod. Использовать только с явным policy DR.

### 15. Как выбрать число partition?

**Коротко:** Целевой parallelism + throughput per partition; не тысячи без нужды.

**Deep dive:** Upper bound по consumers; re-partition возможен но меняет key order paths. Metadata overhead на broker.

---

## Streams / Ecosystem

### 16. Kafka Streams vs Flink?

**Коротко:** Streams — library в JVM app; Flink — distributed cluster для scale/CEP.

**Deep dive:** [09](09-ksql-flink.md). Flink event time, checkpoints S3. Streams проще ops для малых топологий.

### 17. KTable vs KStream?

**Коротко:** Stream — события; Table — last value per key (changelog).

**Deep dive:** Join stream-table; GlobalKTable для broadcast. State в RocksDB + changelog.

### 18. Schema Registry зачем?

**Коротко:** Совместимость Avro/Protobuf/JSON schema; центральный контракт.

**Deep dive:** BACKWARD/FULL compatibility; с breaking change — новая schema version. См. kafka-intermediate.

### 19. Kafka Connect?

**Коротко:** Framework source/sink connectors к внешним системам.

**Deep dive:** Worker cluster, offsets в internal topics. MM2 — Connect based ([10](10-multi-dc.md)).

### 20. MirrorMaker 2?

**Коротко:** Репликация между **кластерами**, не между брокерами одного кластера.

**Deep dive:** Offset sync, heartbeats, `sourceCluster.topic` naming. Active-active needs conflict resolution.

---

## Security / Cloud

### 21. Как защитить Kafka в prod?

**Коротко:** TLS + SASL/mTLS + ACL deny default + audit.

**Deep dive:** [13](13-security-advanced.md). Separate principals per service. MSK IAM.

### 22. MSK vs self-hosted?

**Коротко:** MSK снимает broker patching; вы — topics, ACL, clients.

**Deep dive:** [11](11-managed-kafka.md). Cost at scale, VPC integration.

### 23. Tiered storage?

**Коротко:** Cold segments в S3; hot tail локально.

**Deep dive:** [06](06-tiered-storage.md). Historical fetch latency ↑.

---

## Design / Reliability

### 24. Как спроектировать ordering?

**Коротко:** Same key → same partition; глобальный порядок — одна partition (не масштабируется).

**Deep dive:** Multi-region — нет global order без single writer.

### 25. DLQ pattern?

**Коротко:** Poison message → dead-letter topic; fix → replay.

**Deep dive:** [21](21-poison-dlq-replay.md). Idempotent replay.

### 26. Retention vs compaction?

**Коротко:** Delete by time/size vs keep last key.

**Deep dive:** `__consumer_offsets` compacted. changelog topics для Streams.

### 27. max.message.bytes vs performance?

**Коротко:** Большие сообщения — плохо; используйте reference storage (S3).

**Deep dive:** Align producer, broker, consumer fetch sizes. Batch compression zstd.

### 28. Почему не stretch cluster на 2 DC?

**Коротко:** Latency FSYNC и split-brain риск; два кластера + MM2.

**Deep dive:** [10](10-multi-dc.md).

### 29. Hot partition симптомы?

**Коротко:** Один broker CPU/disk выше; один partition lag.

**Deep dive:** Salt keys, больше partition, изменить partitioning logic.

### 30. Вопрос кандидату: спроектируйте event bus 50k events/s

**Коротко:** Ingress, partition count, RF=3, min ISR, Schema Registry, monitoring lag/URP, DLQ.

**Deep dive:** [19](19-system-design.md). Separate clusters per env. Capacity plan brokers + disk. Avoid giant messages.

---

**Практика:** [18-lab-mock-interview](18-lab-mock-interview.md) · **Шпаргалка:** [interview-cheatsheet](interview-cheatsheet.md).
