# nginx — Basic (reverse proxy on Docker)

A course for **DevOps** and backend developers: nginx as an **edge** — virtual hosts, static content, **reverse proxy**, **X-Forwarded-\*** headers, **502** debugging, **upstream**, and a bridge to **Ingress** in Kubernetes.

**Prerequisites:** HTTP and the terminal ([`linux-basic`](../linux-basic/README.md)); an nginx overview on a VM — [`linux-intermediate/13-nginx`](../linux-intermediate/13-nginx.md). Containerized nginx in a Compose stack — [`containers-basic/10-compose-multi-service`](../containers-basic/10-compose-multi-service.md) and [`deploy/containers/stack/web`](../../deploy/containers/stack/web/nginx.conf).

**Locally:** [`deploy/nginx`](../../deploy/nginx/README.md) — `docker compose up -d --build`:

| Service / URL | Purpose |
|--------------|------------|
| Edge | [http://localhost:8080](http://localhost:8080) — health `edge OK` |
| Static | [http://localhost:8080/static/](http://localhost:8080/static/) |
| API | [http://localhost:8080/api/health](http://localhost:8080/api/health) |
| TLS (after `gen-certs.sh`) | [https://localhost:8443](https://localhost:8443) |

Containers: `mock-nginx-edge`, `mock-nginx-static`, `mock-nginx-api`. Check the config: `docker compose exec mock-nginx-edge nginx -t`. Smoke: `bash scripts/smoke.sh` in `deploy/nginx`.

**Next:** [`nginx-intermediate`](../nginx-intermediate/README.md) — rate limit, TLS hardening; [`kuber-basic/20-ingress`](../kuber-basic/20-ingress.md) — Ingress Controller.

## How to read the chapters

1. **Theory** (01, 02, 04…) — a real-world scenario, tables, common mistakes.
2. **Lab** (03, 05…) — the stand in `deploy/nginx` is brought up in advance.
3. After editing `config/conf.d/*.conf`: **`nginx -t`** → **`nginx -s reload`** on the edge.
4. 502 or 404 on the API — [`deploy/nginx/README.md`](../../deploy/nginx/README.md) (troubleshooting).

**Time:** ~**40–50 minutes** per "theory + lab" pair; the [final project](11-final-project.md) — **2–3 hours**. The whole course — **~6–8 hours**.

## Curriculum

### The role of nginx and architecture (01–03)

1. [Why nginx: edge vs app server](01-why-nginx.md)
2. [Stand architecture: master/worker, conf.d, compose](02-architecture.md) · 3. [Lab: vhost and static content](03-lab-vhost-static.md)

### Reverse proxy (04–05)

4. [Reverse proxy: proxy_pass, X-Forwarded-*](04-reverse-proxy.md) · 5. [Lab: proxy_pass and the slash](05-lab-proxy-pass.md)

### Logs and 502 (06–07)

6. [access/error log and 502 diagnostics](06-logs-502.md) · 7. [Lab: an intentional 502](07-lab-502-debug.md)

### Upstream (08–09)

8. [upstream: load balancing and health](08-upstream.md) · 9. [Lab: upstream in compose](09-lab-upstream.md)

### Kubernetes and the finale (10–11)

10. [Ingress: theory and the connection to nginx](10-ingress-preview.md)
11. [Final project: edge routing](11-final-project.md)

## What you should end up with

- You can explain the difference between an **edge nginx** and an **app server** (Flask, gunicorn, nginx-static).
- You can read the config structure on the stand: `nginx.conf`, `conf.d/`, Docker DNS (`api`, `static`).
- You can configure **location**, **root**, **proxy_pass** without the **trailing slash** trap.
- You can set **X-Forwarded-For / Proto** for a backend behind TLS.
- From the **error.log** you can tell connection refused from timeout.
- You can describe **upstream** and why the same pattern appears in **Ingress**.
- You can connect the lab to [`containers-basic`](../containers-basic/README.md) (web proxies `/api/`).

## Examples

| Path | Purpose |
|------|------------|
| [`examples/proxy-pass-snippet.conf`](examples/proxy-pass-snippet.conf) | proxy_pass + X-Forwarded-* |
| [`examples/upstream.conf`](examples/upstream.conf) | upstream + proxy_pass |

## Related materials

| Course / stand | Connection |
|--------------|--------|
| [linux-intermediate/13](../linux-intermediate/13-nginx.md) | vhost, proxy on a VM |
| [containers-basic](../containers-basic/README.md) | nginx in the `web` image |
| [deploy/nginx](../../deploy/nginx/README.md) | edge :8080 / :8443 |
| [kuber-basic/20-ingress](../kuber-basic/20-ingress.md) | Ingress Controller |
