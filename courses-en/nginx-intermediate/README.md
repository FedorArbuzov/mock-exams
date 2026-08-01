# nginx — Intermediate

An intermediate course on **nginx as an edge reverse proxy**: **TLS termination**, **security headers**, **rate limiting**, **cache and gzip**, **WebSocket**, **performance tuning**, and a **final project** on the Docker stand [`deploy/nginx`](../../deploy/nginx/README.md).

The format is "book-style" chapters: theory → lab. The stand already includes HTTP :8080, HTTPS :8443 (after generating certificates), the **static** and **api** backends, and the `/login` location for rate limiting.

## Who it's for

- Completed or equivalent to [`nginx-basic`](../nginx-basic/README.md): `server` / `location`, `proxy_pass`, `X-Forwarded-*` headers, `nginx -t` and `reload`.
- You understand TLS at the level of [`linux-intermediate/09-tls-openssl`](../linux-intermediate/09-tls-openssl.md) (key, certificate, SAN, self-signed).
- You can use `curl`, Docker Compose; it helps to know [Ingress in Kubernetes](../kuber-basic/20-ingress.md) — the same routing and TLS-at-the-edge ideas.

## Stand

```bash
cd deploy/nginx
docker compose up -d --build
bash scripts/smoke.sh
```

| URL | Purpose |
|-----|------------|
| http://localhost:8080/ | health edge |
| http://localhost:8080/static/ | static backend |
| http://localhost:8080/api/health | API |
| http://localhost:8080/login | rate limit (lab 06) |
| https://localhost:8443/ | TLS after `gen-certs.sh` |

TLS for the labs:

```bash
bash scripts/gen-certs.sh
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
curl -sk https://localhost:8443/api/health
```

The browser will warn about self-signed — normal for a learning environment.

## Related courses

| Course | Relation |
|------|--------|
| [nginx-basic](../nginx-basic/README.md) | reverse proxy, upstream, logs |
| [linux-intermediate/09-tls-openssl](../linux-intermediate/09-tls-openssl.md) | OpenSSL, CA chain, cert verification |
| [linux-intermediate/13-nginx](../linux-intermediate/13-nginx.md) | vhost and proxy on a VM (brief overview) |
| [kuber-basic/20-ingress](../kuber-basic/20-ingress.md) | Ingress Controller ≈ nginx at the edge |
| [kuber-intermediate](../kuber-intermediate/README.md) | Helm, NetworkPolicy, final project with Ingress |
| [containers-basic](../containers-basic/README.md) | the `nginx:alpine` image, Compose networks |

## Curriculum

| № | Theory | Lab |
|---|--------|------|
| 01 | [TLS termination](01-tls-termination.md) | [02 — HTTPS on the stand](02-lab-https.md) |
| 03 | [Security headers and HSTS](03-security-headers.md) | [04 — headers on the edge](04-lab-hsts-headers.md) |
| 05 | [Rate limiting](05-rate-limiting.md) | [06 — /login and 429](06-lab-rate-limit.md) |
| 07 | [Cache and gzip](07-caching-gzip.md) | [08 — proxy_cache / gzip](08-lab-cache.md) |
| 09 | [WebSocket proxy](09-websocket-proxy.md) | note in the chapter |
| 10 | [Performance tuning](10-performance-tuning.md) | — |
| 11 | [Final project](11-final-project.md) | edge "like in prod" |

## Examples in the repository

| Path | Purpose |
|------|------------|
| [examples/ssl-server-block.conf](examples/ssl-server-block.conf) | `server` block for 443 |
| [examples/rate-limit.conf](examples/rate-limit.conf) | `limit_req_zone` + location |
| [`deploy/nginx/config/`](../../deploy/nginx/config/) | working configs of the stand |

## Time estimate

| Block | Hours |
|------|------|
| TLS + headers (01–04) | 3–4 |
| Rate limit + cache (05–08) | 3–4 |
| WebSocket + tuning (09–10) | 2–3 |
| Final project (11) | 3–5 |
| **Total** | **~11–16 h** |

## Graduate checklist

- [ ] You enable HTTPS on the edge: cert/key, `ssl_protocols`, verification with `curl -vk`.
- [ ] You add HSTS and basic security headers; you understand `always` on `add_header`.
- [ ] You configure `limit_req_zone` and explain the difference between `rate`, `burst`, `nodelay`.
- [ ] You enable `gzip` and (optionally) `proxy_cache` for static/API.
- [ ] You know the WebSocket directives: `Upgrade`, `Connection`, `proxy_http_version 1.1`.
- [ ] You tune `worker_connections`, `keepalive_timeout`, and understand the relation to load.
- [ ] You assemble the final vhost: TLS + headers + limit + gzip on [`deploy/nginx`](../../deploy/nginx/README.md).

## Debugging

```bash
docker compose logs -f edge
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
tail -f deploy/nginx/logs/error.log
```

See [Troubleshooting in the stand's README](../../deploy/nginx/README.md).
