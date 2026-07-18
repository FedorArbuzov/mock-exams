# 11. Финальный проект: hardened edge на deploy/nginx

## Задача

Собрать на [`deploy/nginx`](../../deploy/nginx/README.md) единый **production-like edge**: HTTPS, security headers, rate limit на `/login`, gzip, (опционально) proxy_cache для static, осознанный тюнинг `worker_connections` / keepalive. Оформить краткий **runbook** в `courses/nginx-intermediate/my-edge-notes.md` (локально, не обязательно в git) или в личном gist.

Проект замыкает [nginx-basic](../nginx-basic/README.md), [linux-intermediate TLS](../linux-intermediate/09-tls-openssl.md) и пересекается с [kuber-basic Ingress](../kuber-basic/20-ingress.md) — те же политики, другой носитель (файлы conf.d vs YAML).

---

## Требования (обязательно)

### 1. TLS

- Сертификаты через `bash scripts/gen-certs.sh`.
- Рабочий `https://localhost:8443/api/health` и `/static/`.
- `ssl_protocols TLSv1.2 TLSv1.3` (как в [examples/ssl-server-block.conf](examples/ssl-server-block.conf)).

### 2. Security headers (HTTPS server)

- `Strict-Transport-Security` с `max-age=86400` (лаба) или обоснованное значение в runbook.
- `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
- Все с `always`.

### 3. Rate limiting

- Зона `limit_req_zone` в `nginx.conf`.
- Location `/login` → backend `/slow`, при всплеске — **429** (см. [06-lab-rate-limit](06-lab-rate-limit.md)).

### 4. gzip

- Включён для text/json/js/css.
- Подтверждение: `curl -H 'Accept-Encoding: gzip' -I https://localhost:8443/static/`.

### 5. Документация (runbook)

Таблица в markdown:

| Сценарий | Команда / место |
|----------|-----------------|
| Проверить конфиг | `docker compose exec edge nginx -t` |
| Reload | `docker compose exec edge nginx -s reload` |
| Сгенерировать TLS | `bash scripts/gen-certs.sh` |
| 502 на API | `docker compose logs api` |
| 429 на login | ожидаемо при ab |
| Сброс стенда | `docker compose down -v` |

---

## Требования (на выбор, +2 пункта из списка)

1. **proxy_cache** для `/static/` + заголовок `X-Cache-Status` ([08-lab-cache](08-lab-cache.md)).
2. **HTTP → HTTPS redirect** на отдельном `server { listen 80; return 301 ... }` (учтите, что стенд мапит 8080→80).
3. **upstream keepalive** к `api` ([10-performance-tuning](10-performance-tuning.md)).
4. **Отдельный access_log** формат с `$request_time` и `$upstream_response_time`.
5. **WebSocket** location по [09-websocket-proxy](09-websocket-proxy.md) с `proxy_read_timeout 3600s`.

---

## Схема сдачи

```text
[браузер/curl]
    |  :8443 TLS
    v
[edge nginx]
    |-- /static/  --> [static]   (+ cache?, gzip)
    |-- /api/     --> [api]
    |-- /login    --> [api /slow] (+ limit_req)
```

---

## Пошаговый план

### Шаг 1. Базовый стенд

```bash
cd deploy/nginx
docker compose up -d --build
bash scripts/smoke.sh
```

### Шаг 2. TLS + headers

- `gen-certs.sh`, правки `10-tls.conf` по [02](02-lab-https.md) и [04](04-lab-hsts-headers.md).

### Шаг 3. Лимиты и gzip

- Проверить `00-default.conf` и `nginx.conf` по [06](06-lab-rate-limit.md), [08](08-lab-cache.md).

### Шаг 4. Тюнинг

- Зафиксировать в runbook значения `worker_processes`, `worker_connections`, `keepalive_timeout` и **почему** они выбраны для lab.

### Шаг 5. Приёмочные тесты

Скопируйте в runbook вывод:

```bash
curl -sk https://localhost:8443/api/health
curl -skI https://localhost:8443/ | grep -iE 'strict-transport|x-frame'
curl -sH 'Accept-Encoding: gzip' -sI https://localhost:8443/static/ | grep -i content-encoding
ab -n 40 -c 8 http://localhost:8080/login | tail -5
docker compose exec edge nginx -t
```

---

## Критерии оценки

| Критерий | Вес |
|----------|-----|
| TLS и API/static по HTTPS | обязательно |
| Headers с `always` | обязательно |
| Rate limit /login + 429 | обязательно |
| gzip | обязательно |
| Runbook | обязательно |
| +2 опциональных пункта | бонус |
| Чистый `nginx -t`, без секретов в git | гигиена |

---

## Чего не делать

- Не коммитьте `certs/*.key` и реальные production-сертификаты.
- Не ставьте HSTS `max-age` на год на общий dev-домен без понимания последствий.
- Не кэшируйте `/login` и ответы с `Set-Cookie`.

---

## Связь с Kubernetes (рефлексия)

Ответьте письменно (5–10 предложений в runbook):

1. Какой объект k8s заменяет `server {}` на edge?
2. Где в кластере хранятся TLS cert/key для Ingress?
3. Какую аннотацию ingress-nginx использовали бы для rate limit вместо `limit_req_zone`?

Подсказка: [20-ingress](../kuber-basic/20-ingress.md), финальный проект [kuber-intermediate/25-final-project](../kuber-intermediate/25-final-project.md).

---

## После курса

- [nginx-advanced](../nginx-advanced/README.md) — если появится в треке: WAF, njs, stream module.
- [gitlab-intermediate](../gitlab-intermediate/README.md) — CI, который деплоит конфиги.
- [observability-intermediate](../observability-intermediate/README.md) — метрики latency nginx.

Поздравляем с завершением **nginx — Intermediate**.
