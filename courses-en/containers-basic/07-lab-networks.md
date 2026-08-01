# 07. Lab: frontend/backend networks and proxy

## Lab goal

Verify **DNS** between services, the **unreachability of redis from the host**, the working of the **nginx `/api/`**, and network membership in compose.

## Prerequisites

```bash
cd deploy/containers
docker compose up -d --build
bash scripts/smoke.sh
```

Theory: [06. Networking](06-networking.md). Snippet: [`examples/compose-snippet.yml`](examples/compose-snippet.yml).

---

## Task 1. List of networks

```bash
docker network ls --filter name=containers
docker compose ps
```

**What you'll see:** the networks `…_frontend`, `…_backend` (the prefix = the compose project name).

---

## Task 2. Redis from the host (should fail)

```bash
docker run --rm redis:7.2-alpine redis-cli -h host.docker.internal -p 6379 ping 2>/dev/null || \
  nc -zv 127.0.0.1 6379 2>&1 || echo "expected: no redis on host"
```

**What you'll see:** connection refused / timeout — redis is **not** published.

---

## Task 3. Redis from api

```bash
docker exec mock-containers-api sh -c 'getent hosts redis; nc -zv redis 6379'
```

**What you'll see:** the redis IP in the backend network; `open`.

---

## Task 4. Web → api (without the api port on the host)

```bash
docker exec mock-containers-web wget -qO- http://api:8080/health
```

**What you'll see:** the JSON `{"status":"ok"}`.

---

## Task 5. Web does not see redis (as expected)

```bash
docker exec mock-containers-web sh -c 'wget -qO- --timeout=2 http://redis:6379 2>&1' || echo "expected fail"
```

**What you'll see:** timeout / bad address — web is **not** in `backend`.

---

## Task 6. Path via the host :8088

```bash
curl -s http://localhost:8088/api/health
curl -s http://localhost:8088/api/hits
curl -s http://localhost:8088/api/hits
```

**What you'll see:** `hits` grows: 1, 2, …

---

## Task 7. Inspect membership

```bash
NET=$(docker inspect mock-containers-api --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}')
echo "$NET"
docker network inspect $(echo "$NET" | awk '{print $1}') --format '{{range .Containers}}{{.Name}} {{end}}'
```

**What you'll see:** in backend — `mock-containers-api`, `mock-containers-redis`; web only in frontend.

---

## Task 8. Break the proxy (optional, revert)

Temporarily remove the trailing `/` from `proxy_pass` in `stack/web/nginx.conf`, then rebuild web:

```bash
docker compose up -d --build web
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8088/api/health
```

**What you'll see:** often **404** — restore the config to how it was.

---

## Success criteria

- [ ] Redis is unreachable at `127.0.0.1:6379`
- [ ] api resolves and pings redis
- [ ] web reaches api by the name `api`
- [ ] `/api/hits` via localhost:8088 increments the counter
- [ ] inspect confirms api has two networks

## What to take to work

- Inside compose, **service name = hostname**
- Don't publish the data tier to the host
- A single entry point via a reverse proxy

Next lesson: [08. Volumes](08-volumes.md).
