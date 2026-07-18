# 08. Лаба: Kafka Streams — концепции и kcat-симуляция pipeline

## Цель лабы

Без обязательного JVM-кластера **смоделировать** топологию Streams: **input → repartition by key → aggregate topic**, понять **changelog** и опционально прочитать **properties** standalone-приложения. Полный Streams JAR в Docker не требуется.

## Предварительно

- [07-kafka-streams](07-kafka-streams.md).
- KRaft стенд: `cd deploy/kafka && docker compose up -d`.

---

## Задание 1. Доменные topics

```bash
export BS=localhost:9092

docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server $BS \
  --create --topic lab.streams.orders \
  --partitions 3 --replication-factor 1 --if-not-exists

docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server $BS \
  --create --topic lab.streams.orders.by-customer \
  --partitions 3 --replication-factor 1 --if-not-exists
```

**Сценарий:** KStream `orders` → `groupBy(customerId)` → count → sink `orders.by-customer` (в Streams это internal + output).

---

## Задание 2. Симуляция produce (kcat)

С хоста (`key:value`):

```bash
echo 'c1:{"orderId":"o1","customerId":"c1","amount":10}' | kcat -b localhost:9094 -t lab.streams.orders -K: -P
echo 'c1:{"orderId":"o2","customerId":"c1","amount":20}' | kcat -b localhost:9094 -t lab.streams.orders -K: -P
echo 'c2:{"orderId":"o3","customerId":"c2","amount":5}'  | kcat -b localhost:9094 -t lab.streams.orders -K: -P
```

**Зачем key `c1`:** все события клиента c1 попадут в **одну partition** — как `groupByKey` в Streams.

---

## Задание 3. «Ручной aggregator» (консольный consumer)

Пока нет Streams app, посчитайте вручную или скриптом. Для понимания partition stickiness:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server $BS \
  --topic lab.streams.orders \
  --from-beginning \
  --property print.key=true \
  --timeout-ms 8000
```

Запишите: partition 0/1/2 для каждого key.

---

## Задание 4. Записать «результат агрегации» (симуляция sink)

```bash
echo 'c1:{"customerId":"c1","count":2,"sum":30}' | kcat -b localhost:9094 -t lab.streams.orders.by-customer -K: -P
echo 'c2:{"customerId":"c2","count":1,"sum":5}'  | kcat -b localhost:9094 -t lab.streams.orders.by-customer -K: -P
```

В реальном Streams changelog topic имел бы имя вроде `my-app-customer-count-changelog`.

---

## Задание 5. Optional — properties Streams app

Создайте локально файл `streams-app.properties` (не коммитить секреты):

```properties
application.id=lab-streams-count-v1
bootstrap.servers=localhost:9094
default.key.serde=org.apache.kafka.common.serialization.Serdes$StringSerde
default.value.serde=org.apache.kafka.common.serialization.Serdes$StringSerde
processing.guarantee=at_least_once
num.stream.threads=1
state.dir=/tmp/kafka-streams
```

| Свойство | Смысл |
|----------|--------|
| `application.id` | consumer group + prefix internal topics |
| `processing.guarantee` | `at_least_once` vs `exactly_once_v2` |
| `state.dir` | RocksDB local path |
| `num.stream.threads` | parallelism внутри процесса |

**На собеседовании:** смена `application.id` → новый state, не продолжение старого.

Пример topology (псевдокод для сопоставления с лабой):

```java
KStream<String, String> orders = builder.stream("lab.streams.orders");
orders.groupByKey()
      .count(Materialized.as("customer-count"))
      .toStream()
      .to("lab.streams.orders.by-customer");
```

---

## Задание 6. Internal topics (наблюдение)

После запуска **реального** Streams приложения (вне лабы) выполните:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server $BS --list | grep -E 'lab-streams|changelog|repartition'
```

В этой лабе список может быть пуст — цель — знать **что искать**.

---

## Критерии успеха

- [ ] Создали input/output topics, отправили keyed events.
- [ ] Объяснили, зачем key при `groupBy`.
- [ ] Заполнили таблицу properties и роль `application.id`.
- [ ] Назвали два internal topic типа (changelog, repartition).

**Дальше:** [09-ksql-flink](09-ksql-flink.md).
