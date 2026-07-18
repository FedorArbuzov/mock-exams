# 03. Лаба: explore Celery стенд

## Сценарий

Первый день на проекте — поднять локальный stack и убедиться, что **API → broker → worker → Redis** работает end-to-end.

**Цель:** `docker compose up`, smoke green, ручной walkthrough Flower + RabbitMQ UI.

---

## Шаг 1. Поднять stack

```bash
cd deploy/celery
docker compose up -d --build
docker compose ps
```

Все сервисы **running**; `rabbitmq` и `redis` — **healthy**.

---

## Шаг 2. Smoke

```bash
bash scripts/smoke.sh
```

Ожидаем: `ping SUCCESS`.

---

## Шаг 3. API endpoints

```bash
BASE=http://localhost:8093

curl -s $BASE/health/ | python -m json.tool

curl -s -X POST $BASE/tasks/ping/ | python -m json.tool
# сохраните task_id

curl -s $BASE/tasks/<task_id>/ | python -m json.tool
```

States: `PENDING` → `STARTED` → `SUCCESS`.

---

## Шаг 4. Order task

```bash
curl -s -X POST $BASE/orders/ \
  -H "Content-Type: application/json" \
  -d '{"order_id":"lab-001","amount":"49.99"}'

docker compose logs worker --tail=10
# Processing order_id=lab-001

curl -s $BASE/orders/lab-001/
```

---

## Шаг 5. RabbitMQ Management

Откройте [http://localhost:15673](http://localhost:15673) — `course` / `course`.

Проверьте:

- **Queues** — `default`, `orders`, `reports` (после первых tasks)
- **Connections** — worker + api connections
- **Message rates** — publish/deliver при POST /orders/

[`rabbitmq-basic`](../rabbitmq-basic/README.md) объяснит AMQP глубже.

---

## Шаг 6. Flower

[http://localhost:5555](http://localhost:5555) — active tasks, workers, task history.

---

## Шаг 7. Inspect CLI

```bash
docker exec mock-celery-worker celery -A shop.celery_app inspect registered
docker exec mock-celery-worker celery -A shop.celery_app inspect active_queues
docker exec mock-celery-worker celery -A shop.celery_app inspect stats
```

---

## Карта файлов

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

## Критерии приёмки

- [ ] smoke.sh exit 0
- [ ] ping task → SUCCESS
- [ ] order task в worker logs
- [ ] Flower показывает worker online
- [ ] RabbitMQ UI — queues visible

Далее: [04-celery-app-config](04-celery-app-config.md).
