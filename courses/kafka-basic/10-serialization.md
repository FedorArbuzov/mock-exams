# 10. Сериализация: JSON и зачем Schema Registry

## Введение: «поле amount стало строкой»

**Billing** ожидает JSON `{"amount": 100}`. **Checkout** выкатил версию с `"amount": "100.00"`. Consumer падает на `int(amount)`. Без **контракта** схемы поток событий ломается тихо. В Kafka value и key — **массив байт**; что внутри — договорённость команд и инструментов.

## Что вы узнаете

- **Serializer/Deserializer** в клиентах.
- Плюсы и минусы **JSON** в topic.
- Зачем **Schema Registry** и Avro/Protobuf (preview для intermediate).
- Практики: **envelope**, versioning, sample events.

## Байты на проводе

Producer:

```text
Object → Serializer → bytes → Kafka → bytes → Deserializer → Object
```

Console producer шлёт **UTF-8 строки** — это уже сериализация «как текст».

| Формат | Плюсы | Минусы |
|--------|-------|--------|
| **JSON** | читаемость, отладка | размер, нет строгой схемы |
| **Avro** + Registry | эволюция схем, compact | инфраструктура Registry |
| **Protobuf** | производительность, типы | codegen, Registry |
| **JSON Schema** | компромисс | менее распространён в JVM-мире |

## JSON в basic-курсе

Достаточно для лаб и малых сервисов:

```json
{
  "eventType": "order.created",
  "eventId": "evt-uuid",
  "occurredAt": "2026-05-18T14:32:01Z",
  "schemaVersion": 1,
  "order": { "orderId": "ord-10042", "totalCents": 4599 }
}
```

Образец в репозитории: [`examples/events/order-created.json`](examples/events/order-created.json).

**Правила:**

- Обязательные поля для идемпотентности: `eventId`, `eventType`.
- Версия схемы: `schemaVersion` или в `eventType` (`order.created.v2`).
- Даты в **ISO-8601 UTC**.
- Деньги в **минорных единицах** (cents), не float.

## Envelope pattern

Обёртка вокруг payload:

```json
{
  "meta": { "traceId": "...", "source": "checkout" },
  "data": { "... domain ..." }
}
```

Удобно для tracing; не смешивайте мета и домен без нужды.

## Зачем Schema Registry

**Проблема:** producer и consumer деплоятся **независимо**. Поле переименовали — старые consumer ломаются.

**Schema Registry** (Confluent или совместимый):

- хранит **Avro/JSON Schema/Protobuf** с версиями;
- producer пишет **magic byte + schema id + payload**;
- consumer по id подтягивает схему;
- правила **compatibility**: BACKWARD, FORWARD, FULL.

В [`deploy/kafka`](../../deploy/kafka/README.md) Registry поднимается overlay `docker-compose.extras.yml` — курс **kafka-intermediate**.

## Headers

Без изменения value:

```text
content-type: application/json
traceparent: 00-abc-...
```

Kafka **headers** — отдельные key/value bytes; удобно для tracing и routing.

## На стенде: отправить JSON-файл

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic orders.events \
  --partitions 3 --replication-factor 1 \
  --if-not-exists
```

С хоста (путь к файлу в репозитории):

```bash
cat courses/kafka-basic/examples/events/order-created.json | \
  docker exec -i mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.events
```

Consumer:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.events \
  --from-beginning --timeout-ms 5000
```

## Типичные ошибки

| Ошибка | Последствие | Решение |
|--------|-------------|---------|
| Float для денег | 0.1 + 0.2 | integer cents |
| Нет `eventId` | дубли необратимы | UUID в каждом событии |
| Breaking change без версии | падение consumer | новый eventType / Avro compatibility |
| Огромный JSON в message | RecordTooLarge | ссылка на объект в S3 |
| Доверять `content-type` без проверки | injection | validate JSON schema |

## В продакшене

- CI: **contract tests** (Pact, schema compatibility check).
- **Dead letter** для невалидного JSON.
- PII: не класть в Kafka то, что нельзя хранить по retention.
- Единый **каталог событий** (AsyncAPI, Markdown в repo).

## Резюме

Kafka не знает ваш JSON — только bytes. JSON подходит для старта; рост команды ведёт к **Schema Registry** и Avro/Protobuf. Контракт, `eventId` и версионирование — обязательная дисциплина.

## Чек-лист

- Что такое serializer в одной фразе?
- Зачем `eventId` при at-least-once?
- Чем BACKWARD compatibility отличается от FORWARD?
- Где лежит образец `order.created` в курсе?

Следующий урок: [11. Лаба: JSON-события](11-lab-serialization.md).
