# 05. Lab: proxy_pass and the trailing slash trap

## Lab goal

Verify a working **proxy_pass** on the stand, **intentionally** break the URI by removing the slash, see a **404** on the backend, restore the config, and compare with [containers-basic web](../../deploy/containers/stack/web/nginx.conf).

## Prerequisites

- The stand is up ([lab 03](03-lab-vhost-static.md)).
- Theory: [04. Reverse proxy](04-reverse-proxy.md).

---

## Task 1. Basic API check

```bash
cd deploy/nginx
curl -s http://localhost:8080/api/health
curl -s http://localhost:8080/api/hits
```

**What you'll see:** `ok` and the JSON `{"hits": 1}`.

---

## Task 2. A request from the edge into the network

```bash
docker compose exec mock-nginx-edge wget -qO- http://api:8080/health
```

**What you'll see:** `ok` — the backend is alive without the `/api` prefix.

---

## Task 3. Break proxy_pass (remove the slash)

In `config/conf.d/00-default.conf`, in the `location /api/` block, temporarily replace:

```nginx
proxy_pass http://api:8080/;
```

with:

```nginx
proxy_pass http://api:8080;
```

```bash
docker compose exec mock-nginx-edge nginx -t
docker compose exec mock-nginx-edge nginx -s reload
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/health
```

**What you'll see:** most likely **404** (the api does not know the path `/api/health`).

Look at the access.log:

```bash
tail -3 logs/access.log
```

---

## Task 4. Restore the correct slash

Put back `proxy_pass http://api:8080/;`, `-t`, `reload`, then again:

```bash
curl -s http://localhost:8080/api/health
```

**What you'll see:** `ok`.

Write the table row in your notebook: "`/api/health` + slash in proxy_pass → `/health` on api".

---

## Task 5. Headers (optional)

Temporarily add to `location /api/`:

```nginx
add_header X-Debug-Uri $request_uri always;
```

After a reload:

```bash
curl -sI http://localhost:8080/api/health | grep -i X-Debug
```

**What you'll see:** `X-Debug-Uri: /api/health` — the client URI; the backend still received `/health`.

Remove the `add_header` and reload again.

---

## Task 6. Comparison with deploy/containers

```bash
grep -A5 'location /api/' ../../deploy/containers/stack/web/nginx.conf
```

**Question:** is there a slash after `8080` there? Does the behavior match the edge?

---

## Task 7. HTTPS (if there are certs)

```bash
test -f certs/server.crt && curl -sk https://localhost:8443/api/health || echo "skip: run scripts/gen-certs.sh"
```

---

## Success criteria

- [ ] You understand the difference between 200 and 404 with the slash
- [ ] After each edit `nginx -t` was successful
- [ ] The config is returned to a working state
- [ ] You compared with the web nginx in containers-basic

## If something went wrong

| Symptom | Action |
|---------|----------|
| 502 instead of 404 | `docker compose logs api`, healthcheck |
| reload doesn't help | make sure you edited the file in `config/conf.d/` on the host |
| nginx -t error | check the `;` and the closing `}` |

Next lesson: [06. Logs and 502](06-logs-502.md).
