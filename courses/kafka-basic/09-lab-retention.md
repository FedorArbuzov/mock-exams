# 09. Лаба: короткий retention

## Цель лабы

Создать topic с **retention 60 секунд**, записать сообщения, убедиться, что после паузы **старые** записи недоступны с `--from-beginning` (в пределах политики delete).

## Предварительно

- Стенд [`deploy/kafka`](../../deploy/kafka/README.md) healthy.
- Теория [08. Retention](08-retention.md) прочитана.

> На одноброкерном стенде удаление сегментов может занять **до 1–2 минут** (log cleaner interval). Если эксперимент «не сработал» за 60 с — подождите 120 с и повторите consumer.

---

## Задание 1. Topic с retention.ms=60000

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.short-retention \
  --partitions 1 --replication-factor 1 \
  --config retention.ms=60000 \
  --if-not-exists

docker exec mock-kafka /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name lab.short-retention --describe
```

**Что увидите:** `retention.ms=60000`.

---

## Задание 2. Записать метки времени

```bash
for i in 1 2 3; do
  echo "batch-1-msg-$i-$(date -u +%H:%M:%S)" | docker exec -i mock-kafka \
    /opt/kafka/bin/kafka-console-producer.sh \
    --bootstrap-server localhost:9092 \
    --topic lab.short-retention
done
```

Проверка сразу:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.short-retention \
  --from-beginning --timeout-ms 5000
```

**Что увидите:** 3 сообщения `batch-1-*`.

---

## Задание 3. Пауза и новая партия

Подождите **90 секунд** (таймер на телефоне).

```bash
echo "batch-2-only-$(date -u +%H:%M:%S)" | docker exec -i mock-kafka \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.short-retention
```

---

## Задание 4. Consumer с начала лога

Новая группа, чтобы не путать offset:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.short-retention \
  --group lab-retention-test \
  --from-beginning \
  --timeout-ms 8000
```

**Что увидите (ожидание):** только `batch-2-only-…` или пусто + batch-2 — **без** `batch-1-*` (если retention и cleaner отработали).

**Если всё ещё видите batch-1:** подождите ещё 60 с, повторите consumer с новой группой:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group lab-retention-test --delete
```

---

## Задание 5. Alter retention (опционально)

Укоротить до 10 с для повторного эксперимента:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name lab.short-retention \
  --alter --add-config retention.ms=10000
```

---

## Критерии успеха

- [ ] Topic `lab.short-retention` с `retention.ms=60000`
- [ ] Сразу после batch-1 consumer видел 3 сообщения
- [ ] После паузы ≥90 с `--from-beginning` **не** показывает batch-1 (или только batch-2)
- [ ] Понимаете, что consumer lag не «спасает» удалённые сегменты

## Что унести в работу

- Retention настраивается на **topic**, не на consumer.
- Для учебных topic — короткий retention, чтобы не забивать диск.

Следующий урок: [10. Сериализация](10-serialization.md).
