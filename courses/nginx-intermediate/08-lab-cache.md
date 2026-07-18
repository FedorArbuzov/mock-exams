# 08. Лаба: gzip и proxy_cache для /static/

## Цель

Включить **gzip** в `nginx.conf` и **proxy_cache** для location `/static/` на HTTP edge; убедиться в `Content-Encoding: gzip` и `X-Cache-Status: HIT` на повторных запросах.

## Предварительно

- [07-caching-gzip](07-caching-gzip.md)
- Стенд `deploy/nginx` запущен

---

## Задание 1. gzip в nginx.conf

В блок `http {` файла `deploy/nginx/config/nginx.conf` добавьте (если ещё нет):

```nginx
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

```bash
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
```

Проверка:

```bash
curl -sH 'Accept-Encoding: gzip' -D - http://localhost:8080/static/ -o /tmp/out.gz | grep -i content-encoding
file /tmp/out.gz
```

**Ожидание:** заголовок `Content-Encoding: gzip`.

---

## Задание 2. Каталог кэша в контейнере

Добавьте в `docker-compose.yml` для сервиса `edge` volume (если ещё нет):

```yaml
    volumes:
      - nginx_cache:/var/cache/nginx
```

И в конец файла:

```yaml
volumes:
  nginx_cache:
```

Либо для быстрой лабы без правки compose — cache path на tmp:

```nginx
proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=static_cache:10m max_size=50m inactive=10m;
```

(в `http {}`).

---

## Задание 3. proxy_cache для /static/

В `config/conf.d/00-default.conf` в `location /static/` **перед** `proxy_pass`:

```nginx
        proxy_cache static_cache;
        proxy_cache_valid 200 10m;
        add_header X-Cache-Status $upstream_cache_status always;
```

В `nginx.conf` в `http {}`:

```nginx
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static_cache:10m max_size=50m inactive=10m;
```

Создайте каталог при использовании `/var/cache/nginx`:

```bash
docker compose exec edge mkdir -p /var/cache/nginx
docker compose exec edge chown nginx:nginx /var/cache/nginx
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
```

---

## Задание 4. MISS → HIT

```bash
curl -sI http://localhost:8080/static/ | grep -i x-cache-status
curl -sI http://localhost:8080/static/ | grep -i x-cache-status
```

**Ожидание:** первый запрос `MISS` (или `MISS`/`REVALIDATED`), второй — `HIT`.

---

## Задание 5. API без кэша

```bash
curl -sI http://localhost:8080/api/health | grep -i x-cache-status
```

**Ожидание:** заголовка нет или `BYPASS` — health не должен кэшироваться.

---

## Задание 6. Сброс кэша

```bash
docker compose exec edge rm -rf /var/cache/nginx/*
# или пересоздать volume: docker compose down -v && docker compose up -d
```

Повторите два curl — снова `MISS`.

---

## Критерии сдачи

- [ ] gzip подтверждён для `/static/`
- [ ] Второй GET на `/static/` даёт `X-Cache-Status: HIT`
- [ ] `/api/health` не отдаёт HIT от proxy_cache
- [ ] Объясняете разницу MISS и HIT

---

## Откат

Уберите строки `proxy_cache*` и `proxy_cache_path`, reload. Оставить gzip можно.

---

## Что дальше

[09. WebSocket proxy](09-websocket-proxy.md).
