# nginx — Intermediate

Промежуточный курс по **nginx как edge reverse proxy**: **TLS termination**, **заголовки безопасности**, **rate limiting**, **кэш и gzip**, **WebSocket**, **тюнинг производительности** и **финальный проект** на Docker-стенде [`deploy/nginx`](../../deploy/nginx/README.md).

Формат — «книжные» главы на русском: теория → лабораторная работа. Стенд уже содержит HTTP :8080, HTTPS :8443 (после генерации сертификатов), backends **static** и **api**, location `/login` для rate limit.

## Для кого

- Пройден или эквивалентен [`nginx-basic`](../nginx-basic/README.md): `server` / `location`, `proxy_pass`, заголовки `X-Forwarded-*`, `nginx -t` и `reload`.
- Понимаете TLS на уровне [`linux-intermediate/09-tls-openssl`](../linux-intermediate/09-tls-openssl.md) (ключ, сертификат, SAN, self-signed).
- Умеете `curl`, Docker Compose; полезно знать [Ingress в Kubernetes](../kuber-basic/20-ingress.md) — те же идеи маршрутизации и TLS на периметре.

## Стенд

```bash
cd deploy/nginx
docker compose up -d --build
bash scripts/smoke.sh
```

| URL | Назначение |
|-----|------------|
| http://localhost:8080/ | health edge |
| http://localhost:8080/static/ | static backend |
| http://localhost:8080/api/health | API |
| http://localhost:8080/login | rate limit (лаба 06) |
| https://localhost:8443/ | TLS после `gen-certs.sh` |

TLS для лаб:

```bash
bash scripts/gen-certs.sh
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
curl -sk https://localhost:8443/api/health
```

Браузер предупредит о self-signed — нормально для учебной среды.

## Связанные курсы

| Курс | Связь |
|------|--------|
| [nginx-basic](../nginx-basic/README.md) | reverse proxy, upstream, логи |
| [linux-intermediate/09-tls-openssl](../linux-intermediate/09-tls-openssl.md) | OpenSSL, цепочка CA, проверка cert |
| [linux-intermediate/13-nginx](../linux-intermediate/13-nginx.md) | vhost и proxy на VM (краткий обзор) |
| [kuber-basic/20-ingress](../kuber-basic/20-ingress.md) | Ingress Controller ≈ nginx на периметре |
| [kuber-intermediate](../kuber-intermediate/README.md) | Helm, NetworkPolicy, финальный проект с Ingress |
| [containers-basic](../containers-basic/README.md) | образ `nginx:alpine`, сети Compose |

## Программа

| № | Теория | Лаба |
|---|--------|------|
| 01 | [TLS termination](01-tls-termination.md) | [02 — HTTPS на стенде](02-lab-https.md) |
| 03 | [Security headers и HSTS](03-security-headers.md) | [04 — заголовки на edge](04-lab-hsts-headers.md) |
| 05 | [Rate limiting](05-rate-limiting.md) | [06 — /login и 429](06-lab-rate-limit.md) |
| 07 | [Кэш и gzip](07-caching-gzip.md) | [08 — proxy_cache / gzip](08-lab-cache.md) |
| 09 | [WebSocket proxy](09-websocket-proxy.md) | заметка в главе |
| 10 | [Performance tuning](10-performance-tuning.md) | — |
| 11 | [Финальный проект](11-final-project.md) | edge «как в проде» |

## Примеры в репозитории

| Путь | Назначение |
|------|------------|
| [examples/ssl-server-block.conf](examples/ssl-server-block.conf) | блок `server` для 443 |
| [examples/rate-limit.conf](examples/rate-limit.conf) | `limit_req_zone` + location |
| [`deploy/nginx/config/`](../../deploy/nginx/config/) | рабочие конфиги стенда |

## Оценка времени

| Блок | Часы |
|------|------|
| TLS + headers (01–04) | 3–4 |
| Rate limit + cache (05–08) | 3–4 |
| WebSocket + tuning (09–10) | 2–3 |
| Финальный проект (11) | 3–5 |
| **Итого** | **~11–16 ч** |

## Чек-лист выпускника

- [ ] Включаете HTTPS на edge: cert/key, `ssl_protocols`, проверка `curl -vk`.
- [ ] Добавляете HSTS и базовые security headers; понимаете `always` у `add_header`.
- [ ] Настраиваете `limit_req_zone` и объясняете разницу `rate`, `burst`, `nodelay`.
- [ ] Включаете `gzip` и (опционально) `proxy_cache` для статики/API.
- [ ] Знаете директивы WebSocket: `Upgrade`, `Connection`, `proxy_http_version 1.1`.
- [ ] Тюните `worker_connections`, `keepalive_timeout`, понимаете связь с нагрузкой.
- [ ] Собираете финальный vhost: TLS + headers + limit + gzip на [`deploy/nginx`](../../deploy/nginx/README.md).

## Отладка

```bash
docker compose logs -f edge
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
tail -f deploy/nginx/logs/error.log
```

См. [Troubleshooting в README стенда](../../deploy/nginx/README.md).
