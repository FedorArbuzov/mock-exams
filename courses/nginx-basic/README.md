# nginx — Basic (reverse proxy на Docker)

Курс для **DevOps** и backend-разработчиков: nginx как **edge** — виртуальные хосты, статика, **reverse proxy**, заголовки **X-Forwarded-\***, разбор **502**, **upstream** и мост к **Ingress** в Kubernetes.

**Предварительно:** HTTP и терминал ([`linux-basic`](../linux-basic/README.md)); обзор nginx на VM — [`linux-intermediate/13-nginx`](../linux-intermediate/13-nginx.md). Контейнерный nginx в стеке Compose — [`containers-basic/10-compose-multi-service`](../containers-basic/10-compose-multi-service.md) и [`deploy/containers/stack/web`](../../deploy/containers/stack/web/nginx.conf).

**Локально:** [`deploy/nginx`](../../deploy/nginx/README.md) — `docker compose up -d --build`:

| Сервис / URL | Назначение |
|--------------|------------|
| Edge | [http://localhost:8080](http://localhost:8080) — health `edge OK` |
| Static | [http://localhost:8080/static/](http://localhost:8080/static/) |
| API | [http://localhost:8080/api/health](http://localhost:8080/api/health) |
| TLS (после `gen-certs.sh`) | [https://localhost:8443](https://localhost:8443) |

Контейнеры: `mock-nginx-edge`, `mock-nginx-static`, `mock-nginx-api`. Проверка конфига: `docker compose exec mock-nginx-edge nginx -t`. Smoke: `bash scripts/smoke.sh` в `deploy/nginx`.

**Дальше:** [`nginx-intermediate`](../nginx-intermediate/README.md) — rate limit, TLS hardening; [`kuber-basic/20-ingress`](../kuber-basic/20-ingress.md) — Ingress Controller.

## Как читать главы

1. **Теория** (01, 02, 04…) — сценарий с работы, таблицы, типичные ошибки.
2. **Лаба** (03, 05…) — стенд в `deploy/nginx` поднят заранее.
3. После правки `config/conf.d/*.conf`: **`nginx -t`** → **`nginx -s reload`** в edge.
4. 502 или 404 на API — [`deploy/nginx/README.md`](../../deploy/nginx/README.md) (troubleshooting).

**Время:** ~**40–50 минут** на пару «теория + лаба»; [финальный проект](11-final-project.md) — **2–3 часа**. Весь курс — **~6–8 часов**.

## Программа

### Роль nginx и архитектура (01–03)

1. [Зачем nginx: edge vs app server](01-why-nginx.md)
2. [Архитектура стенда: master/worker, conf.d, compose](02-architecture.md) · 3. [Лаба: vhost и статика](03-lab-vhost-static.md)

### Reverse proxy (04–05)

4. [Reverse proxy: proxy_pass, X-Forwarded-*](04-reverse-proxy.md) · 5. [Лаба: proxy_pass и слэш](05-lab-proxy-pass.md)

### Логи и 502 (06–07)

6. [access/error log и диагностика 502](06-logs-502.md) · 7. [Лаба: намеренный 502](07-lab-502-debug.md)

### Upstream (08–09)

8. [upstream: балансировка и health](08-upstream.md) · 9. [Лаба: upstream в compose](09-lab-upstream.md)

### Kubernetes и финал (10–11)

10. [Ingress: теория и связь с nginx](10-ingress-preview.md)
11. [Финальный проект: edge-маршрутизация](11-final-project.md)

## Что должно получиться

- Объясняете разницу **edge nginx** и **app server** (Flask, gunicorn, nginx-static).
- Читаете структуру конфига на стенде: `nginx.conf`, `conf.d/`, Docker DNS (`api`, `static`).
- Настраиваете **location**, **root**, **proxy_pass** без ловушки **trailing slash**.
- Проставляете **X-Forwarded-For / Proto** для backend за TLS.
- По **error.log** отличаете connection refused от timeout.
- Описываете **upstream** и зачем тот же паттерн в **Ingress**.
- Связываете лабу с [`containers-basic`](../containers-basic/README.md) (web проксирует `/api/`).

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/proxy-pass-snippet.conf`](examples/proxy-pass-snippet.conf) | proxy_pass + X-Forwarded-* |
| [`examples/upstream.conf`](examples/upstream.conf) | upstream + proxy_pass |

## Связанные материалы

| Курс / стенд | Связь |
|--------------|--------|
| [linux-intermediate/13](../linux-intermediate/13-nginx.md) | vhost, proxy на VM |
| [containers-basic](../containers-basic/README.md) | nginx в образе `web` |
| [deploy/nginx](../../deploy/nginx/README.md) | edge :8080 / :8443 |
| [kuber-basic/20-ingress](../kuber-basic/20-ingress.md) | Ingress Controller |
