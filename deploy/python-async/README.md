# Python asyncio — стенд для лаб

Три **медленных mock-сервиса** (200 / 350 / 500 ms) + **gateway** с fan-out. Используется в лабах курса [`python-async`](../../courses/python-async/README.md) для сравнения **sequential vs parallel** async HTTP.

## Запуск

```bash
cd deploy/python-async
docker compose up -d --build
```

| URL | Назначение |
|-----|------------|
| [http://localhost:8095/health](http://localhost:8095/health) | Gateway health |
| [http://localhost:8095/slow?extra_ms=100](http://localhost:8095/slow?extra_ms=100) | Задержка ~150 ms |
| [http://localhost:8095/json?size=20](http://localhost:8095/json?size=20) | JSON payload |
| [http://localhost:8095/fail?rate=0.5](http://localhost:8095/fail?rate=0.5) | Случайные 503 |
| [http://localhost:8095/aggregate](http://localhost:8095/aggregate) | **Sequential** fan-out (~1 s) |
| [http://localhost:8095/aggregate-parallel](http://localhost:8095/aggregate-parallel) | **Parallel** fan-out (~500 ms) |

Внутри compose сервисы: `slow-a`, `slow-b`, `slow-c`, `gateway`. С хоста доступен только **gateway** на порту **8095**.

## Smoke

```bash
bash scripts/smoke.sh
# .\scripts\smoke.ps1
```

## Сброс

```bash
docker compose down -v --rmi local
```

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| `8095` занят | смените порт в `docker-compose.yml` |
| aggregate 502 | `docker compose ps`, дождитесь healthy всех сервисов |
| лабы на хосте | `pip install httpx`; `BASE=http://localhost:8095` |

## Связь

| Стенд | Когда |
|-------|-------|
| [`deploy/fastapi`](../fastapi/README.md) | async в production API (после курса) |
| [`deploy/redis`](../redis/README.md) | rate limit, cache в capstone |
| [`deploy/postgres`](../postgres/README.md) | asyncpg лабы |
