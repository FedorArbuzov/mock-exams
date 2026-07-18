# 04. Лаба: Dead Letter Exchange и DLQ

## Цель лабы

Собрать топологию **orders.work → dlx.orders → orders.dlq**, сверить аргументы с [`dlx-policy.json`](../../deploy/rabbitmq/examples/dlx-policy.json), отправить poison message и увидеть его в DLQ.

## Предварительно

Single-node стенд:

```bash
cd deploy/rabbitmq
docker compose up -d
```

---

## Задание 1. Топология скриптом

**Зачем:** воспроизводимый setup для CI и финального проекта.

```bash
chmod +x courses/rabbitmq-intermediate/examples/dlx-setup.sh
./courses/rabbitmq-intermediate/examples/dlx-setup.sh
```

Скрипт создаёт:

- exchange `dlx.orders` (topic, durable)
- queue `orders.dlq`
- binding `dlx.orders` → `orders.dlq`, rk `failed`
- queue `orders.work` с DLX-аргументами как в deploy example

**Что увидите:** `OK: dlx.orders -> orders.dlq...`

---

## Задание 2. Публикация и успешная обработка

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course publish \
  exchange=amq.default routing_key=orders.work \
  payload='{"orderId":"OK-1","amount":10}'

docker exec mock-rabbitmq rabbitmqadmin -u course -p course get \
  queue=orders.work ackmode=ack_requeue_false
```

**Что увидите:** одно сообщение, `orders.dlq` пуста (`messages=0`).

---

## Задание 3. Poison message → DLQ

Симулируем worker, который отвергает сообщение без requeue (через `get` + reject в rabbitmqadmin нет — используем **consumer в Python** одной строкой или nack через management):

Проще — **expire** через короткий TTL в отдельной лабе 06; здесь — **reject** через `rabbitmqctl` eval или второй publish с невалидным сценарием.

Вариант с **превышением delivery-limit** (quorum) пропустим; для classic-совместимой work-очереди используем **reject** через amqp-tools, если установлен, или UI:

1. UI → Queues → `orders.work` → Get messages → **Reject** (requeue=false).

Либо из контейнера с `python3`:

```bash
docker exec mock-rabbitmq python3 - <<'PY'
import pika
conn = pika.BlockingConnection(pika.URLParameters("amqp://course:course@localhost:5672/"))
ch = conn.channel()
method, props, body = ch.basic_get("orders.work", auto_ack=False)
if method:
    ch.basic_publish("", "orders.work", body=b'{"orderId":"BAD"}')
    ch.basic_nack(method.delivery_tag, requeue=False)
conn.close()
PY
```

Сначала положите BAD-сообщение:

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course publish \
  routing_key=orders.work payload='{"orderId":"BAD"}'
```

Затем выполните Python-блок выше.

**Что увидите:** `orders.work` пуста; в `orders.dlq` — одно сообщение с routing key `failed`.

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages
docker exec mock-rabbitmq rabbitmqadmin -u course -p course get queue=orders.dlq ackmode=ack_requeue_false
```

---

## Задание 4. Сверка с dlx-policy.json

Откройте [`deploy/rabbitmq/examples/dlx-policy.json`](../../deploy/rabbitmq/examples/dlx-policy.json) и сравните `arguments` очереди `orders.work` в UI (Arguments).

**Что увидите:** совпадение `x-dead-letter-exchange` и `x-dead-letter-routing-key`.

---

## Задание 5. Сравнение с SQS (теория)

Прочитайте фрагмент [aws-intermediate/07-sqs-dlq.md](../aws-intermediate/07-sqs-dlq.md): `maxReceiveCount=3` ≈ три неудачных доставки; в RabbitMQ счётчик — в приложении или `delivery-limit` на quorum.

Запишите в заметки одну таблицу «SQS vs RabbitMQ DLQ» (3 строки).

---

## Критерии успеха

- [ ] `dlx-setup.sh` выполнен без ошибок
- [ ] Poison message оказался в **orders.dlq**, не в work
- [ ] Аргументы DLX совпадают с **dlx-policy.json**

Следующая теория: [05-ttl-priority.md](05-ttl-priority.md).
