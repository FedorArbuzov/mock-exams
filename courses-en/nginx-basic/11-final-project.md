# 11. Final project: edge routing under control

## Goal

Assemble a **consistent** edge configuration on [`deploy/nginx`](../../deploy/nginx/README.md): the `/`, `/static/`, `/api/` routes, optional **HTTPS :8443**, an **upstream** block, an extended **access log**, and a runbook for **502**. Compare the behavior with [containers-basic](../containers-basic/README.md) (web nginx) and describe the "compose edge → Ingress" migration.

**Time:** 2–3 hours.

## Prerequisites

- Labs [03](03-lab-vhost-static.md)–[09](09-lab-upstream.md) are completed.
- The theory [10. Ingress](10-ingress-preview.md) is read.
- Ports **8080**, **8443** are free.

---

## Part A. Baseline (30 min)

1. `cd deploy/nginx && docker compose down -v && docker compose up -d --build`
2. `bash scripts/smoke.sh` — all checks green.
3. Record in `notes.md` (locally, not in the course git):

   | URL | Expectation |
   |-----|----------|
   | `http://localhost:8080/` | edge OK |
   | `/static/` | Static backend |
   | `/api/health` | ok |

4. A screenshot or the output of `docker compose ps` with a **healthy** api.

---

## Part B. upstream and keepalive (40 min)

1. Implement [lab 09](09-lab-upstream.md): `05-upstream-api.conf` + `proxy_pass http://api_backends/`.
2. `docker compose exec mock-nginx-edge nginx -t` and reload.
3. Repeat smoke.

**Criterion:** with `docker compose stop api` — 502 on `/api/`, 200 on `/static/`.

---

## Part C. TLS (30 min, optional but recommended)

```bash
bash scripts/gen-certs.sh
docker compose exec mock-nginx-edge nginx -t
docker compose exec mock-nginx-edge nginx -s reload
curl -sk https://localhost:8443/api/health
curl -skI https://localhost:8443/static/ | head -5
```

In `notes.md`: why `10-tls.conf` needs `X-Forwarded-Proto https` ([chapter 04](04-reverse-proxy.md)).

---

## Part D. Extended access log (30 min)

Create `config/conf.d/99-access-upstream.conf`:

```nginx
log_format upstream_detailed '$remote_addr "$request" status=$status '
    'ups_status=$upstream_status ups_addr=$upstream_addr rt=$request_time';

server {
    listen 80;
    server_name localhost;
    access_log /var/log/nginx/access-upstream.log upstream_detailed;

    location /api/health {
        access_log /var/log/nginx/access-upstream.log upstream_detailed;
        proxy_pass http://api_backends/health;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
    }
}
```

> **Warning:** a separate `location /api/health` **conflicts** with the `/api/` prefix in `00-default.conf` — nginx will pick the **longer** match. For the project, either use **only** the extended `log_format` in the existing `location /api/` via `access_log ... upstream_detailed;`, or temporarily comment out the duplicate block after checking.

The recommended option without duplicating the server:

- add the `log_format` to `nginx.conf` or `99-...conf`;
- in `00-default.conf`, in `location /api/`, add a second line `access_log /var/log/nginx/access-upstream.log upstream_detailed;`

Make 5 requests to `/api/health` and show the line with `ups_status=200` in `logs/access-upstream.log`.

---

## Part E. Runbook 502 (20 min)

Write a **5-step** runbook in `notes.md` ([chapter 06](06-logs-502.md)) and reproduce it once (stop api → logs → start api).

---

## Part F. Comparison with containers-basic (20 min)

Fill in the table:

| Question | deploy/containers (web) | deploy/nginx (edge) |
|--------|-------------------------|---------------------|
| Host port | 8088 | 8080 |
| Who proxies `/api/` | | |
| Where static lives | root in web | |
| Edge/web container name | mock-containers-web | mock-nginx-edge |

Link to the config: [`stack/web/nginx.conf`](../../deploy/containers/stack/web/nginx.conf).

---

## Part G. Bridge to Kubernetes (20 min)

Sketch a **pseudo-Ingress** (YAML in `notes.md`, not necessarily applied):

- host: `lab.local`
- path `/api` → Service `api:8080`
- path `/` → Service `static:80`
- `ingressClassName: nginx`

Map each field to a directive from your `00-default.conf` ([chapter 10](10-ingress-preview.md)).

---

## Submission (checklist)

- [ ] Smoke and `nginx -t` without errors
- [ ] upstream + keepalive for `/api/`
- [ ] (Preferably) HTTPS :8443 works
- [ ] There is an example access log line with upstream_status
- [ ] The 502 runbook is verified hands-on
- [ ] The comparison table with containers-basic
- [ ] The pseudo-Ingress is mapped to nginx

## Where to go next

| Course | Topic |
|------|------|
| [nginx-intermediate](../nginx-intermediate/README.md) | rate limit (`/login`), TLS hardening |
| [kuber-basic/20–21](../kuber-basic/20-ingress.md) | Ingress in the cluster |
| [linux-intermediate/14](../linux-intermediate/14-lab-nginx.md) | proxy on the VM srv1/lab |

## Cleanup

```bash
cd deploy/nginx
docker compose down -v
```

Delete the experimental `conf.d/99-*.conf` or return `00-default.conf` to the repository state before committing to your fork.
