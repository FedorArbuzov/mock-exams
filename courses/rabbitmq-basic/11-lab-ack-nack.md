# 11. Лаба: ack, requeue и отбрасывание

## Цель лабы

Проследить поведение **`ack_requeue_true`** vs **`ack_requeue_false`**, увидеть **redelivery** и сценарий **reject без requeue** на очереди `lab.ack.q`.

## Предварительно

- Теория [10. Ack и prefetch](10-ack-prefetch.md).
- Стенд `mock-rabbitmq` running.

---

## Задание 1. Очередь через default exchange

Для простоты — publish в **default exchange** (routing key = имя queue):

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.ack.q durable=true

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=amq.default routing_key=lab.ack.q payload=msg-1
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=amq.default routing_key=lab.ack.q payload=msg-2

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.ack
```

**Что увидите:** **2** messages ready.

---

## Задание 2. ack_requeue_false (успешная обработка)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.ack.q ackmode=ack_requeue_false count=1

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.ack
```

**Что увидите:** payload `msg-1`; в очереди осталось **1** (msg-2).

---

## Задание 3. ack_requeue_true (имитация retry)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.ack.q ackmode=ack_requeue_true count=1

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.ack
```

**Что увидите:** прочитали `msg-2`, но счётчик снова **1** — сообщение **вернулось** в хвост.

Повторите `get` с `ack_requeue_false`, чтобы очистить.

---

## Задание 4. reject_requeue_false (poison)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=amq.default routing_key=lab.ack.q payload=poison

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.ack.q ackmode=reject_requeue_false count=1

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.ack
```

**Что увидите:** `poison` **не** остаётся в ready (отброшено без requeue). В проде такое сообщение ушло бы в **DLX** (intermediate).

---

## Задание 5. unacked (наблюдение)

В приложении при долгой обработке сообщения висят **unacked**. На стенде:

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages_ready messages_unacknowledged | grep lab.ack
```

Кратко опишите: при `prefetch=1` и зависшем consumer второй worker продолжит, если подписан на ту же queue.

---

## Задание 6. UI

**Queues** → `lab.ack.q` → **Get messages** с разными Ack modes (если доступно в версии UI) или смотрите **Message rates**.

---

## Задание 7. Очистка

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course purge queue name=lab.ack.q
```

---

## Критерии успеха

- [ ] `ack_requeue_false` уменьшает depth
- [ ] `ack_requeue_true` оставляет сообщение в очереди
- [ ] `reject_requeue_false` удаляет без возврата
- [ ] Можете связать requeue=true с **retry** и poison с **DLX**

## Что унести в работу

- Ack **после** успеха в БД
- Requeue ограничивать счётчиком попыток
- Мониторить `messages_unacknowledged`

Следующий урок: [12. vs Kafka и SQS](12-vs-kafka-sqs.md).
