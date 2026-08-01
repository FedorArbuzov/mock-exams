# 08. Lab: queues in the RabbitMQ Management UI

## Goal

Observe **publish → queue → consume** for `default`, `orders`, `reports`. Understand the backlog when the worker is stopped.

---

## Step 1. Baseline

```bash
docker compose up -d
open http://localhost:15673  # course / course
```

Queues → should appear after the first tasks.

---

## Step 2. Flood the orders queue

```bash
for i in $(seq 1 10); do
  curl -s -X POST http://localhost:8093/orders/ \
    -H "Content-Type: application/json" \
    -d "{\"order_id\":\"q-$i\",\"amount\":\"1.00\"}"
done
```

UI: queue **`orders`** — messages spike, then drain.

---

## Step 3. Stop the worker — backlog

```bash
docker compose stop worker

for i in $(seq 1 5); do
  curl -s -X POST http://localhost:8093/tasks/ping/
done
```

Queue **`default`** — messages **accumulate** (durable).

```bash
docker compose start worker
# watch drain
```

---

## Step 4. CLI inspect

```bash
docker exec mock-celery-rabbitmq rabbitmqctl list_queues name messages consumers
```

| Column | Meaning |
|--------|---------|
| messages | ready + unacked |
| consumers | worker bindings |

---

## Step 5. Report queue

```bash
curl -s -X POST http://localhost:8093/reports/ \
  -H "Content-Type: application/json" \
  -d '{"report_type":"weekly"}'
```

Worker logs — 3s sleep — queue **`reports`**.

---

## Step 6. Rate graph

Management → Queues → select `orders` → **Message rates** chart during flood.

---

## Success criteria

- [ ] Queues visible: default, orders, reports
- [ ] Backlog when the worker is stopped
- [ ] Drain after starting the worker
- [ ] `consumers >= 1` when the worker is up

Next: [09-redis-backend](09-redis-backend.md).
