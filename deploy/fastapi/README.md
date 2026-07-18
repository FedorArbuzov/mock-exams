# FastAPI стенд для курса fastapi

Стек: **FastAPI (uvicorn)** → **PostgreSQL 16** + **Redis 7**. Без nginx — API напрямую на хосте; для TLS/reverse proxy см. [`deploy/nginx`](../nginx/README.md) и урок [35-lab-nginx](../../courses/fastapi/35-lab-nginx.md).

Курс: [fastapi](../../courses/fastapi/README.md).

## Запуск

```bash
cd deploy/fastapi
docker compose up -d --build
```

| Сервис | URL |
|--------|-----|
| API | [http://localhost:8090](http://localhost:8090) |
| OpenAPI (Swagger) | [http://localhost:8090/docs](http://localhost:8090/docs) |
| ReDoc | [http://localhost:8090/redoc](http://localhost:8090/redoc) |
| Health | [http://localhost:8090/health](http://localhost:8090/health) |
| Prometheus metrics | [http://localhost:8090/metrics](http://localhost:8090/metrics) |
| Items API | [http://localhost:8090/api/v1/items](http://localhost:8090/api/v1/items) |

PostgreSQL и Redis **не** опубликованы на хост — только внутри compose. Для прямого `psql` используйте [`deploy/postgres`](../postgres/README.md) (порт `5432`).

## Smoke

```bash
bash scripts/smoke.sh
# .\scripts\smoke.ps1
```

## Полезные команды

```bash
docker compose ps
docker compose logs -f api
docker exec -it mock-fastapi-api sh
docker exec mock-fastapi-postgres psql -U course -d course -c '\dt'
docker exec mock-fastapi-redis redis-cli ping
```

## Сброс

```bash
docker compose down -v --rmi local
```

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| `8090` занят | смените порт в `docker-compose.yml` |
| api unhealthy | `docker compose logs api`, дождитесь postgres/redis health |
| конфликт с `deploy/postgres` | остановите другой compose на `5432` или не поднимайте оба одновременно |
| bcrypt ошибки на Windows | лабы auth — в контейнере, не на хосте |

## Связь с другими стендами

| Стенд | Когда |
|-------|-------|
| [`deploy/postgres`](../postgres/README.md) | углублённые SQL-лабы, pgAdmin |
| [`deploy/redis`](../redis/README.md) | cluster, Sentinel, persistence |
| [`deploy/observability`](../observability/README.md) | Grafana + Prometheus scrape |
| [`deploy/nginx`](../nginx/README.md) | TLS termination, rate limit |
| [`deploy/containers`](../containers/README.md) | Dockerfile patterns, registry |
