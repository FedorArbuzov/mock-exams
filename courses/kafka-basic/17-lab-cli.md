# 17. Лаба: describe topic и get offsets

## Цель лабы

Отработать **операторский** сценарий: создать topic, отправить данные, снять **log end offsets**, создать consumer group, прочитать частично, сравнить **committed** и **end** через `kafka-consumer-groups.sh`.

## Предварительно

- [16. CLI](16-cli.md).
- Стенд Kafka running.

---

## Задание 1. Topic lab.cli-audit

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.cli-audit \
  --partitions 3 --replication-factor 1 --if-not-exists

docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --describe --topic lab.cli-audit
```

**Запишите:** `PartitionCount`, `Leader` для partition 0.

---

## Задание 2. Produce 30 сообщений

```bash
for i in $(seq 1 30); do
  echo "audit-$i" | docker exec -i mock-kafka \
    /opt/kafka/bin/kafka-console-producer.sh \
    --bootstrap-server localhost:9092 --topic lab.cli-audit
done
```

---

## Задание 3. Log end offsets

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-get-offsets.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.cli-audit
```

**Что увидите:** три строки `lab.cli-audit:0:…`, `:1:…`, `:2:…` — сумма end offsets ≈ 30 (распределение round-robin).

---

## Задание 4. Consumer group audit-readers

Прочитайте 12 сообщений:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.cli-audit \
  --group audit-readers \
  --max-messages 12 \
  --timeout-ms 20000
```

---

## Задание 5. Describe group

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group audit-readers --describe
```

**Что увидите:** по каждой partition `CURRENT-OFFSET`, `LOG-END-OFFSET`, `LAG`.

Вычислите вручную: сумма **LAG** по partition ≈ 30 − 12 = **18** (может отличаться на 1–2 из-за распределения).

---

## Задание 6. Dry-run reset (без execute)

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group audit-readers \
  --reset-offsets --to-earliest \
  --topic lab.cli-audit
```

**Что увидите:** план смещения **без** применения (нет `--execute`).

**Не** добавляйте `--execute` на общем стенде без необходимости.

---

## Задание 7. List и cleanup

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list | grep lab.cli

docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --list | grep audit
```

Опционально удалить topic:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --delete --topic lab.cli-audit
```

---

## Критерии успеха

- [ ] `--describe --topic lab.cli-audit` показал 3 partition
- [ ] `kafka-get-offsets.sh` вернул end offsets
- [ ] Группа `audit-readers` с суммарным LAG > 0 после 12 сообщений
- [ ] Dry-run reset показал план без `--execute`

## Что унести в работу

- Три команды on-call: **describe topic**, **describe group**, **get-offsets**.

Следующий урок: [18. Kafka vs очереди](18-vs-queues.md).
