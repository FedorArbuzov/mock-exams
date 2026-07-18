# 35. Лаба: FastAPI за nginx

## Цель лабы

Поставить API из [`deploy/fastapi`](../../deploy/fastapi/README.md) за reverse proxy [`deploy/nginx`](../../deploy/nginx/README.md): маршрутизация `/api/`, TLS (опционально), rate limit, корректные forwarded headers. Один URL для клиента — edge на **8080/8443**, backend FastAPI внутри сети compose.

Теория: [34-nginx-tls](34-nginx-tls.md). Аналог в nginx-курсе: [nginx-intermediate/02-lab-https](../nginx-intermediate/02-lab-https.md).

---

## Архитектура лабы

```text
[curl :8080]
     |
[edge nginx]  -- /api/* --> [mock-fastapi-api:8000]
     |
[static backend]  /static/
```

Вариант A: nginx и fastapi в **одной** docker network (override compose).  
Вариант B: nginx `proxy_pass http://host.docker.internal:8090` (Windows/Mac).

---

## Задание 1. Поднять оба стенда

```bash
cd deploy/fastapi
docker compose up -d --build

cd deploy/nginx
docker compose up -d --build
bash scripts/smoke.sh
```

Проверьте напрямую: `curl -s http://localhost:8090/health`.

---

## Задание 2. Связать сети (вариант A)

Создайте `deploy/nginx/docker-compose.override.yml` (локально):

```yaml
services:
  edge:
    networks:
      - default
      - fastapi_backend

networks:
  fastapi_backend:
    external: true
    name: fastapi_backend
```

Имя сети смотрите: `docker network ls | grep fastapi`.

В `config/conf.d/00-default.conf` добавьте upstream:

```nginx
upstream course_fastapi {
    server mock-fastapi-api:8000;
    keepalive 16;
}

location /course-api/ {
    proxy_pass http://course_fastapi/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "";
}
```

```bash
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
curl -s http://localhost:8080/course-api/health
curl -s http://localhost:8080/course-api/api/v1/items
```

---

## Задание 3. ProxyHeaders в FastAPI

В `app/main.py` стенда fastapi:

```python
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])
```

Добавьте debug endpoint `/debug/client` — возвращает `request.url.scheme` и client host. За nginx схема должна быть `http` (или `https` на TLS).

---

## Задание 4. TLS (опционально, +бонус)

```bash
cd deploy/nginx
bash scripts/gen-certs.sh
# включите 10-tls.conf, reload
curl -sk https://localhost:8443/course-api/health
curl -skI https://localhost:8443/ | grep -i strict-transport
```

---

## Задание 5. Rate limit на write path

Скопируйте паттерн из `20-rate-limit.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=course_api_write:10m rate=2r/s;

location /course-api/api/v1/items {
    limit_req zone=course_api_write burst=5 nodelay;
    proxy_pass http://course_fastapi/api/v1/items;
    # ... headers ...
}
```

Только для `POST` — отдельный `location` или map (упрощённо — лимит на весь path).

```bash
for i in $(seq 1 20); do curl -s -o /dev/null -w "%{http_code} " \
  -X POST http://localhost:8080/course-api/api/v1/items \
  -H "Content-Type: application/json" -d '{"title":"t"}'; done
echo
```

Ожидайте **429** от nginx.

---

## Задание 6. Access log с upstream time

```nginx
log_format upstream_timing '$remote_addr - $request '
  'status=$status rt=$request_time urt=$upstream_response_time';

access_log /var/log/nginx/course_api.log upstream_timing;
```

Сделайте 10 запросов, найдите в `logs/access.log` поле `urt=`.

---

## Задание 7. Smoke checklist

| Проверка | Команда | Ожидание |
|----------|---------|----------|
| Health via proxy | `curl :8080/course-api/health` | 200 |
| Items list | `curl :8080/course-api/api/v1/items` | JSON |
| nginx config | `nginx -t` | ok |
| Direct still works | `curl :8090/health` | 200 |
| Rate limit | loop POST | 429 |

---

## Критерии сдачи

| Критерий | Обязательно |
|----------|-------------|
| API доступен только через nginx path | да |
| Forwarded headers / ProxyHeaders | да |
| `nginx -t` без ошибок | да |
| Документирован URL для клиентов | да |
| TLS или rate limit | один из двух минимум |

---

## Связь с Kubernetes

Ответьте письменно (3–5 предложений):

1. Какой объект заменяет `location /course-api/`?
2. Где termination TLS в managed K8s?
3. Какие аннотации ingress-nginx для `limit_req`?

Подсказка: [kuber-intermediate/13-probes-advanced](../kuber-intermediate/13-probes-advanced.md), [kuber-basic/20-ingress](../kuber-basic/20-ingress.md).

---

## Резюме

Лаба соединяет **два стенда** в production-like топологию: edge nginx + FastAPI upstream. Проверьте **path mapping**, **headers** и **лимиты** до observability ([36-observability](36-observability.md)).

## Чек-лист

- Как nginx резолвит `mock-fastapi-api`?
- Зачем `keepalive` к upstream?
- 502 — первые три шага отладки?
- Чем lab edge отличается от Ingress?

Следующий урок: [36-observability](36-observability.md).
