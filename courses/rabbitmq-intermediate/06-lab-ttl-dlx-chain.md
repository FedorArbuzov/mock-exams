# 06. Лаба: цепочка TTL → DLX и приоритет (classic)

## Цель лабы

Создать очередь **checkout.hold** с коротким TTL и DLX на `orders.expired`, увидеть dead letter по истечении; на **classic** очереди продемонстрировать **priority**.

## Предварительно

```bash
cd deploy/rabbitmq
docker compose up -d
```

DLX `dlx.orders` уже может существовать после [04-lab-dlx](04-lab-dlx.md); иначе выполните `dlx-setup.sh`.

---

## Задание 1. Очередь expired

```bash
curl -sf -u course:course -H "content-type: application/json" \
  -X PUT "http://localhost:15672/api/queues/%2F/orders.expired" \
  -d '{"durable":true}'

curl -sf -u course:course -H "content-type: application/json" \
  -X PUT "http://localhost:15672/api/bindings/%2F/e/dlx.orders/q/orders.expired" \
  -d '{"routing_key":"expired"}'
```

Очередь hold с TTL 5 секунд (для лабы):

```bash
curl -sf -u course:course -H "content-type: application/json" \
  -X PUT "http://localhost:15672/api/queues/%2F/checkout.hold" \
  -d '{
    "durable": true,
    "arguments": {
      "x-message-ttl": 5000,
      "x-dead-letter-exchange": "dlx.orders",
      "x-dead-letter-routing-key": "expired"
    }
  }'
```

Публикация:

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course publish \
  routing_key=checkout.hold payload='{"orderId":"HOLD-1"}'
```

Подождите **6+ секунд**, проверьте:

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages
```

**Что увидите:** `checkout.hold` — 0; `orders.expired` — 1.

---

## Задание 2. Per-message TTL (classic)

Создайте `lab.ttl.msg` (classic, без quorum):

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course declare queue \
  name=lab.ttl.msg durable=true \
  arguments='{"x-dead-letter-exchange":"dlx.orders","x-dead-letter-routing-key":"expired"}'
```

Publish с expiration (rabbitmqadmin properties):

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course publish \
  routing_key=lab.ttl.msg payload='short' properties='{"expiration":"3000"}'
```

Через 4 с проверьте `orders.expired` — счётчик вырос.

---

## Задание 3. Priority (classic only)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course declare queue \
  name=lab.priority durable=true arguments='{"x-max-priority":10}'

for p in 1 5 9; do
  docker exec mock-rabbitmq rabbitmqadmin -u course -p course publish \
    routing_key=lab.priority payload="prio-$p" properties="{\"priority\":$p}"
done
```

Три раза `get` без ack, затем с ack — порядок доставки consumer'у часто **9, 5, 1** (зависит от backlog; при одном consumer в лабе обычно виден приоритет).

**Что увидите:** высокий priority выходит раньше при наличии нескольких ready.

---

## Задание 4. Цепочка в схеме

Нарисуйте (в блокноте) цепочку:

```text
checkout.hold --[TTL 5s]--> dlx.orders --[rk expired]--> orders.expired
orders.work   --[nack]----> dlx.orders --[rk failed]----> orders.dlq
```

Сравните с **двумя** routing key на одном DLX — один exchange, разные DLQ/runbook.

---

## Критерии успеха

- [ ] Сообщение из `checkout.hold` попало в **orders.expired** по TTL
- [ ] Per-message expiration сработал с DLX
- [ ] Priority-очередь classic создана, порядок обсуждён

Следующая теория: [07-publisher-confirms.md](07-publisher-confirms.md).
