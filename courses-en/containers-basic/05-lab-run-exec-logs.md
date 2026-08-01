# 05. Lab: run, exec, logs, inspect, stop

## Lab goal

Bring up the [`deploy/containers`](../../deploy/containers/README.md) stand, walk through the **lifecycle** of the **api** service: logs, exec, inspect, graceful stop; reproduce the typical "api can't see redis" diagnostic.

## Prerequisites

```bash
cd deploy/containers
docker compose up -d --build
docker compose ps
bash scripts/smoke.sh
```

Theory: [04. Container runtime](04-container-runtime.md).

---

## Task 1. Status and health

```bash
docker compose ps
docker inspect mock-containers-api --format 'status={{.State.Status}} health={{.State.Health.Status}}'
```

**What you'll see:** `running`, `health=healthy` (after a few seconds).

---

## Task 2. api logs

```bash
docker compose logs --tail 20 api
docker logs -f --tail 5 mock-containers-api
# Ctrl+C
```

**What you'll see:** Flask lines `Running on http://0.0.0.0:8080`.

---

## Task 3. Exec: Redis from api

**Why:** to check the DNS name `redis` in the backend network.

```bash
docker exec mock-containers-api python -c "
import redis, os
r = redis.Redis(host=os.environ['REDIS_HOST'], port=6379)
print('PING', r.ping())
print('hits', r.get('hits'))
"
```

**What you'll see:** `PING True`; `hits` — a number or `None` before the first external request.

---

## Task 4. Exec: shell and env

```bash
docker exec -it mock-containers-api sh -c 'id; env | grep -E "REDIS|HOSTNAME"'
```

**What you'll see:** UID **10001** (`appuser`); `REDIS_HOST=redis`; hostname `api`.

---

## Task 5. Inspect the network

```bash
docker inspect mock-containers-api --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
docker inspect mock-containers-redis --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

**What you'll see:** api in **two** networks (`frontend`, `backend`); redis — only `backend`.

---

## Task 6. Stop / start a single service

```bash
docker compose stop api
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8088/api/health
docker compose start api
sleep 15
curl -s http://localhost:8088/api/health
```

**What you'll see:** while api is stopped — nginx returns **502** or a connection error on `/api/health`; after start — `{"status":"ok"}`.

---

## Task 7. Recreate

**Why:** a new container after changing env (for learning).

```bash
docker compose up -d --force-recreate api
docker compose ps api
```

**What you'll see:** a new **CREATED** time for the api container.

---

## Task 8. Full reset (optional)

```bash
docker compose down
docker compose up -d --build
```

---

## Success criteria

- [ ] api health — `healthy`
- [ ] `PING` to redis from api succeeds
- [ ] `id` shows the non-root UID 10001
- [ ] On `stop api` the proxy `/api/health` is unavailable
- [ ] Inspect shows the frontend/backend networks

## What to take to work

- `compose logs <service>` = a fast entry point during an incident
- `exec` — checking the network and env without rebuilding the image
- `inspect` — networks and health in JSON

Next lesson: [06. Networking](06-networking.md).
