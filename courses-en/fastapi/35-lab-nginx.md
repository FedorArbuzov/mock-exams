# 35. Lab: FastAPI behind nginx

## Lab goal

Put the API from [`deploy/fastapi`](../../deploy/fastapi/README.md) behind the reverse proxy [`deploy/nginx`](../../deploy/nginx/README.md): routing under `/api/`, TLS (optional), rate limiting, and correct forwarded headers. One URL for the client — the edge on **8080/8443**, with the FastAPI backend inside the compose network.

Theory: [34-nginx-tls](34-nginx-tls.md). Similar lab in the nginx course: [nginx-intermediate/02-lab-https](../nginx-intermediate/02-lab-https.md).

---

## Lab architecture

```text
[curl :8080]
     |
[edge nginx]  -- /api/* --> [mock-fastapi-api:8000]
     |
[static backend]  /static/
```

Option A: nginx and fastapi on the **same** docker network (override compose).
Option B: nginx `proxy_pass http://host.docker.internal:8090` (Windows/Mac).

---

## Task 1. Bring up both stands

```bash
cd deploy/fastapi
docker compose up -d --build

cd deploy/nginx
docker compose up -d --build
bash scripts/smoke.sh
```

Check it works directly: `curl -s http://localhost:8090/health`.

---

## Task 2. Connect the networks (option A)

Create `deploy/nginx/docker-compose.override.yml` (locally):

```yaml
services:
  edge:
    networks:
      - default
      - fastapi_backend

networks:
  fastapi_backend:
    external: true
    name: fastapi_backend
```

Find the network name with: `docker network ls | grep fastapi`.

Add an upstream in `config/conf.d/00-default.conf`:

```nginx
upstream course_fastapi {
    server mock-fastapi-api:8000;
    keepalive 16;
}

location /course-api/ {
    proxy_pass http://course_fastapi/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "";
}
```

```bash
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
curl -s http://localhost:8080/course-api/health
curl -s http://localhost:8080/course-api/api/v1/items
```

---

## Task 3. ProxyHeaders in FastAPI

In the fastapi stand's `app/main.py`:

```python
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])
```

Add a debug endpoint `/debug/client` that returns `request.url.scheme` and the client host. Behind nginx, the scheme should read as `http` (or `https` over TLS).

---

## Task 4. TLS (optional, bonus)

```bash
cd deploy/nginx
bash scripts/gen-certs.sh
# enable 10-tls.conf, reload
curl -sk https://localhost:8443/course-api/health
curl -skI https://localhost:8443/ | grep -i strict-transport
```

---

## Task 5. Rate limit on the write path

Copy the pattern from `20-rate-limit.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=course_api_write:10m rate=2r/s;

location /course-api/api/v1/items {
    limit_req zone=course_api_write burst=5 nodelay;
    proxy_pass http://course_fastapi/api/v1/items;
    # ... headers ...
}
```

For `POST` only — use a separate `location` or a map (simplified here: limit applies to the whole path).

```bash
for i in $(seq 1 20); do curl -s -o /dev/null -w "%{http_code} " \
  -X POST http://localhost:8080/course-api/api/v1/items \
  -H "Content-Type: application/json" -d '{"title":"t"}'; done
echo
```

Expect **429** from nginx.

---

## Task 6. Access log with upstream time

```nginx
log_format upstream_timing '$remote_addr - $request '
  'status=$status rt=$request_time urt=$upstream_response_time';

access_log /var/log/nginx/course_api.log upstream_timing;
```

Make 10 requests, then find the `urt=` field in `logs/access.log`.

---

## Task 7. Smoke checklist

| Check | Command | Expected |
|----------|---------|----------|
| Health via proxy | `curl :8080/course-api/health` | 200 |
| Items list | `curl :8080/course-api/api/v1/items` | JSON |
| nginx config | `nginx -t` | ok |
| Direct still works | `curl :8090/health` | 200 |
| Rate limit | loop POST | 429 |

---

## Submission criteria

| Criterion | Required |
|----------|-------------|
| API reachable only through the nginx path | yes |
| Forwarded headers / ProxyHeaders | yes |
| `nginx -t` with no errors | yes |
| Client-facing URL documented | yes |
| TLS or rate limit | at least one of the two |

---

## Connection to Kubernetes

Answer in writing (3-5 sentences):

1. Which object replaces `location /course-api/`?
2. Where does TLS termination happen in managed K8s?
3. Which ingress-nginx annotations handle `limit_req`?

Hint: [kuber-intermediate/13-probes-advanced](../kuber-intermediate/13-probes-advanced.md), [kuber-basic/20-ingress](../kuber-basic/20-ingress.md).

---

## Summary

This lab wires **two stands** into a production-like topology: edge nginx + FastAPI upstream. Verify the **path mapping**, **headers**, and **limits** before moving on to observability ([36-observability](36-observability.md)).

## Checklist

- How does nginx resolve `mock-fastapi-api`?
- Why use `keepalive` to the upstream?
- 502 — what are the first three debugging steps?
- How does the lab edge differ from an Ingress?

Next lesson: [36-observability](36-observability.md).
