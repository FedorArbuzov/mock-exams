# 24. Lab: multi-queue workers

## Goal

Run **two workers** with different `-Q` — fast orders aren't blocked by slow reports.

---

## Step 1. docker-compose override

Create `docker-compose.override.yml` (local):

```yaml
services:
  worker-orders:
    build: ./stack
    container_name: mock-celery-worker-orders
    command: celery -A shop.celery_app worker --loglevel=info --concurrency=4 -Q orders,default
    environment:
      CELERY_BROKER_URL: amqp://course:course@rabbitmq:5672//
      CELERY_RESULT_BACKEND: redis://redis:6379/0
    depends_on:
      rabbitmq:
        condition: service_healthy
    networks:
      - backend

  worker-reports:
    build: ./stack
    container_name: mock-celery-worker-reports
    command: celery -A shop.celery_app worker --loglevel=info --concurrency=1 -Q reports
    environment:
      CELERY_BROKER_URL: amqp://course:course@rabbitmq:5672//
      CELERY_RESULT_BACKEND: redis://redis:6379/0
    depends_on:
      rabbitmq:
        condition: service_healthy
    networks:
      - backend

  worker:
    profiles: ["single"]
```

```bash
docker compose --profile single stop worker  # or comment out default worker
docker compose up -d worker-orders worker-reports api
```

---

## Step 2. Flood test

Terminal 1 — 5 reports (slow):

```bash
for i in 1 2 3 4 5; do
  curl -s -X POST http://localhost:8093/reports/ -H "Content-Type: application/json" -d '{"report_type":"x"}'
done
```

Terminal 2 — orders should still process quickly:

```bash
curl -s -X POST http://localhost:8093/orders/ -H "Content-Type: application/json" \
  -d '{"order_id":"fast-1","amount":"1.00"}'
```

Orders worker handles while reports worker busy.

---

## Step 3. Verify consumers

```bash
docker exec mock-celery-rabbitmq rabbitmqctl list_queues name messages consumers
```

`orders` consumers on orders worker; `reports` on reports worker.

---

## Step 4. Revert

Remove the override, `docker compose up -d` the default single worker.

---

## Success criteria

- [ ] Split workers running
- [ ] Orders complete while reports back up
- [ ] Correct queue → worker binding in rabbitmqctl

Next: [25-api-integration](25-api-integration.md).
