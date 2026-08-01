# 08. Lab: publisher confirms

## Lab goal

Write a minimal **Python publisher** with `confirm_delivery`, see the ack on success, and handle the scenario of an **unknown routing key** (`mandatory` + return).

## Prerequisites

```bash
cd deploy/rabbitmq
docker compose up -d
```

The container has Python and often `pika`:

```bash
docker exec mock-rabbitmq python3 -c "import pika; print(pika.__version__)" 2>/dev/null || echo "install pika if missing"
```

If `pika` is not on the host — run the script **inside** the container (`docker exec -i mock-rabbitmq python3`).

---

## Task 1. Confirmed publish

Create a file `lab_confirm_publish.py` (locally or in `/tmp` inside the container):

```python
import pika

params = pika.URLParameters("amqp://course:course@localhost:5672/")
conn = pika.BlockingConnection(params)
ch = conn.channel()
ch.confirm_delivery()

# queue from the DLX lab
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

Run:

```bash
docker cp lab_confirm_publish.py mock-rabbitmq:/tmp/
docker exec mock-rabbitmq python3 /tmp/lab_confirm_publish.py
```

**What you'll see:** it finishes without an exception; the queue has +1 message (`list_queues`).

---

## Task 2. Mandatory + return

Publish to a **non-existent** exchange with mandatory:

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

**What you'll see:** a **RETURN** callback (reply_code 312 — NO_ROUTE) in the log; the message is not in a queue.

---

## Task 3. Nack path (discussion)

Stop the broker **after** `publish` without a confirm — simulating a split:

```bash
docker compose stop rabbitmq
# run a publish with a short socket timeout — to catch the exception
docker compose start rabbitmq
```

**Why:** to understand why the application should **retry** or write to an outbox rather than treat HTTP 200 as the final word.

---

## Task 4. Relation to Kafka

Read the paragraph about `acks=all` in [kafka-intermediate/03-producer-tuning.md](../kafka-intermediate/03-producer-tuning.md). Note: a RabbitMQ confirm ≈ a successful produce with `acks=all`, **before** the consumer.

---

## Success criteria

- [ ] Publish with `confirm_delivery` without an error, message in `orders.work`
- [ ] The mandatory publish triggered the **return** callback
- [ ] You understand the difference between a confirm and a consumer ack

Next theory: [09-monitoring.md](09-monitoring.md).
