# 08. Лаба: publisher confirms

## Цель лабы

Написать минимальный **Python publisher** с `confirm_delivery`, увидеть ack при успехе и обработать сценарий с **неизвестным routing** (`mandatory` + return).

## Предварительно

```bash
cd deploy/rabbitmq
docker compose up -d
```

В контейнере есть Python и часто `pika`:

```bash
docker exec mock-rabbitmq python3 -c "import pika; print(pika.__version__)" 2>/dev/null || echo "install pika if missing"
```

Если `pika` нет на хосте — выполняйте скрипт **внутри** контейнера (`docker exec -i mock-rabbitmq python3`).

---

## Задание 1. Confirmed publish

Создайте файл `lab_confirm_publish.py` (локально или в `/tmp` в контейнере):

```python
import pika

params = pika.URLParameters("amqp://course:course@localhost:5672/")
conn = pika.BlockingConnection(params)
ch = conn.channel()
ch.confirm_delivery()

# очередь из лабы DLX
ch.queue_declare(queue="orders.work", durable=True, passive=True)

def on_ack(frame):
    print("ACK confirm", frame.delivery_tag)

ch.add_on_return_callback(
    lambda ch, method, props, body: print("RETURN", method.reply_code, body)
)

try:
    ch.basic_publish(
        exchange="",
        routing_key="orders.work",
        body=b'{"orderId":"CONF-1"}',
        properties=pika.BasicProperties(delivery_mode=2, content_type="application/json"),
        mandatory=False,
    )
    print("published, waiting confirms...")
finally:
    conn.close()
```

Запуск:

```bash
docker cp lab_confirm_publish.py mock-rabbitmq:/tmp/
docker exec mock-rabbitmq python3 /tmp/lab_confirm_publish.py
```

**Что увидите:** завершение без исключения; в очереди +1 message (`list_queues`).

---

## Задание 2. Mandatory + return

Опубликуйте в **несуществующий** exchange с mandatory:

```python
ch.exchange_declare(exchange="lab.direct", exchange_type="direct", durable=True)
ch.basic_publish(
    exchange="lab.direct",
    routing_key="no.binding.here",
    body=b"orphan",
    mandatory=True,
    properties=pika.BasicProperties(delivery_mode=2),
)
```

**Что увидите:** callback **RETURN** (reply_code 312 — NO_ROUTE) в логе; сообщение не в очереди.

---

## Задание 3. Nack path (обсуждение)

Остановите брокер **после** `publish` без confirm — симуляция split:

```bash
docker compose stop rabbitmq
# запустить publish с коротким socket timeout — поймать исключение
docker compose start rabbitmq
```

**Зачем:** понять, почему приложение должно **retry** или писать в outbox, а не считать HTTP 200 финалом.

---

## Задание 4. Связь с Kafka

Прочитайте абзац про `acks=all` в [kafka-intermediate/03-producer-tuning.md](../kafka-intermediate/03-producer-tuning.md). Запишите: confirm RabbitMQ ≈ успешный produce с `acks=all` **до** consumer.

---

## Критерии успеха

- [ ] Publish с `confirm_delivery` без ошибки, сообщение в `orders.work`
- [ ] Mandatory publish вызвал **return** callback
- [ ] Понимаете разницу confirm vs consumer ack

Следующая теория: [09-monitoring.md](09-monitoring.md).
