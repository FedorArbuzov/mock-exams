# 40. nginx: reverse proxy, static, TLS

## Overview

WhiteNoise is fine for a teaching stack. In production, **nginx** often sits in front of gunicorn for TLS termination, gzip, rate limiting, and static offload.

[`nginx-basic`](../nginx-basic/README.md) covers the fundamentals. Here we focus on Django-specific headers and static handling.

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

Volume mount: the `staticfiles` directory from the Django image → `/var/www/staticfiles/`.

---

## Django behind a proxy

```python
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
CSRF_TRUSTED_ORIGINS = ["https://catalog.example.com"]
```

Without `SECURE_PROXY_SSL_HEADER` you'll get redirect loops and insecure cookies behind a TLS terminator.

---

## Static strategies

| Layer | Role |
|-------|------|
| collectstatic | gather everything into STATIC_ROOT |
| WhiteNoise | serve from the gunicorn process |
| nginx `/static/` | zero Python CPU spent on CSS/JS |
| CDN | edge cache worldwide |

Admin static is lots of small files — an nginx alias noticeably cuts load on the workers.

---

## Rate limiting (sketch)

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://django_app;
}
```

Exclude `/health/` from the limit — otherwise Kubernetes will kill the pod.

---

## WebSockets / ASGI

Classic nginx → gunicorn is **sync HTTP only**. WebSockets need ASGI (Daphne/Uvicorn) plus nginx `Upgrade` headers — a separate topic; the catalog REST API is fine on WSGI.

---

## Probes through nginx

```nginx
location /health/ {
    proxy_pass http://django_app/health/;
    access_log off;
}
```

[`fastapi/34-nginx-tls`](../fastapi/34-nginx-tls.md) — the parallel setup for the FastAPI stack.

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| 502 Bad Gateway | gunicorn down / wrong upstream name |
| Redirect loop | SECURE_PROXY_SSL_HEADER |
| CSRF fail behind HTTPS | CSRF_TRUSTED_ORIGINS |
| Static 403 | nginx user needs read permission on staticfiles |

---

## Summary

nginx terminates TLS, proxies to gunicorn, and optionally serves static files. Forwarded headers are required for Django's secure settings. Keep health checks exempt from rate limiting.

Next: [41-interview-qa](41-interview-qa.md).
