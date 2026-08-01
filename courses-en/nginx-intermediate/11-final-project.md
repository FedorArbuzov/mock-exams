# 11. Final project: a hardened edge on deploy/nginx

## Task

Assemble a single **production-like edge** on [`deploy/nginx`](../../deploy/nginx/README.md): HTTPS, security headers, a rate limit on `/login`, gzip, (optionally) proxy_cache for static, and deliberate tuning of `worker_connections` / keepalive. Write a short **runbook** in `courses/nginx-intermediate/my-edge-notes.md` (locally, not necessarily in git) or in a personal gist.

The project ties together [nginx-basic](../nginx-basic/README.md), [linux-intermediate TLS](../linux-intermediate/09-tls-openssl.md), and overlaps with [kuber-basic Ingress](../kuber-basic/20-ingress.md) — the same policies, a different carrier (conf.d files vs YAML).

---

## Requirements (mandatory)

### 1. TLS

- Certificates via `bash scripts/gen-certs.sh`.
- Working `https://localhost:8443/api/health` and `/static/`.
- `ssl_protocols TLSv1.2 TLSv1.3` (as in [examples/ssl-server-block.conf](examples/ssl-server-block.conf)).

### 2. Security headers (HTTPS server)

- `Strict-Transport-Security` with `max-age=86400` (lab) or a justified value in the runbook.
- `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
- All with `always`.

### 3. Rate limiting

- A `limit_req_zone` zone in `nginx.conf`.
- The `/login` location → backend `/slow`, on a spike — **429** (see [06-lab-rate-limit](06-lab-rate-limit.md)).

### 4. gzip

- Enabled for text/json/js/css.
- Confirmation: `curl -H 'Accept-Encoding: gzip' -I https://localhost:8443/static/`.

### 5. Documentation (runbook)

A markdown table:

| Scenario | Command / place |
|----------|-----------------|
| Check the config | `docker compose exec edge nginx -t` |
| Reload | `docker compose exec edge nginx -s reload` |
| Generate TLS | `bash scripts/gen-certs.sh` |
| 502 on the API | `docker compose logs api` |
| 429 on login | expected under ab |
| Reset the stand | `docker compose down -v` |

---

## Requirements (optional, +2 items from the list)

1. **proxy_cache** for `/static/` + the `X-Cache-Status` header ([08-lab-cache](08-lab-cache.md)).
2. **HTTP → HTTPS redirect** on a separate `server { listen 80; return 301 ... }` (note that the stand maps 8080→80).
3. **upstream keepalive** to `api` ([10-performance-tuning](10-performance-tuning.md)).
4. **A separate access_log** format with `$request_time` and `$upstream_response_time`.
5. **WebSocket** location per [09-websocket-proxy](09-websocket-proxy.md) with `proxy_read_timeout 3600s`.

---

## Submission diagram

```text
[browser/curl]
    |  :8443 TLS
    v
[edge nginx]
    |-- /static/  --> [static]   (+ cache?, gzip)
    |-- /api/     --> [api]
    |-- /login    --> [api /slow] (+ limit_req)
```

---

## Step-by-step plan

### Step 1. The base stand

```bash
cd deploy/nginx
docker compose up -d --build
bash scripts/smoke.sh
```

### Step 2. TLS + headers

- `gen-certs.sh`, edits to `10-tls.conf` per [02](02-lab-https.md) and [04](04-lab-hsts-headers.md).

### Step 3. Limits and gzip

- Check `00-default.conf` and `nginx.conf` per [06](06-lab-rate-limit.md), [08](08-lab-cache.md).

### Step 4. Tuning

- Record in the runbook the values of `worker_processes`, `worker_connections`, `keepalive_timeout` and **why** they were chosen for the lab.

### Step 5. Acceptance tests

Copy the output into the runbook:

```bash
curl -sk https://localhost:8443/api/health
curl -skI https://localhost:8443/ | grep -iE 'strict-transport|x-frame'
curl -sH 'Accept-Encoding: gzip' -sI https://localhost:8443/static/ | grep -i content-encoding
ab -n 40 -c 8 http://localhost:8080/login | tail -5
docker compose exec edge nginx -t
```

---

## Grading criteria

| Criterion | Weight |
|----------|-----|
| TLS and API/static over HTTPS | mandatory |
| Headers with `always` | mandatory |
| Rate limit /login + 429 | mandatory |
| gzip | mandatory |
| Runbook | mandatory |
| +2 optional items | bonus |
| Clean `nginx -t`, no secrets in git | hygiene |

---

## What not to do

- Don't commit `certs/*.key` and real production certificates.
- Don't set an HSTS `max-age` of a year on a shared dev domain without understanding the consequences.
- Don't cache `/login` and responses with `Set-Cookie`.

---

## Link to Kubernetes (reflection)

Answer in writing (5–10 sentences in the runbook):

1. Which k8s object replaces `server {}` on the edge?
2. Where in the cluster are TLS cert/key stored for Ingress?
3. Which ingress-nginx annotation would you use for rate limiting instead of `limit_req_zone`?

Hint: [20-ingress](../kuber-basic/20-ingress.md), the final project [kuber-intermediate/27-final-project](../kuber-intermediate/27-final-project.md).

---

## After the course

- [nginx-advanced](../nginx-advanced/README.md) — if it appears in the track: WAF, njs, stream module.
- [gitlab-intermediate](../gitlab-intermediate/README.md) — CI that deploys configs.
- [observability-intermediate](../observability-intermediate/README.md) — nginx latency metrics.

Congratulations on completing **nginx — Intermediate**.
