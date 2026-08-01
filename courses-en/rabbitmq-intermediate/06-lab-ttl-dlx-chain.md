# 06. Lab: the TTL → DLX chain and priority (classic)

## Lab goal

Create a **checkout.hold** queue with a short TTL and a DLX to `orders.expired`, observe the dead letter on expiry; on a **classic** queue, demonstrate **priority**.

## Prerequisites

```bash
cd deploy/rabbitmq
docker compose up -d
```

The `dlx.orders` DLX may already exist after [04-lab-dlx](04-lab-dlx.md); otherwise run `dlx-setup.sh`.

---

## Task 1. The expired queue

```bash
curl -sf -u course:course -H "content-type: application/json" \
  -X PUT "http://localhost:15672/api/queues/%2F/orders.expired" \
  -d '{"durable":true}'

curl -sf -u course:course -H "content-type: application/json" \
  -X PUT "http://localhost:15672/api/bindings/%2F/e/dlx.orders/q/orders.expired" \
  -d '{"routing_key":"expired"}'
```

A hold queue with a 5-second TTL (for the lab):

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

Publish:

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course publish \
  routing_key=checkout.hold payload='{"orderId":"HOLD-1"}'
```

Wait **6+ seconds**, then check:

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages
```

**What you'll see:** `checkout.hold` — 0; `orders.expired` — 1.

---

## Task 2. Per-message TTL (classic)

Create `lab.ttl.msg` (classic, without quorum):

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course declare queue \
  name=lab.ttl.msg durable=true \
  arguments='{"x-dead-letter-exchange":"dlx.orders","x-dead-letter-routing-key":"expired"}'
```

Publish with expiration (rabbitmqadmin properties):

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course publish \
  routing_key=lab.ttl.msg payload='short' properties='{"expiration":"3000"}'
```

After 4 s, check `orders.expired` — the counter has grown.

---

## Task 3. Priority (classic only)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course declare queue \
  name=lab.priority durable=true arguments='{"x-max-priority":10}'

for p in 1 5 9; do
  docker exec mock-rabbitmq rabbitmqadmin -u course -p course publish \
    routing_key=lab.priority payload="prio-$p" properties="{\"priority\":$p}"
done
```

Do `get` three times without ack, then with ack — the delivery order to the consumer is often **9, 5, 1** (depends on the backlog; with a single consumer in the lab you usually see the priority effect).

**What you'll see:** higher priority comes out earlier when several are ready.

---

## Task 4. The chain as a diagram

Draw (in a notebook) the chain:

```text
checkout.hold --[TTL 5s]--> dlx.orders --[rk expired]--> orders.expired
orders.work   --[nack]----> dlx.orders --[rk failed]----> orders.dlq
```

Compare with **two** routing keys on a single DLX — one exchange, different DLQs/runbooks.

---

## Success criteria

- [ ] The message from `checkout.hold` landed in **orders.expired** via TTL
- [ ] Per-message expiration worked with the DLX
- [ ] The classic priority queue was created and ordering discussed

Next theory: [07-publisher-confirms.md](07-publisher-confirms.md).
