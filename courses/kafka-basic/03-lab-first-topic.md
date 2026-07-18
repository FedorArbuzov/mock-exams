# 03. Лаба: первый topic, produce и consume

## Цель лабы

Поднять стенд Kafka, **создать topic**, отправить и **прочитать** сообщения через CLI внутри `mock-kafka`. Зафиксировать разницу между bootstrap **с хоста** (`9094`) и **внутри контейнера** (`9092`).

## Предварительно

- Docker запущен, порты **9094** и **8080** свободны.
- Из корня репозитория:

```bash
cd deploy/kafka
docker compose up -d
docker compose ps
```

Контейнер `mock-kafka` в статусе **healthy** (подождите 30–60 с). Подробности: [`deploy/kafka/README.md`](../../deploy/kafka/README.md).

Опционально smoke test:

```bash
bash scripts/smoke.sh
```

---

## Задание 1. Проверка брокера

**Зачем:** убедиться, что CLI достучался до кластера.

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list
```

**Что увидите:** пустой список или служебные topics (`__consumer_offsets` после первого consume).

**Если Connection refused:** `docker compose logs kafka`, дождаться healthcheck.

---

## Задание 2. Создать topic

**Зачем:** явно задать число partition (параллелизм в будущем).

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.hello \
  --partitions 3 --replication-factor 1

docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --describe --topic lab.hello
```

**Что увидите:** `PartitionCount: 3`, у каждой partition `Leader: 1`.

**Если topic already exists:** добавьте `--if-not-exists` к `--create` или удалите topic (задание 6).

---

## Задание 3. Console producer

**Зачем:** ручная отправка без кода.

В **первом** терминале:

```bash
docker exec -it mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.hello
```

Введите три строки (после каждой Enter):

```text
first message
second message
third message
```

Завершите: **Ctrl+D** (Linux/macOS) или **Ctrl+Z** Enter (Windows в некоторых терминалах).

**Что увидите:** `>` без ошибок — записи ушли в topic (распределены по partition).

---

## Задание 4. Console consumer с начала

**Зачем:** увидеть все записи и их порядок **внутри partition** (между partition порядок может отличаться).

Во **втором** терминале:

```bash
docker exec -it mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.hello \
  --from-beginning \
  --property print.timestamp=true \
  --property print.partition=true \
  --property print.offset=true
```

**Что увидите:** три строки с метаданными `partition=… offset=…`.

Остановка: **Ctrl+C**.

---

## Задание 5. Только новые сообщения

**Зачем:** модель «подписались и ждём новое» (`auto.offset.reset=latest` у клиентов).

1. Запустите consumer **без** `--from-beginning`:

```bash
docker exec -it mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.hello
```

2. В producer отправьте `fourth message`.

**Что увидите:** consumer показывает только `fourth message`, не старые три.

---

## Задание 6. Kafka UI (опционально)

Откройте [http://localhost:8080](http://localhost:8080) — topic `lab.hello`, сообщения, partition.

---

## Задание 7. Очистка (опционально)

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --delete --topic lab.hello
```

---

## Критерии успеха

- [ ] `mock-kafka` healthy, `--list` без ошибки
- [ ] Topic `lab.hello` создан с 3 partition
- [ ] Producer отправил ≥3 сообщений
- [ ] Consumer с `--from-beginning` показал все сообщения с partition/offset
- [ ] Consumer без `--from-beginning` получил только новое сообщение

## Что унести в работу

- В лабах курса bootstrap **внутри контейнера**: `localhost:9092`.
- С хоста (kcat, приложения): `localhost:9094`.
- `--from-beginning` vs «только новые» — частый источник «пропали сообщения».

Следующий урок: [04. Producer](04-producer.md).
