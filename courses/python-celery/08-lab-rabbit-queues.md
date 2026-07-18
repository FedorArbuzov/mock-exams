# 08. Лаба: очереди в RabbitMQ Management UI

## Цель

Наблюдать **publish → queue → consume** для `default`, `orders`, `reports`. Понять backlog при stopped worker.

---

## Шаг 1. Baseline

```bash
docker compose up -d
open http://localhost:15673  # course / course
```

Queues → должны появиться после первых tasks.

---

## Шаг 2. Flood orders queue

```bash
for i in $(seq 1 10); do
  curl -s -X POST http://localhost:8093/orders/ \
    -H "Content-Type: application/json" \
    -d "{\"order_id\":\"q-$i\",\"amount\":\"1.00\"}"
done
```

UI: queue **`orders`** — messages spike, then drain.

---

## Шаг 3. Stop worker — backlog

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

## Шаг 4. CLI inspect

```bash
docker exec mock-celery-rabbitmq rabbitmqctl list_queues name messages consumers
```

| Column | Meaning |
|--------|---------|
| messages | ready + unacked |
| consumers | worker bindings |

---

## Шаг 5. Report queue

```bash
curl -s -X POST http://localhost:8093/reports/ \
  -H "Content-Type: application/json" \
  -d '{"report_type":"weekly"}'
```

Worker logs — 3s sleep — queue **`reports`**.

---

## Шаг 6. Rate graph

Management → Queues → select `orders` → **Message rates** chart during flood.

---

## Критерии приёмки

- [ ] Видны queues: default, orders, reports
- [ ] Backlog при stopped worker
- [ ] Drain после start worker
- [ ] `consumers >= 1` когда worker up

Далее: [09-redis-backend](09-redis-backend.md).
