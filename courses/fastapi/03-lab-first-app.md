# 03. Лаба: первое приложение

## Цель лабы

Поднять стенд [`deploy/fastapi`](../../deploy/fastapi/README.md), изучить **OpenAPI** и **Swagger UI**, добавить локальный эндпоинт `GET /api/v1/ping` (в отдельном файле или временно в `main.py`), проверить ответы через `curl` и зафиксировать наблюдения.

## Предварительно

- Docker запущен, порт **8090** свободен.
- Прочитаны [01. Ландшафт](01-landscape.md) и [02. Первое приложение](02-first-app.md).
- `curl` и опционально `jq`.

```bash
cd deploy/fastapi
docker compose up -d --build
docker compose ps
bash scripts/smoke.sh
```

Контейнер `mock-fastapi-api` должен стать **healthy** (подождите 20–40 с, пока postgres/redis пройдут healthcheck).

---

## Задание 1. Smoke и health

**Зачем:** убедиться, что ASGI-сервер отвечает.

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8090/health
curl -s http://localhost:8090/health
```

**Что увидите:** код `200` и JSON `{"status":"ok"}` (или эквивалент из `health` router).

**Если Connection refused:** `docker compose logs api`; дождитесь `Application startup complete`.

---

## Задание 2. OpenAPI и Swagger

**Зачем:** партнёры и QA работают с `/docs`.

```bash
curl -s http://localhost:8090/openapi.json | head -c 400
```

Откройте в браузере:

- [http://localhost:8090/docs](http://localhost:8090/docs)
- [http://localhost:8090/redoc](http://localhost:8090/redoc)

**Что увидите:** теги `health`, `items`; пути `/health`, `/api/v1/items`, `/metrics`.

Найдите в Swagger операцию `GET /api/v1/items` и выполните **Try it out**.

---

## Задание 3. Items API

**Зачем:** понять формат ответа эталонного роутера.

```bash
curl -s http://localhost:8090/api/v1/items | jq .
curl -s http://localhost:8090/api/v1/items/1 | jq .
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8090/api/v1/items/999
```

**Что увидите:** список с `items` и `total`; item `id: 1`; для `999` — тело с `detail` (код может быть 200 с JSON-ошибкой — зафиксируйте фактическое поведение стенда).

---

## Задание 4. Локальный mini-app (без Docker)

**Зачем:** отработать цикл dev до правок в стенде.

Создайте каталог `~/fastapi-lab` и файл `main.py`:

```python
from fastapi import FastAPI

app = FastAPI(title="Lab Ping")

@app.get("/api/v1/ping")
async def ping():
    return {"pong": True}
```

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install "fastapi[standard]"
uvicorn main:app --reload --port 8000
```

В другом терминале:

```bash
curl -s http://localhost:8000/api/v1/ping
curl -s http://localhost:8000/openapi.json | jq '.paths["/api/v1/ping"]'
```

**Что увидите:** `{"pong":true}` и описание операции `get` в OpenAPI.

Остановите uvicorn (`Ctrl+C`).

---

## Задание 5. Метрики (опционально)

**Зачем:** связь с [`observability-basic`](../observability-basic/README.md).

```bash
curl -s http://localhost:8090/metrics | head -20
```

**Что увидите:** текст Prometheus, метрика `fastapi_http_requests_total` после нескольких запросов.

---

## Задание 6. Логи контейнера

**Зачем:** при отладке prod-like окружения смотрите stdout.

```bash
docker compose logs api --tail 30
```

Выполните пару `curl` к `/api/v1/items` и снова посмотрите логи.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| Порт 8090 занят | смените mapping в `docker-compose.yml` или остановите конфликтующий процесс |
| `api` unhealthy | `docker compose logs postgres redis api`; дождитесь health |
| `smoke.sh` fail | запустите команды из smoke вручную; проверьте `curl` |
| Пустой `/docs` | убедитесь, что контейнер пересобран: `docker compose up -d --build` |
| `pip install` медленный | используйте зеркало или venv из кэша |

---

## Критерии успеха

- [ ] `docker compose ps` — api **healthy**
- [ ] `smoke.sh` завершился без ошибок
- [ ] `/docs` открывается, `GET /api/v1/items` работает из Swagger
- [ ] Локальный `uvicorn` отдал `/api/v1/ping` с OpenAPI-описанием
- [ ] Понятно, где в репозитории лежит код стенда (`deploy/fastapi/stack/api`)

## Уборка

```bash
# только остановить стенд (данные в volume сохранятся)
docker compose stop

# полный сброс (если нужно)
docker compose down -v --rmi local
```

Локальный venv: удалите каталог `~/fastapi-lab` при желании.

## Вопросы для самопроверки

1. Чем отличается URL стенда (`8090`) от локального uvicorn (`8000`)?
2. Где в OpenAPI JSON искать список тегов?
3. Зачем `lifespan` в `main.py` стенда?
4. Какой следующий урок вводит **Pydantic v2**?

Следующий урок: [04. Pydantic v2](04-pydantic-v2.md).
