# 24. Лаба: alter topic и partitions

## Цель лабы

Создать topic, изменить **retention** и **min.insync.replicas**, увеличить **partition count**, проверить **describe** и produce/consume после alter.

## Предварительно

- [23. Операции](23-operations.md).

---

## Задание 1. Создать topic

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.alter.demo \
  --partitions 3 --replication-factor 3
```

---

## Задание 2. Alter retention

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server kafka-1:9092 \
  --entity-type topics --entity-name lab.alter.demo \
  --alter --add-config retention.ms=3600000

docker exec mock-kafka-1 /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server kafka-1:9092 \
  --entity-type topics --entity-name lab.alter.demo \
  --describe
```

**Что увидите:** `retention.ms=3600000` (1 час).

---

## Задание 3. Topic-level min.insync.replicas

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server kafka-1:9092 \
  --entity-type topics --entity-name lab.alter.demo \
  --alter --add-config min.insync.replicas=2
```

---

## Задание 4. Увеличить partitions 3 → 6

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --alter --topic lab.alter.demo --partitions 6

docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.alter.demo
```

**Что увидите:** partition 0–5; RF=3 на каждой.

---

## Задание 5. Produce после alter

```bash
for i in $(seq 1 30); do
  printf 'k%d|after-alter-%s\n' "$((i % 6))" "$i"
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.alter.demo \
  --producer-property acks=all \
  --property parse.key=true --property key.separator='|'
```

Consumer с новой группой — сообщения распределены по **6** partition.

---

## Задание 6. (Опционально) Rolling одного брокера

```bash
docker stop mock-kafka-3
sleep 15
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 --describe --topic lab.alter.demo | head -8
docker start mock-kafka-3
```

**Что увидите:** кратковременный shift leader; после start ISR восстанавливается.

---

## Критерии успеха

- [ ] retention и min.insync.replicas в **describe configs**.
- [ ] **6** partition после alter.
- [ ] Produce/consume после изменений работает.
- [ ] Кратко: почему старые сообщения **не** переехали в новые partition.

**Дальше:** [25. Strimzi](25-strimzi-k8s.md).
