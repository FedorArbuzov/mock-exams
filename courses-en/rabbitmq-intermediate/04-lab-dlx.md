# 04. Lab: Dead Letter Exchange and DLQ

## Lab goal

Build the **orders.work → dlx.orders → orders.dlq** topology, verify the arguments against [`dlx-policy.json`](../../deploy/rabbitmq/examples/dlx-policy.json), send a poison message, and see it land in the DLQ.

## Prerequisites

Single-node environment:

```bash
cd deploy/rabbitmq
docker compose up -d
```

---

## Task 1. Topology via script

**Why:** a reproducible setup for CI and the final project.

```bash
chmod +x courses/rabbitmq-intermediate/examples/dlx-setup.sh
./courses/rabbitmq-intermediate/examples/dlx-setup.sh
```

The script creates:

- exchange `dlx.orders` (topic, durable)
- queue `orders.dlq`
- binding `dlx.orders` → `orders.dlq`, rk `failed`
- queue `orders.work` with DLX arguments as in the deploy example

**What you'll see:** `OK: dlx.orders -> orders.dlq...`

---

## Task 2. Publish and successful processing

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course publish \
  exchange=amq.default routing_key=orders.work \
  payload='{"orderId":"OK-1","amount":10}'

docker exec mock-rabbitmq rabbitmqadmin -u course -p course get \
  queue=orders.work ackmode=ack_requeue_false
```

**What you'll see:** one message, `orders.dlq` is empty (`messages=0`).

---

## Task 3. Poison message → DLQ

We simulate a worker that rejects a message without requeue (there's no `get` + reject in rabbitmqadmin — so we use a **one-line Python consumer** or nack via management):

Simpler — **expire** via a short TTL in the separate lab 06; here — **reject** via `rabbitmqctl` eval or a second publish with an invalid scenario.

Skip the **exceeding delivery-limit** variant (quorum); for a classic-compatible work queue, use **reject** via amqp-tools, if installed, or the UI:

1. UI → Queues → `orders.work` → Get messages → **Reject** (requeue=false).

Or from the container with `python3`:

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

First place a BAD message:

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course publish \
  routing_key=orders.work payload='{"orderId":"BAD"}'
```

Then run the Python block above.

**What you'll see:** `orders.work` is empty; in `orders.dlq` — one message with routing key `failed`.

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages
docker exec mock-rabbitmq rabbitmqadmin -u course -p course get queue=orders.dlq ackmode=ack_requeue_false
```

---

## Task 4. Verify against dlx-policy.json

Open [`deploy/rabbitmq/examples/dlx-policy.json`](../../deploy/rabbitmq/examples/dlx-policy.json) and compare the `arguments` of the `orders.work` queue in the UI (Arguments).

**What you'll see:** `x-dead-letter-exchange` and `x-dead-letter-routing-key` match.

---

## Task 5. Comparison with SQS (theory)

Read the excerpt from [aws-intermediate/07-sqs-dlq.md](../aws-intermediate/07-sqs-dlq.md): `maxReceiveCount=3` ≈ three failed deliveries; in RabbitMQ the counter is in the application or `delivery-limit` on quorum.

Note down a single "SQS vs RabbitMQ DLQ" table (3 rows).

---

## Success criteria

- [ ] `dlx-setup.sh` ran without errors
- [ ] The poison message ended up in **orders.dlq**, not in work
- [ ] The DLX arguments match **dlx-policy.json**

Next theory: [05-ttl-priority.md](05-ttl-priority.md).
