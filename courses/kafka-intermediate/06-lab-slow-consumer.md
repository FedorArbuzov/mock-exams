# 06. Лаба: медленный consumer и lag

## Цель лабы

Нагрузить topic, запустить consumer с **малым** `max.poll.interval.ms` (симуляция «долгой обработки» через паузу в скрипте — опционально) или проще: один consumer на **много** сообщений и второй consumer в группе — увидеть **lag** и поведение **consumer group**.

## Предварительно

- [05. Consumer tuning](05-consumer-tuning.md).

---

## Задание 1. Topic и заливка

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.slow.consumer \
  --partitions 6 --replication-factor 3

for i in $(seq 1 2000); do
  printf 'ord-%04d|event-%s\n' "$((i % 50))" "$i"
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.slow.consumer \
  --producer-property acks=all \
  --property parse.key=true --property key.separator='|'
```

---

## Задание 2. Consumer «медленный» (один в группе)

Терминал A — читайте с маленьким `max.poll.records` и без auto-commit (ручной режим через properties):

```bash
docker exec -it mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.slow.consumer \
  --group lab-slow-g1 \
  --consumer-property max.poll.records=10 \
  --consumer-property enable.auto.commit=true
```

Прервите через несколько секунд (**Ctrl+C**) — часть сообщений обработана.

---

## Задание 3. Lag через CLI

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --group lab-slow-g1
```

**Что увидите:** колонки **CURRENT-OFFSET**, **LOG-END-OFFSET**, **LAG** по partition; LAG > 0 на необработанных.

---

## Задание 4. Второй consumer в группе

Терминал B:

```bash
docker exec -it mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.slow.consumer \
  --group lab-slow-g1 \
  --consumer-property max.poll.records=500
```

**Что увидите:** **rebalance** — partition поделились между consumer'ами; суммарный lag падает быстрее.

Снова describe group:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --group lab-slow-g1
```

---

## Задание 5. Догнать lag до нуля

Дождитесь, пока оба consumer обработают хвост (или остановите один, второй дочитает). LAG по всем partition = **0**.

---

## Задание 6. (Опционально) max.poll.interval

В приложении на Java/Kotlin при обработке > `max.poll.interval.ms` получите `CommitFailedException` / исключение из poll. На CLI это не воспроизводится — запишите в отчёт: **долгая обработка без poll → исключение из группы**.

---

## Критерии успеха

- [ ] **2000** сообщений в topic, RF=3.
- [ ] `kafka-consumer-groups --describe` показывал **LAG > 0**, затем **0**.
- [ ] При добавлении второго consumer в **ту же группу** partition перераспределились.
- [ ] Связали lag с **скоростью обработки** и числом consumer в группе.

**Дальше:** [07. Rebalance](07-rebalance.md).
