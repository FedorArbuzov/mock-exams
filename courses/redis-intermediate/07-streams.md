# 07. Streams: лог событий в Redis

## Введение: «нужна очередь, но Kafka ещё рано»

Команда хочет **лог событий** с несколькими подписчиками и ACK, но поднимать Kafka для 500 сообщений в минуту — дорого. **Redis Streams** (с Redis 5) дают append-only лог с ID, **consumer groups**, pending list и `XACK` — ближе к Kafka, чем List + BLPOP, но в рамках одного Redis.

Сравнение с [`kafka-basic`](../kafka-basic/README.md) поможет не перепутать границы.

## Что вы узнаете

- `XADD`, `XREAD`, `XRANGE`.
- **Consumer group**: `XGROUP CREATE`, `XREADGROUP`, `XACK`, `XPENDING`.
- Сходства и отличия от Kafka topic/partition/offset.
- Когда Streams, а когда Kafka или List.

## Модель данных

Stream — упорядоченный лог записей. ID по умолчанию: `millisecondsSequence` (например `1716032400000-0`).

```text
XADD orders:events * orderId 1001 status created
```

Поля — плоские key-value (как HASH в одной записи).

## Consumer group — аналогия с Kafka

| Kafka ([06-consumer](../kafka-basic/06-consumer.md)) | Redis Streams |
|------------------------------------------------------|---------------|
| Topic | Stream key (`orders:events`) |
| Partition | один stream ≈ одна partition* |
| Offset | ID сообщения |
| Consumer group | `XGROUP CREATE` |
| commit offset | `XACK` |
| lag | `XPENDING`, `XINFO GROUPS` |
| rebalance | нет автоматического; несколько consumer в группе делят сообщения |

\* Масштабирование записи в Redis Streams — **sharding** нескольких stream keys (`orders:0`, `orders:1`), не встроенные partition как в Kafka.

## Чтение

**Без группы** — `XREAD BLOCK`:

```bash
XREAD COUNT 10 BLOCK 5000 STREAMS orders:events $
```

**С группой** — каждое сообщение одному consumer в группе:

```bash
XGROUP CREATE orders:events billing $ MKSTREAM
XREADGROUP GROUP billing consumer-1 COUNT 1 STREAMS orders:events >
```

`>` — только новые, не выданные группе. После обработки:

```bash
XACK orders:events billing <message-id>
```

Не подтверждённые — в **PEL** (Pending Entries List); их забирает `XCLAIM` при падении consumer.

## Сравнение с Kafka — когда что

| Критерий | Redis Streams | Kafka |
|----------|---------------|-------|
| Объём, retention TB | слабо | сильно |
| Несколько DC, контракт схем | Kafka + Schema Registry | Streams не замена |
| Уже есть Redis, мало событий | Streams | избыточно |
| Очередь задач worker×N | Streams или List | обычно overkill |
| Гарантии на диске, replay годами | Kafka | Streams + AOF ограничены |

Подробнее consumer в Kafka: [07-lab-consumer](../kafka-basic/07-lab-consumer.md).

## На стенде (single)

```bash
cd deploy/redis
docker compose down
docker compose up -d
docker exec mock-redis redis-cli XADD lab:stream:orders * sku BOOK-1 qty 2
docker exec mock-redis redis-cli XRANGE lab:stream:orders - +
```

## Типичные ошибки

| Симптом | Причина | Решение |
|---------|---------|---------|
| Сообщения «зависли» | нет `XACK` | ACK после side effect |
| Дубли обработки | at-least-once | идемпотентность по `orderId` |
| Stream растёт без bound | нет `MAXLEN` | `XADD ... MAXLEN ~ 10000` |
| Один consumer тормозит | hot key | шардировать stream keys |
| BUSYGROUP | группа уже есть | `XGROUP CREATE ... MKSTREAM` или игнор |

## В продакшене

- **MAXLEN ~** для approximate trim — меньше CPU.
- DLQ: отдельный stream `orders:dlq` для poison messages.
- Не храните в stream то, что должно жить **годы** — архив в S3/data lake.
- Мониторинг: длина stream, `pel-count`, lag по группам.

## Резюме

Streams — лог с ID и consumer groups, близкий ментально к Kafka consumer group, но в границах одного Redis. Для учебного стенда используйте **single** `docker compose up -d`.

## Чек-лист

- Чем `XACK` похож на commit offset?
- Что означает `>` в `XREADGROUP`?
- Почему один stream key — узкое место?
- Когда вы бы выбрали Kafka вместо Streams?

Следующий урок: [08. Лаба: consumer group](08-lab-streams-consumer.md).
