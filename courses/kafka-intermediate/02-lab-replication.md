# 02. Лаба: репликация RF=3 и min.insync.replicas

## Цель лабы

Поднять **кластер**, создать topic с **RF=3**, убедиться в **ISR**, воспроизвести отказ одного брокера и увидеть поведение **describe** и produce с `acks=all`.

## Предварительно

- [01. Репликация](01-replication.md).
- Кластер:

```bash
cd deploy/kafka
docker compose -f docker-compose.cluster.yml up -d
```

Bootstrap: **хост** `localhost:9091,localhost:9092,localhost:9093`; **в контейнере** `kafka-1:9092`.

---

## Задание 1. Проверить кластер

```bash
docker compose -f docker-compose.cluster.yml ps
docker exec mock-kafka-1 /opt/kafka/bin/kafka-broker-api-versions.sh \
  --bootstrap-server kafka-1:9092
```

**Что увидите:** exit 0, список API версий.

---

## Задание 2. Topic с RF=3

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.replication \
  --partitions 6 --replication-factor 3

docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.replication
```

**Что увидите:** 6 partition; у каждой `Replicas: …` из трёх id; `Isr` совпадает с replicas (все синхронны).

Запишите в блокнот **Leader** для partition 0.

---

## Задание 3. Produce с подтверждением

```bash
printf 'k1|msg-1\nk2|msg-2\n' | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.replication \
  --producer-property acks=all \
  --property parse.key=true --property key.separator='|'
```

Прочитайте:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.replication \
  --from-beginning --timeout-ms 5000
```

**Что увидите:** оба сообщения.

---

## Задание 4. Остановить брокер — leader

1. Из describe partition 0 узнайте **Leader** (например `2` → контейнер `mock-kafka-2`).
2. Остановите его:

```bash
docker stop mock-kafka-2
```

3. Снова describe (подождите 10–30 с):

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.replication | head -20
```

**Что увидите:** для затронутых partition новый **Leader** на живом брокере; `Isr` без остановленного id; `Replicas` по-прежнему три id.

---

## Задание 5. min.insync.replicas (концепт на стенде)

На cluster уже `min.insync.replicas=2`. Попробуйте produce при **двух** остановленных брокерах (осторожно — только на учебном стенде):

```bash
docker stop mock-kafka-3
# остаётся один брокер из трёх — ISR для многих partition = 1
```

```bash
printf 'k3|after-outage\n' | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.replication \
  --producer-property acks=all \
  --property parse.key=true --property key.separator='|' 2>&1
```

**Что увидите:** ошибка вроде **NotEnoughReplicas** / timeout — запись с `acks=all` не проходит при ISR < min ISR.

---

## Задание 6. Восстановление

```bash
docker start mock-kafka-2 mock-kafka-3
sleep 20
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.replication | head -5
```

**Что увидите:** ISR снова полный; produce с `acks=all` снова успешен.

---

## Критерии успеха

- [ ] Topic **lab.replication** с **6** partition и **RF=3**.
- [ ] После остановки одного брокера кластер **перевыбирает leader**, consumer/produce с живых брокеров работают.
- [ ] При нарушении min ISR produce с **acks=all** **не** маскирует проблему молчаливым успехом.
- [ ] Кратко в 3–5 предложениях объяснили связку **RF / ISR / min.insync.replicas / acks=all**.

**Дальше:** [03. Producer tuning](03-producer-tuning.md).
