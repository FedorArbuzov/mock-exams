# 05. TTL, приоритеты и цепочки с DLX

## Введение: «заказы протухли, а слоты оплаты заняты»

В маркетплейсе бронь слота оплаты живёт **15 минут**. Если покупатель не оплатил, заказ должен уйти из «горячей» очереди в **отменённые** или в DLQ для аналитики — без бесконечного requeue. **TTL** (Time-To-Live) в RabbitMQ задаёт срок жизни сообщения или очереди; по истечении брокер **удаляет** или **dead-letter'ит** сообщение — если настроен DLX.

**Приоритеты** (`x-max-priority`) позволяют VIP-заказам обгонять обычные — но только на **classic** очередях, не на quorum. Intermediate — выбрать правильный тип очереди под сценарий.

## Что вы узнаете

- **Per-message TTL** (`expiration` в AMQP) vs **queue TTL** (`x-message-ttl`).
- **Queue TTL** (`x-expires`) — автоудаление пустой очереди.
- Связка **TTL + DLX** (delayed dead letter).
- **Priority queues** и ограничения quorum.
- Цепочка **retry → DLQ** (overview для лабы 06).

---

## TTL на сообщении

При publish задаётся свойство **`expiration`** (строка миллисекунд в AMQP 0-9-1):

```text
expiration: "60000"   # 60 секунд с момента попадания в очередь
```

Сообщение уничтожается или уходит в DLX, когда TTL истёк **в голове очереди** (важно: только у сообщений в front проверяется expire — длинные «хвосты» с коротким TTL могут ждать).

## TTL на очереди

Аргумент при declare:

```json
{
  "arguments": {
    "x-message-ttl": 900000,
    "x-dead-letter-exchange": "dlx.orders",
    "x-dead-letter-routing-key": "expired"
  }
}
```

Все сообщения в очереди получают одинаковый TTL при поступлении.

## Queue expires

`x-expires` — через сколько **миллисекунд без consumers** удалить саму очередь (редко в проде на именованных work queues).

## Приоритеты (classic)

```json
{
  "arguments": {
    "x-max-priority": 10
  }
}
```

При publish: `priority: 0..10`. Брокер отдаёт consumer сообщения с **большим** priority раньше (при наличии backlog).

| Тип очереди | TTL per-message | Priority |
|-------------|-----------------|----------|
| classic | да | да |
| quorum | ограниченно / queue-level | нет |

Для VIP + HA: разделите на **две очереди** (vip / standard) или используйте classic с пониманием рисков HA.

## Цепочка TTL → DLX → DLQ

```text
orders.checkout  (x-message-ttl=15m, DLX=dlx.orders, rk=expired)
    → по истечении → dlx.orders → orders.expired
```

Отдельный binding `expired` vs `failed` (от nack) — разный runbook для ops.

## Сравнение с Kafka retention

| | RabbitMQ TTL | Kafka retention |
|---|--------------|-----------------|
| Гранулярность | сообщение / очередь | topic / partition log |
| После истечения | drop или DLX | delete по log retention |
| Отложенная доставка | плагин delayed message / TTL+DLX | нет встроенного delay в core |

## Типичные ошибки

- Ожидать точный expire в deep queue — проверяется с головы.
- Priority на quorum — ошибка declare.
- TTL без DLX — **тихая потеря** сообщения.
- Путать `expiration` на publish с `x-message-ttl` на queue.

## Резюме

TTL управляет «свежестью» работы; в паре с DLX — контролируемый путь в DLQ. Priority — инструмент classic-очередей; для quorum планируйте отдельные очереди или маршрутизацию на уровне exchange.

## Чек-лист

- Разница message TTL и queue `x-message-ttl`?
- Куда девается сообщение по TTL при настроенном DLX?
- Почему priority не на quorum?
- Как отделить «expired» от «failed» в DLX?

Следующий урок: [06-lab-ttl-dlx-chain.md](06-lab-ttl-dlx-chain.md).
