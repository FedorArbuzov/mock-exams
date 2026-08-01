# 09. Lab: upstream on the edge

## Lab goal

Move **api** into an **`upstream`** block, enable **keepalive**, verify `nginx -t`, run smoke, and roll back if needed. Use the [`examples/upstream.conf`](examples/upstream.conf) template.

## Prerequisites

- [08. upstream](08-upstream.md).
- A working stand after [lab 07](07-lab-502-debug.md).

---

## Task 1. The upstream file

Create `deploy/nginx/config/conf.d/05-upstream-api.conf`:

```nginx
upstream api_backends {
    least_conn;
    server api:8080 max_fails=2 fail_timeout=10s;
    keepalive 8;
}
```

Do **not** change `00-default.conf` yet.

```bash
docker compose exec mock-nginx-edge nginx -t
```

**What you'll see:** `syntax is ok` (an upstream without a location is allowed).

---

## Task 2. Switch location /api/

In `00-default.conf`, in `location /api/`, replace:

```nginx
proxy_pass http://api:8080/;
```

with:

```nginx
proxy_pass http://api_backends/;
proxy_set_header Connection "";
```

Leave the other `proxy_set_header` lines.

```bash
docker compose exec mock-nginx-edge nginx -t
docker compose exec mock-nginx-edge nginx -s reload
bash scripts/smoke.sh
```

**What you'll see:** smoke OK.

---

## Task 3. Check the endpoints

```bash
curl -s http://localhost:8080/api/health
curl -s http://localhost:8080/api/hits
```

---

## Task 4. Simulate a fail (briefly)

```bash
docker compose stop api
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/health
grep -i "upstream\|refused" logs/error.log | tail -2
docker compose start api
sleep 2
curl -s http://localhost:8080/api/health
```

**What you'll see:** 502 on stop; after start — ok again.

---

## Task 5. Document the diff

Save for yourself: "it was `proxy_pass http://api:8080/` → it became `http://api_backends/` + an upstream file".

---

## Task 6. (Optional) a second server

If you add an `api2` service (a copy of the api build) to compose, add to the upstream:

```nginx
server api2:8080 max_fails=2 fail_timeout=10s;
```

Restart the edge and check balancing with several requests (for the learning api the response is the same).

---

## Success criteria

- [ ] The file `05-upstream-api.conf` is created
- [ ] `location /api/` uses `api_backends`
- [ ] `nginx -t` and smoke succeed
- [ ] You understand why `Connection ""` is needed with keepalive

## Rollback

Delete `05-upstream-api.conf`, put back `proxy_pass http://api:8080/;` in `00-default.conf`, remove `Connection ""`, `-t`, reload.

Next lesson: [10. Ingress preview](10-ingress-preview.md).
