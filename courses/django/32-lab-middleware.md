# 32. Лаба: RequestTimingMiddleware

## Сценарий

SRE видит в Grafana latency spikes, но **нет correlation** между path и временем ответа. Добавим middleware, который логирует duration и отдаёт заголовок **`X-Request-Time-Ms`** — пригодится и для nginx access log, и для smoke-тестов.

**Предварительно:** [31-middleware](31-middleware.md), стенд `deploy/django` на **8092**.

---

## Цель

1. Создать `config/middleware.py` с `RequestTimingMiddleware`.
2. Зарегистировать в `MIDDLEWARE` после `SecurityMiddleware`.
3. Убедиться: `GET /health/` возвращает header; в логах gunicorn есть строка `path=/health/`.

---

## Шаг 1. Файл middleware

```python
# config/middleware.py
import logging
import time

logger = logging.getLogger(__name__)


class RequestTimingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        response = self.get_response(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "request_timing path=%s method=%s status=%s ms=%.2f",
            request.path,
            request.method,
            response.status_code,
            elapsed_ms,
        )
        response["X-Request-Time-Ms"] = f"{elapsed_ms:.2f}"
        return response
```

---

## Шаг 2. settings.py

```python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "config.middleware.RequestTimingMiddleware",  # ← после Security
    "whitenoise.middleware.WhiteNoiseMiddleware",
    ...
]
```

**Почему после Security:** SecurityMiddleware может коротко замыкать запрос (redirect HTTPS) — timing всё равно полезен для «полного» пути до view.

---

## Шаг 3. Rebuild и проверка

```bash
cd deploy/django
docker compose up -d --build
curl -sI http://localhost:8092/health/ | grep -i x-request-time
docker compose logs web --tail=30 | grep request_timing
```

Ожидаемый header:

```http
X-Request-Time-Ms: 1.23
```

---

## Шаг 4. Расширение (опционально)

- Пропускать `/static/` и `/admin/jsi18n/` — не засорять лог.
- Добавить `X-Request-Id` из `uuid.uuid4()` — связка с [`nginx-basic`](../nginx-basic/README.md) `$request_id`.

```python
if request.path.startswith("/static/"):
    return self.get_response(request)
```

---

## Типичные проблемы

| Симптом | Причина | Fix |
|---------|---------|-----|
| Header нет | middleware не в списке / опечатка path | `manage.py check`, rebuild |
| Логов нет | LOGGING level WARNING | добавить handler для `config.middleware` |
| Двойной header | middleware дважды в MIDDLEWARE | убрать дубликат |

---

## Критерии приёмки

- [ ] `curl -sI http://localhost:8092/health/` содержит `X-Request-Time-Ms`
- [ ] `docker compose logs web` содержит `request_timing path=/health/`
- [ ] `GET /api/v1/products/` тоже получает header (middleware глобальный)

---

## Что вы поняли

Middleware — **единая точка** для cross-cutting concerns без дублирования в каждом view/ViewSet. DRF views проходят тот же стек.

Далее: [33-caching-redis](33-caching-redis.md).
