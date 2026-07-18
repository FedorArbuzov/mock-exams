# 07. Publisher confirms: надёжная публикация

## Введение: «API ответил 200, а заказ в очереди не появился»

HTTP-клиент получил timeout от вашего API, хотя сервис успел вызвать `basic.publish` — но брокер упал до записи на диск, или channel закрылся с ошибкой **flow control**. Без подтверждения от брокера producer живёт в иллюзии **at-most-once**. **Publisher confirms** — механизм, при котором RabbitMQ асинхронно (или синхронно в batch) отвечает, что сообщение **принято** или **отклонено**.

Аналог в Kafka — **`acks=all`** и ответ на `RecordMetadata` ([producer tuning](../kafka-intermediate/03-producer-tuning.md)); в SQS — успешный ответ `SendMessage` (managed гарантии внутри AWS).

## Что вы узнаете

- Режим **confirm.select** на channel.
- **`basic.ack`** / **`basic.nack`** от брокера к publisher (confirm callback).
- Correlation с **delivery tag** и batch publish.
- Связь с **mandatory** и **returns** (непривязанные сообщения).
- Обработка timeout и retry producer.

---

## Включение confirms

На AMQP channel:

```python
ch.confirm_delivery()
# или низкоуровнево: channel.confirm_select()
```

После `publish` брокер присылает:

- **Ack confirm** — сообщение записано (для persistent — на диск согласно политике).
- **Nack confirm** — не принято (редко; ресурс, policy).

В **pika** / **amqp-client** — callbacks `on_ack` / `on_nack` с `delivery_tag`.

## Persistent messages

```python
properties=pika.BasicProperties(delivery_mode=2)
```

Без `delivery_mode=2` confirm означает приём в RAM; при crash возможна потеря — как `acks=1` без репликации на все ISR в Kafka.

## Mandatory и returns

| Флаг | Смысл |
|------|--------|
| `mandatory=true` | если нет очереди для routing — **return** publisher'у |
| confirms | брокер принял к маршрутизации / очереди |

Для надёжного контура: **confirms + mandatory + обработка basic.return** (или гарантированные bindings).

## Семантика

| Конфиг | Семантика publish |
|--------|-------------------|
| fire-and-forget | at-most-once |
| confirms + persistent + quorum/classic durable | at-least-once на стороне broker ingest |
| duplicate publish при retry | дубли у consumer → идемпотентность |

См. [Kafka delivery semantics](../kafka-intermediate/09-delivery-semantics.md): confirms не заменяют идемпотентный consumer.

## Retry producer

При `nack` или timeout:

1. Экспоненциальный backoff.
2. Лимит попыток → **лог + алерт** (не бесконечно).
3. Опционально **outbox pattern** в БД: сначала запись «событие», отдельный relay в RabbitMQ.

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| Confirms на shared channel без учёта tag | путаница ack |
| Не ждать confirms при exit процесса | потеря последних publish |
| Игнорировать `basic.return` при mandatory | silent drop |
| Считать confirm = обработано consumer | это только ingest в broker |

## В продакшене

- Включайте confirms на всех критичных publishers (заказы, платежи).
- Метрики: rate nack, latency confirm ([глава 09](09-monitoring.md)).
- Load test: при **memory alarm** брокер блокирует publishers — нужен backpressure на API.

## Резюме

Publisher confirms — минимальный контракт «брокер принял сообщение». В паре с durable, DLX и идемпотентным consumer строится надёжный pipeline.

## Чек-лист

- Чем confirm отличается от consumer ack?
- Зачем `delivery_mode=2`?
- Что делает `mandatory`?
- Аналог в Kafka?

Следующий урок: [08-lab-confirms.md](08-lab-confirms.md).
