# 07. Caching and gzip on the edge

## Intro: why nginx compresses and caches

The backend (Python, Java) spends CPU on serializing JSON and serving static. The **edge nginx** can:

- **compress** the response with gzip/brotli for text types — fewer bytes over the network;
- **cache** the backend's response in `proxy_cache` — repeat GETs don't hit the API.

This is a standard CDN and Ingress pattern. In [kuber-intermediate](../kuber-intermediate/README.md) caching at the Ingress level is rarer than on a dedicated nginx/CloudFront, but **gzip** is often enabled globally.

## What you'll learn

- `gzip` / `gzip_types` in `http {}`.
- `proxy_cache_path`, `proxy_cache`, `proxy_cache_valid`.
- `Cache-Control` headers from the backend vs the nginx cache.
- When you **must not** cache (POST, personal data).

---

## gzip

You can add to the stand's `http {}`:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 5;
gzip_min_length 256;
gzip_types
    text/plain
    text/css
    application/json
    application/javascript
    text/xml
    application/xml;
```

| Directive | Meaning |
|-----------|--------|
| `gzip_vary on` | adds `Vary: Accept-Encoding` — important behind a CDN |
| `gzip_proxied any` | compress responses from `proxy_pass` |
| `gzip_min_length` | don't compress tiny responses |
| `gzip_comp_level` | 1–9; higher — slower CPU |

Verification:

```bash
curl -sH 'Accept-Encoding: gzip' -D - http://localhost:8080/static/ -o /dev/null | grep -i content-encoding
```

**brotli** (`brotli on`) — if the module is built; in the official `nginx:alpine` often only gzip is available.

---

## proxy_cache

### 1. A zone on disk

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static_cache:10m max_size=100m inactive=60m use_temp_path=off;
```

| Parameter | Meaning |
|----------|--------|
| `keys_zone=static_cache:10m` | zone name + RAM for keys |
| `max_size` | limit on disk |
| `inactive` | delete if not requested for N time |

In Docker you need a writable volume on `/var/cache/nginx` (in the lab — tmpfs or a volume in compose).

### 2. In a location

```nginx
location /static/ {
    proxy_cache static_cache;
    proxy_cache_valid 200 10m;
    proxy_cache_use_stale error timeout updating;
    add_header X-Cache-Status $upstream_cache_status;

    proxy_pass http://static:80/;
}
```

`$upstream_cache_status`: **MISS**, **HIT**, **BYPASS**, **EXPIRED**.

### 3. What not to cache

- `POST`, `PUT`, `PATCH`;
- responses with `Set-Cookie` (by default nginx doesn't cache these unless configured otherwise);
- personal APIs with `Authorization`;
- responses with `Cache-Control: private/no-store` — respect them via `proxy_cache_bypass` and `proxy_no_cache`.

---

## Microcache for the API (carefully)

For a public read-only GET, a **1–5 second** cache is sometimes used — smoothing out peaks:

```nginx
proxy_cache_valid 200 5s;
```

On the stand, caching the API `/health` is pointless; for the lab, cache **static**.

---

## Static without a proxy

If nginx serves files from disk itself (`root` / `alias`), the browser cache is set by headers:

```nginx
location ~* \.(css|js|png|jpg)$ {
    expires 7d;
    add_header Cache-Control "public, immutable";
}
```

On the stand, static is a separate container; lab 08 uses `proxy_cache` to it.

---

## Compression + cache: the order

```text
request → proxy → backend
response ← gzip ← cache (on HIT the backend isn't called)
```

First request: MISS, the backend worked, the response was stored in the cache. Second: HIT, gzip from the cache or on-the-fly compression — depends on the config.

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| No volume for the cache path | `crit` on startup, cache isn't written |
| Caching login/session | data leak between users |
| `gzip off` on already-compressed content | double compression / breakage |
| Ignoring `Vary` | wrong HIT for different Accept |

---

## Summary

gzip reduces traffic; `proxy_cache` reduces backend load for idempotent GETs. At the intermediate level we enable gzip in `nginx.conf`, and caching — for `/static/` with the `X-Cache-Status` header.

## Checklist

- [ ] Which MIME types are usually in `gzip_types`?
- [ ] How does HIT differ from MISS?
- [ ] Why isn't POST /login cached?

Next lesson: [08. Lab: cache and gzip](08-lab-cache.md).
