# 06. Consumer: poll, group, offset commit

## Введение: «перезапустили сервис — заказы обработались снова»

Deploy новой версии **Fulfillment**. После рестарта consumer снова читает `order.created` с вчера — дубли отгрузок. Причина: **offset не закоммичен** до успешной обработки, или `enable.auto.commit=true` закоммитил **до** записи в БД. Consumer в Kafka — это цикл **poll → обработка → commit**, а не «подписка как в MQTT».

## Что вы узнаете

- Цикл **poll** и параметры `max.poll.records`, `session.timeout`.
- **Consumer group**, rebalance (обзор).
- **Auto vs manual** commit offset.
- `auto.offset.reset`: `earliest` / `latest`.

## Consumer group — ещё раз

Имя группы: `group.id` (или `--group` в CLI).

Kafka координатор группы:

1. Назначает partition consumer-ам (**rebalance**).
2. Хранит committed offset в topic **`__consumer_offsets`**.

Две группы `billing` и `warehouse` на topic `orders.events` — **два независимых** прогресса по ленте.

## Poll loop

Псевдокод клиента (Java/Python/Go — идея одна):

```text
subscribe(topics)
loop:
  records = poll(timeout)
  for record in records:
    process(record)
  commit_sync()   # или commit_async()
```

**poll** — heartbeats и получение batch записей. Долгая обработка без poll → **session expired** → rebalance.

| Параметр | Смысл |
|----------|--------|
| `max.poll.interval.ms` | макс. время между poll до исключения consumer |
| `max.poll.records` | сколько записей за один poll |
| `session.timeout.ms` | когда считать consumer мёртвым |
| `heartbeat.interval.ms` | частота heartbeat |

## Offset commit

| Режим | Поведение | Риск |
|-------|-----------|------|
| **auto commit** (`enable.auto.commit=true`) | периодически commit | обработали с ошибкой — offset уже ушёл → **потеря**; или commit до БД → **дубль** при retry |
| **manual commit** | commit после успеха | классика at-least-once + идемпотентность |

**At-least-once:** сообщение может прийти **повторно** — норма; бизнес-логика должна быть **идемпотентной** (по `eventId`).

**Exactly-once** — транзакционный consumer + idempotent producer (intermediate).

## auto.offset.reset

Если у группы **нет** сохранённого offset:

- `earliest` — с начала retention;
- `latest` — только новые;
- `none` — ошибка (строгий режим).

После **сброса** offset (`--reset-offsets`) поведение задаётся явно.

## Rebalance (обзор)

Триггеры: новый consumer в группе, consumer ушёл, timeout, изменение partition count.

На время rebalance **все** consumer группы могут **стоять** (stop-the-world в старых клиентах; cooperative sticky — в новых).

Подробнее — [14. Сбои](14-failures.md).

## На стенде: две группы

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.consume --partitions 1 --replication-factor 1 \
  --if-not-exists

echo 'shared-event' | docker exec -i mock-kafka \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 --topic lab.consume
```

Группа A:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.consume \
  --group team-a \
  --from-beginning \
  --timeout-ms 5000
```

Группа B — та же команда с `--group team-b`.

**Что увидите:** обе группы получили `shared-event` — разные offset в `__consumer_offsets`.

Список групп:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --list
```

## Типичные ошибки

| Симптом | Причина | Решение |
|---------|---------|---------|
| «Пропали» старые сообщения | новая группа + `latest` | `earliest` или осознанный reset |
| Дубли после деплоя | at-least-once | idempotency key |
| Вечный rebalance | обработка > `max.poll.interval` | уменьшить batch, async обработка, увеличить interval |
| Lag растёт | мало consumer / медленная обработка | scale consumers ≤ partitions |
| Читает только половину partition | 2 consumer, 3 partition, одна «лишняя» | норма; добавить consumer или уменьшить partition |

## В продакшене

- **Consumer lag** — главная метрика (см. [15. Лаба: lag](15-lab-lag.md)).
- Graceful shutdown: `WakeupException`, commit перед exit.
- **DLQ** topic для сообщений, которые не парсятся.
- В Kubernetes: **один consumer process на pod**, replicas = масштаб группы.

## Резюме

Consumer **poll**-ит batch, обрабатывает, **коммитит** offset. Группа — единица масштабирования и одного «прогресса» по topic. Auto-commit удобен в лабах, в prod чаще **manual** после side effects.

## Чек-лист

- Где Kafka хранит offset группы `billing`?
- Чем отличаются `team-a` и `team-b` при чтении одного topic?
- Почему at-least-once даёт дубли?
- Что произойдёт, если обработка записи занимает 10 минут без poll?

Следующий урок: [07. Лаба: consumer group](07-lab-consumer.md).
