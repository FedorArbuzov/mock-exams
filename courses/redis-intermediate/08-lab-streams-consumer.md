# 08. Лаба: Streams и consumer group (сравнение с Kafka)

## Цель лабы

На **single**-стенде создать stream, две **consumer group** (как `team-a` / `team-b` в [kafka-basic 07](../kafka-basic/07-lab-consumer.md)), обработать сообщения с `XACK` и посмотреть **pending**.

## Предварительно

```bash
cd deploy/redis
docker compose -f docker-compose.sentinel.yml down 2>/dev/null || true
docker compose -f docker-compose.replication.yml down 2>/dev/null || true
docker compose up -d
```

---

## Задание 1. Создать stream и события

```bash
docker exec mock-redis redis-cli DEL lab:stream:shop
docker exec mock-redis redis-cli XADD lab:stream:shop * event order.created orderId 1001
docker exec mock-redis redis-cli XADD lab:stream:shop * event order.created orderId 1002
docker exec mock-redis redis-cli XADD lab:stream:shop * event order.paid orderId 1001
docker exec mock-redis redis-cli XRANGE lab:stream:shop - +
```

**Что увидите:** три записи с автоматическими ID.

---

## Задание 2. Две группы — независимое чтение

**Зачем:** как две Kafka consumer group на одном topic.

```bash
docker exec mock-redis redis-cli XGROUP CREATE lab:stream:shop warehouse 0 MKSTREAM
docker exec mock-redis redis-cli XGROUP CREATE lab:stream:shop analytics 0
```

Группа `warehouse`:

```bash
docker exec mock-redis redis-cli XREADGROUP GROUP warehouse wh-1 COUNT 10 STREAMS lab:stream:shop >
```

Группа `analytics` (тот же stream):

```bash
docker exec mock-redis redis-cli XREADGROUP GROUP analytics an-1 COUNT 10 STREAMS lab:stream:shop >
```

**Что увидите:** обе группы получили **все три** сообщения — отдельный cursor на группу (аналог offset в `__consumer_offsets`).

---

## Задание 3. ACK и pending

Обработайте только первое сообщение в `warehouse` (подставьте ID из вывода):

```bash
# пример: ID=1716032400000-0
docker exec mock-redis redis-cli XACK lab:stream:shop warehouse 1716032400000-0
docker exec mock-redis redis-cli XPENDING lab:stream:shop warehouse
```

**Что увидите:** в pending — неподтверждённые записи (ещё 2).

Подтвердите остальные:

```bash
docker exec mock-redis redis-cli XACK lab:stream:shop warehouse 1716032400001-0 1716032400002-0
```

(замените ID на свои)

---

## Задание 4. Новые сообщения только для `>`

```bash
docker exec mock-redis redis-cli XADD lab:stream:shop * event order.shipped orderId 1001
docker exec mock-redis redis-cli XREADGROUP GROUP warehouse wh-1 COUNT 1 STREAMS lab:stream:shop >
```

**Что увидите:** только `order.shipped`.

---

## Задание 5. Сравнение с Kafka (таблица в блокноте)

Заполните по памяти из [07-streams](07-streams.md) и [kafka-basic 06](../kafka-basic/06-consumer.md):

| Вопрос | Kafka | Redis Streams |
|--------|-------|---------------|
| Где хранится offset группы? | `__consumer_offsets` | entries в stream + PEL |
| Масштаб consumers | ≤ partitions | несколько consumer в группе на один stream |
| Retention 7 дней TB | да | ограничено RAM/диском Redis |

---

## Задание 6. Trim (опционально)

```bash
docker exec mock-redis redis-cli XADD lab:stream:shop MAXLEN ~ 2 * event ping 1
docker exec mock-redis redis-cli XLEN lab:stream:shop
```

**Что увидите:** длина ~2 (approximate).

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | Stream содержит ≥3 события |
| 2 | `warehouse` и `analytics` обе прочитали историю с `0` |
| 3 | `XPENDING` показывал не-ACK записи до полного `XACK` |
| 4 | `>` возвращает только новые записи |
| 5 | Таблица сравнения с Kafka заполнена |

Следующий урок: [09. ACL](09-acl.md).
