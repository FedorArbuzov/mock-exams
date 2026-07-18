# 08. Лаба: rebalance в consumer group

## Цель лабы

Наблюдать **перераспределение partition** при добавлении и удалении consumer в одной группе на кластере; зафиксировать **generation** и назначение partition в CLI/UI.

## Предварительно

- [07. Rebalance](07-rebalance.md).

---

## Задание 1. Подготовка topic

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.rebalance \
  --partitions 6 --replication-factor 3

for i in $(seq 1 100); do printf 'k%d|m%d\n' $((i%6)) $i; done | \
  docker exec -i mock-kafka-1 /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 --topic lab.rebalance \
  --property parse.key=true --property key.separator='|'
```

---

## Задание 2. Один consumer

Терминал A:

```bash
docker exec -it mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.rebalance \
  --group lab-rebalance-g1 \
  --consumer-property partition.assignment.strategy=org.apache.kafka.clients.consumer.StickyAssignor
```

В другом окне:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --group lab-rebalance-g1 --members --verbose
```

**Что увидите:** один **consumer-id**, ему назначены **все 6** partition (CONSUMER-ID, HOST, PARTITION).

---

## Задание 3. Второй consumer — rebalance

Терминал B (та же группа):

```bash
docker exec -it mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.rebalance \
  --group lab-rebalance-g1
```

Снова `--describe --members --verbose`.

**Что увидите:** **два** consumer; partition **разделились** (~3 и ~3); **GENERATION** вырос.

---

## Задание 4. Остановить consumer B

Ctrl+C в терминале B, подождите 5–10 с, снова describe.

**Что увидите:** все partition снова у consumer A; ещё один **rebalance**.

---

## Задание 5. Kafka UI

Откройте [http://localhost:8080](http://localhost:8080) → Consumer Groups → `lab-rebalance-g1`.

**Что увидите:** members, lag, assigned partitions — сверка с CLI.

---

## Задание 6. Отчёт (3 пункта)

1. Сколько partition было у каждого member при двух consumer?
2. Что произошло с **committed offset** при уходе B (прочитайте describe — offset не откатывается)?
3. Почему без **idempotent** обработчика возможны дубли при rebalance?

---

## Критерии успеха

- [ ] Видели **generation** ↑ при join/leave.
- [ ] Partition перераспределились между 1 и 2 consumer.
- [ ] Ответили на три пункта отчёта.

**Дальше:** [09. Семантики доставки](09-delivery-semantics.md).
