# 07. Лаба: два consumer в одной группе

## Цель лабы

Запустить **два** consumer с **одним** `group.id` на topic с несколькими partition — увидеть **разделение** partition. Затем добавить третий consumer и наблюдать **rebalance** (в логах / UI).

## Предварительно

- Стенд Kafka running.
- Пройдены [03](03-lab-first-topic.md) и [06. Consumer](06-consumer.md).

---

## Задание 1. Topic с 3 partition

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.cg-demo \
  --partitions 3 --replication-factor 1 \
  --if-not-exists
```

Наполните topic (без key — распределение по partition):

```bash
for i in $(seq 1 12); do
  echo "msg-$i" | docker exec -i mock-kafka \
    /opt/kafka/bin/kafka-console-producer.sh \
    --bootstrap-server localhost:9092 \
    --topic lab.cg-demo
done
```

---

## Задание 2. Первый consumer группы `lab-workers`

**Терминал 1** (оставьте работать):

```bash
docker exec -it mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.cg-demo \
  --group lab-workers \
  --from-beginning \
  --property print.partition=true \
  --property print.consumer.group=true
```

**Что увидите:** все 12 сообщений (первый запуск группы) с разными `partition=0|1|2`.

Остановите **Ctrl+C**.

---

## Задание 3. Два consumer параллельно

Сбросьте группу для чистого эксперимента (опционально):

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group lab-workers --reset-offsets \
  --to-earliest --topic lab.cg-demo --execute
```

**Терминал 1:**

```bash
docker exec -it mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.cg-demo \
  --group lab-workers \
  --property print.partition=true \
  --property print.consumer.id=true
```

**Терминал 2** — та же команда.

Добавьте **новые** сообщения:

```bash
for i in $(seq 13 18); do
  echo "msg-$i" | docker exec -i mock-kafka \
    /opt/kafka/bin/kafka-console-producer.sh \
    --bootstrap-server localhost:9092 \
    --topic lab.cg-demo
done
```

**Что увидите:** каждый терминал получает **часть** partition (не обязательно поровну сообщений). В выводе разные `consumer.id`.

---

## Задание 4. Describe группы

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group lab-workers --describe
```

**Что увидите:** таблица `PARTITION`, `CURRENT-OFFSET`, `LOG-END-OFFSET`, `LAG` (если есть данные).

| PARTITION | CONSUMER-ID | LAG |
|-----------|-------------|-----|
| 0 | … | 0 |
| 1 | … | 0 |
| 2 | … | 0 |

---

## Задание 5. Третий consumer (лишний)

Запустите **третий** терминал с той же группой.

**Что увидите:** один consumer **idle** (0 partition) — правило: partition ≥ consumers в группе не назначаются «вдвоём».

Остановите лишний терминал.

---

## Критерии успеха

- [ ] Topic `lab.cg-demo` с 3 partition и ≥12 сообщений
- [ ] Два параллельных consumer в группе `lab-workers` оба получали сообщения
- [ ] `--describe` показывает назначение partition по consumer
- [ ] Третий consumer не увеличил параллелизм выше 3 partition

## Что унести в работу

- Масштаб чтения ≤ числа **partition**.
- `kafka-consumer-groups.sh --describe` — первый инструмент при «очередь копится».

Следующий урок: [08. Retention](08-retention.md).
