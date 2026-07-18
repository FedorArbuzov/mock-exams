# 40. nginx: reverse proxy, static, TLS

## Введение

WhiteNoise достаточен для учебного стенда. В production часто **nginx** перед gunicorn: TLS termination, gzip, rate limit, static offload.

[`nginx-basic`](../nginx-basic/README.md) — основы. Здесь — Django-specific headers и static.

---

## Upstream config

```nginx
upstream django_app {
    server web:8000;
    keepalive 32;
}

server {
    listen 80;
    server_name catalog.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name catalog.example.com;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location /static/ {
        alias /var/www/staticfiles/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://django_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

Volume mount: `staticfiles` из образа Django → `/var/www/staticfiles/`.

---

## Django behind proxy

```python
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
CSRF_TRUSTED_ORIGINS = ["https://catalog.example.com"]
```

Без `SECURE_PROXY_SSL_HEADER` — redirect loops и insecure cookies за TLS terminator.

---

## Static strategies

| Layer | Role |
|-------|------|
| collectstatic | gather to STATIC_ROOT |
| WhiteNoise | serve from gunicorn process |
| nginx `/static/` | zero Python CPU for CSS/JS |
| CDN | edge cache worldwide |

Admin static — много мелких файлов → nginx alias заметно снижает load на workers.

---

## Rate limiting (sketch)

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://django_app;
}
```

Исключите `/health/` из limit — иначе K8s убьёт pod.

---

## WebSockets / ASGI

Classic nginx → gunicorn — **sync HTTP only**. WebSockets нужен ASGI (Daphne/Uvicorn) + nginx `Upgrade` headers — отдельная тема; catalog REST API — WSGI достаточно.

---

## Probes через nginx

```nginx
location /health/ {
    proxy_pass http://django_app/health/;
    access_log off;
}
```

[`fastapi/34-nginx-tls`](../fastapi/34-nginx-tls.md) — parallel для FastAPI stack.

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| 502 Bad Gateway | gunicorn down / wrong upstream name |
| Redirect loop | SECURE_PROXY_SSL_HEADER |
| CSRF fail behind HTTPS | CSRF_TRUSTED_ORIGINS |
| Static 403 | nginx user read perm on staticfiles |

---

## Резюме

nginx terminates TLS, proxies to gunicorn, optionally serves static. Forwarded headers обязательны для Django secure settings. Health без rate limit.

Далее: [41-interview-qa](41-interview-qa.md).
