# 03. Lab: explore the Celery stack

## Scenario

First day on the project — bring up the local stack and confirm that **API → broker → worker → Redis** works end-to-end.

**Goal:** `docker compose up`, smoke green, a manual walkthrough of Flower + the RabbitMQ UI.

---

## Step 1. Bring up the stack

```bash
cd deploy/celery
docker compose up -d --build
docker compose ps
```

All services **running**; `rabbitmq` and `redis` are **healthy**.

---

## Step 2. Smoke

```bash
bash scripts/smoke.sh
```

Expected: `ping SUCCESS`.

---

## Step 3. API endpoints

```bash
BASE=http://localhost:8093

curl -s $BASE/health/ | python -m json.tool

curl -s -X POST $BASE/tasks/ping/ | python -m json.tool
# save the task_id

curl -s $BASE/tasks/<task_id>/ | python -m json.tool
```

States: `PENDING` → `STARTED` → `SUCCESS`.

---

## Step 4. Order task

```bash
curl -s -X POST $BASE/orders/ \
  -H "Content-Type: application/json" \
  -d '{"order_id":"lab-001","amount":"49.99"}'

docker compose logs worker --tail=10
# Processing order_id=lab-001

curl -s $BASE/orders/lab-001/
```

---

## Step 5. RabbitMQ Management

Open [http://localhost:15673](http://localhost:15673) — `course` / `course`.

Check:

- **Queues** — `default`, `orders`, `reports` (after the first tasks)
- **Connections** — worker + api connections
- **Message rates** — publish/deliver on POST /orders/

[`rabbitmq-basic`](../rabbitmq-basic/README.md) explains AMQP in more depth.

---

## Step 6. Flower

[http://localhost:5555](http://localhost:5555) — active tasks, workers, task history.

---

## Step 7. Inspect CLI

```bash
docker exec mock-celery-worker celery -A shop.celery_app inspect registered
docker exec mock-celery-worker celery -A shop.celery_app inspect active_queues
docker exec mock-celery-worker celery -A shop.celery_app inspect stats
```

---

## File map

| File | Role |
|------|------|
| `shop/celery_app.py` | Celery instance + config |
| `shop/tasks.py` | task functions |
| `shop/main.py` | FastAPI triggers |
| `docker-compose.yml` | api, worker, beat, flower |

---

## Troubleshooting lab

| Symptom | Check |
|---------|-------|
| PENDING forever | `docker compose logs worker` |
| Connection refused | rabbitmq healthy? |
| 8093 refused | api container up? |

---

## Success criteria

- [ ] smoke.sh exit 0
- [ ] ping task → SUCCESS
- [ ] order task in worker logs
- [ ] Flower shows the worker online
- [ ] RabbitMQ UI — queues visible

Next: [04-celery-app-config](04-celery-app-config.md).
