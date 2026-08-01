# 08. Lab: gzip and proxy_cache for /static/

## Goal

Enable **gzip** in `nginx.conf` and **proxy_cache** for the `/static/` location on the HTTP edge; confirm `Content-Encoding: gzip` and `X-Cache-Status: HIT` on repeat requests.

## Prerequisites

- [07-caching-gzip](07-caching-gzip.md)
- The `deploy/nginx` stand is running

---

## Task 1. gzip in nginx.conf

In the `http {` block of `deploy/nginx/config/nginx.conf`, add (if not already there):

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

Verification:

```bash
curl -sH 'Accept-Encoding: gzip' -D - http://localhost:8080/static/ -o /tmp/out.gz | grep -i content-encoding
file /tmp/out.gz
```

**Expected:** the header `Content-Encoding: gzip`.

---

## Task 2. Cache directory in the container

Add a volume to `docker-compose.yml` for the `edge` service (if not already there):

```yaml
    volumes:
      - nginx_cache:/var/cache/nginx
```

And at the end of the file:

```yaml
volumes:
  nginx_cache:
```

Or, for a quick lab without editing compose — a cache path on tmp:

```nginx
proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=static_cache:10m max_size=50m inactive=10m;
```

(in `http {}`).

---

## Task 3. proxy_cache for /static/

In `config/conf.d/00-default.conf`, in `location /static/`, **before** `proxy_pass`:

```nginx
        proxy_cache static_cache;
        proxy_cache_valid 200 10m;
        add_header X-Cache-Status $upstream_cache_status always;
```

In `nginx.conf` in `http {}`:

```nginx
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static_cache:10m max_size=50m inactive=10m;
```

Create the directory when using `/var/cache/nginx`:

```bash
docker compose exec edge mkdir -p /var/cache/nginx
docker compose exec edge chown nginx:nginx /var/cache/nginx
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
```

---

## Task 4. MISS → HIT

```bash
curl -sI http://localhost:8080/static/ | grep -i x-cache-status
curl -sI http://localhost:8080/static/ | grep -i x-cache-status
```

**Expected:** the first request `MISS` (or `MISS`/`REVALIDATED`), the second — `HIT`.

---

## Task 5. API without a cache

```bash
curl -sI http://localhost:8080/api/health | grep -i x-cache-status
```

**Expected:** no header, or `BYPASS` — health shouldn't be cached.

---

## Task 6. Clearing the cache

```bash
docker compose exec edge rm -rf /var/cache/nginx/*
# or recreate the volume: docker compose down -v && docker compose up -d
```

Repeat the two curls — `MISS` again.

---

## Success criteria

- [ ] gzip confirmed for `/static/`
- [ ] The second GET on `/static/` gives `X-Cache-Status: HIT`
- [ ] `/api/health` doesn't return a HIT from proxy_cache
- [ ] You can explain the difference between MISS and HIT

---

## Rollback

Remove the `proxy_cache*` and `proxy_cache_path` lines, reload. You can keep gzip.

---

## What's next

[09. WebSocket proxy](09-websocket-proxy.md).
