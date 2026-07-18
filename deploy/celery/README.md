# Celery для курса python-celery

Локальный стенд: **FastAPI API** + **Celery worker** + **beat** + **Flower** + **RabbitMQ** + **Redis**.

Курс: [python-celery](../../courses/python-celery/README.md).

## Запуск

```bash
cd deploy/celery
docker compose up -d --build
docker compose ps
```

| Сервис | URL / порт |
|--------|------------|
| API (health, trigger tasks) | [http://localhost:8093/health/](http://localhost:8093/health/) |
| Flower (monitoring) | [http://localhost:5555](http://localhost:5555) |
| RabbitMQ Management | [http://localhost:15673](http://localhost:15673) — `course` / `course` |
| AMQP (с хоста) | `localhost:5673` |
| Redis (internal) | `redis:6379` в compose-сети |

**Note:** порты **5673/15673** — чтобы не конфликтовать с [`deploy/rabbitmq`](../rabbitmq/README.md) (`5672/15672`).

## Smoke test

```bash
bash scripts/smoke.sh
# Windows:
powershell -File scripts/smoke.ps1
```

## Быстрые команды

```bash
# ping task
curl -s -X POST http://localhost:8093/tasks/ping/

# order processing
curl -s -X POST http://localhost:8093/orders/ \
  -H "Content-Type: application/json" \
  -d '{"order_id":"ord-1","amount":"29.99"}'

# task status
curl -s http://localhost:8093/tasks/<task_id>/

# worker logs
docker compose logs worker --tail=30
```

## CLI в контейнере

```bash
docker exec -it mock-celery-worker celery -A shop.celery_app inspect active
docker exec -it mock-celery-worker celery -A shop.celery_app inspect registered
docker exec -it mock-celery-rabbitmq rabbitmqctl list_queues name messages consumers
```

## Сброс

```bash
docker compose down -v
```

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| Tasks stuck in PENDING | worker не запущен; `docker compose logs worker` |
| Connection refused broker | дождитесь healthy rabbitmq |
| Result always PENDING | проверьте redis, `CELERY_RESULT_BACKEND` |
| Beat не шлёт tasks | `docker compose logs beat`; один beat на deployment |
| Port 5673 busy | остановите `deploy/rabbitmq` или измените mapping |

## Связанные курсы

- [rabbitmq-basic](../../courses/rabbitmq-basic/README.md) — AMQP fundamentals
- [redis-basic](../../courses/redis-basic/README.md) — result backend
- [fastapi](../../courses/fastapi/README.md) — trigger tasks from API
- [messaging-deep](../../courses/messaging-deep/README.md) — queue vs log theory
