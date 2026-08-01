# 03. Lab: first app

## Lab goal

Spin up the [`deploy/fastapi`](../../deploy/fastapi/README.md) lab stand, explore **OpenAPI** and **Swagger UI**, add a local `GET /api/v1/ping` endpoint (in a separate file, or temporarily in `main.py`), check the responses with `curl`, and record your observations.

## Prerequisites

- Docker is running, port **8090** is free.
- You've read [01. The landscape](01-landscape.md) and [02. First app](02-first-app.md).
- `curl`, and optionally `jq`.

```bash
cd deploy/fastapi
docker compose up -d --build
docker compose ps
bash scripts/smoke.sh
```

The `mock-fastapi-api` container should become **healthy** (wait 20-40s for postgres/redis to pass their healthchecks).

---

## Task 1. Smoke test and health

**Why:** confirm the ASGI server is responding.

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8090/health
curl -s http://localhost:8090/health
```

**What you'll see:** code `200` and the JSON `{"status":"ok"}` (or the equivalent from the `health` router).

**If you get Connection refused:** run `docker compose logs api` and wait for `Application startup complete`.

---

## Task 2. OpenAPI and Swagger

**Why:** partners and QA work through `/docs`.

```bash
curl -s http://localhost:8090/openapi.json | head -c 400
```

Open in a browser:

- [http://localhost:8090/docs](http://localhost:8090/docs)
- [http://localhost:8090/redoc](http://localhost:8090/redoc)

**What you'll see:** the `health` and `items` tags; the `/health`, `/api/v1/items`, `/metrics` paths.

Find the `GET /api/v1/items` operation in Swagger and run **Try it out**.

---

## Task 3. Items API

**Why:** understand the response format of the reference router.

```bash
curl -s http://localhost:8090/api/v1/items | jq .
curl -s http://localhost:8090/api/v1/items/1 | jq .
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8090/api/v1/items/999
```

**What you'll see:** a list with `items` and `total`; item `id: 1`; for `999` — a body with `detail` (the code might still be 200 with a JSON error — note the stand's actual behavior).

---

## Task 4. A local mini-app (no Docker)

**Why:** practice the dev loop before touching the lab stand's code.

Create a `~/fastapi-lab` directory and a `main.py` file:

```python
from fastapi import FastAPI

app = FastAPI(title="Lab Ping")

@app.get("/api/v1/ping")
async def ping():
    return {"pong": True}
```

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install "fastapi[standard]"
uvicorn main:app --reload --port 8000
```

In another terminal:

```bash
curl -s http://localhost:8000/api/v1/ping
curl -s http://localhost:8000/openapi.json | jq '.paths["/api/v1/ping"]'
```

**What you'll see:** `{"pong":true}` and the `get` operation's description in the OpenAPI schema.

Stop uvicorn (`Ctrl+C`).

---

## Task 5. Metrics (optional)

**Why:** ties into [`observability-basic`](../observability-basic/README.md).

```bash
curl -s http://localhost:8090/metrics | head -20
```

**What you'll see:** Prometheus text format, with the `fastapi_http_requests_total` metric after a few requests.

---

## Task 6. Container logs

**Why:** when debugging a prod-like environment, check stdout.

```bash
docker compose logs api --tail 30
```

Run a couple of `curl` requests against `/api/v1/items` and check the logs again.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| Port 8090 is taken | change the mapping in `docker-compose.yml` or stop the conflicting process |
| `api` unhealthy | `docker compose logs postgres redis api`; wait for it to become healthy |
| `smoke.sh` fails | run the smoke commands manually; check `curl` |
| Empty `/docs` | make sure the container was rebuilt: `docker compose up -d --build` |
| `pip install` is slow | use a mirror or a cached venv |

---

## Success criteria

- [ ] `docker compose ps` shows api as **healthy**
- [ ] `smoke.sh` completes with no errors
- [ ] `/docs` opens, `GET /api/v1/items` works from Swagger
- [ ] The local `uvicorn` served `/api/v1/ping` with an OpenAPI description
- [ ] You know where the stand's code lives in the repo (`deploy/fastapi/stack/api`)

## Cleanup

```bash
# just stop the stand (volume data is preserved)
docker compose stop

# full reset (if needed)
docker compose down -v --rmi local
```

Local venv: remove the `~/fastapi-lab` directory if you want.

## Self-check questions

1. What's the difference between the lab stand's URL (`8090`) and the local uvicorn (`8000`)?
2. Where in the OpenAPI JSON do you find the list of tags?
3. Why does the stand's `main.py` use `lifespan`?
4. What's the next lesson that introduces **Pydantic v2**?

Next lesson: [04. Pydantic v2](04-pydantic-v2.md).
