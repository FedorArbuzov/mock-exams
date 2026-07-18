# 07. Лаба: fanout — одно событие в две очереди

## Цель лабы

Создать **fanout exchange**, привязать **две** очереди, опубликовать **одно** сообщение и убедиться, что **обе** очереди получили копию.

## Предварительно

- Стенд RabbitMQ healthy.
- Теория: [06. Pub/Sub fanout](06-pubsub-fanout.md).

---

## Задание 1. Exchange и очереди

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=lab.fanout.ex type=fanout durable=true

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.fanout.a.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.fanout.b.q durable=true
```

---

## Задание 2. Bindings (без routing key)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.fanout.ex destination=lab.fanout.a.q
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.fanout.ex destination=lab.fanout.b.q

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  list bindings source destination | grep lab.fanout
```

**Что увидите:** две строки с `lab.fanout.ex` → `a.q` и `b.q`.

---

## Задание 3. Один publish

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.fanout.ex routing_key=ignored payload='{"event":"order.created","id":42}'

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.fanout
```

**Что увидите:** **1** message в `lab.fanout.a.q` и **1** в `lab.fanout.b.q`.

---

## Задание 4. Прочитать обе очереди

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.fanout.a.q ackmode=ack_requeue_false count=1
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.fanout.b.q ackmode=ack_requeue_false count=1
```

**Что увидите:** одинаковый payload `order.created` в обоих выводах.

---

## Задание 5. Контраст с work queue

Удалите bindings очереди B и повторите publish — только A получит сообщение. Верните binding B.  
Кратко зафиксируйте в заметках: при **одной** shared queue второй consumer **разделил бы** сообщения, а не дублировал.

---

## Задание 6. UI

**Exchanges** → `lab.fanout.ex` → граф bindings → обе очереди.  
**Publish** с произвольным routing key — счётчики обеих очередь +1.

---

## Задание 7. Очистка

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course purge queue name=lab.fanout.a.q
docker exec mock-rabbitmq rabbitmqadmin -u course -p course purge queue name=lab.fanout.b.q
```

---

## Критерии успеха

- [ ] Fanout exchange создан
- [ ] Две очереди с отдельными bindings
- [ ] Одно publish → по 1 message в каждой очереди
- [ ] Payload совпадает в A и B
- [ ] Можете объяснить отличие от [лабы 05](05-lab-work-queue.md)

## Что унести в работу

- Pub/sub = **N queues** на один fanout
- `routing_key` на fanout не влияет на маршрут
- Имена queue по сервису: `orders.events.email`

Следующий урок: [08. Routing direct и topic](08-routing-direct-topic.md).
