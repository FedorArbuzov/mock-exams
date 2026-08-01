# 11. Lab: the deploy/containers stack end-to-end

## Lab goal

Bring up **web + api + redis** from scratch, run the **smoke** test, study the **healthy order**, change a service, and do a **rolling recreate** via compose.

## Prerequisites

- Port **8088** is free.
- Theory: [10. Multi-service Compose](10-compose-multi-service.md).

---

## Task 1. Clean start

```bash
cd deploy/containers
docker compose down -v --rmi local 2>/dev/null || true
docker compose up -d --build
docker compose ps -a
```

**What you'll see:** redis → api (health: starting → healthy) → web.

---

## Task 2. Config validation

```bash
docker compose config --services
docker compose config | grep -E "container_name|condition"
```

**What you'll see:** `redis`, `api`, `web`; `condition: service_healthy` on web.

---

## Task 3. Smoke

```bash
bash scripts/smoke.sh
# Windows: .\scripts\smoke.ps1
```

**What you'll see:** HTTP 200 on `/api/health`, hits increments.

---

## Task 4. Observing health

```bash
watch -n2 'docker inspect mock-containers-api --format "{{.State.Health.Status}}"' 
# or manually a few times:
docker inspect mock-containers-api --format '{{.State.Health.Status}}'
```

**What you'll see:** the transition `starting` → `healthy`.

---

## Task 5. Changing api and redeploy

Add a field to the health JSON in `stack/api/app.py`, for example `"service":"api"`:

```python
return jsonify(status="ok", service="api")
```

```bash
docker compose up -d --build api
curl -s http://localhost:8088/api/health
```

**What you'll see:** the new field in the response **without** rebuilding web.

Revert the change if you like.

---

## Task 6. Scale (compose limitation)

```bash
docker compose up -d --scale api=2 2>&1 | tail -3
```

**What you'll see:** an error or warning — **container_name** is fixed; for multiple api replicas you need a different compose (without `container_name`). Record the output in your notes.

---

## Task 7. Logs during a failure

```bash
docker compose stop redis
sleep 2
curl -s http://localhost:8088/api/health || true
docker compose logs --tail 15 api
docker compose start redis
docker compose restart api
```

**What you'll see:** health fails; redis errors in the api logs.

---

## Task 8. Full down

```bash
docker compose down
docker compose ps -a
```

**What you'll see:** an empty list of the project's services.

Bring it up again for the following chapters:

```bash
docker compose up -d --build
```

---

## Success criteria

- [ ] `compose up --build` — all services running, api healthy
- [ ] `smoke.sh` succeeds
- [ ] You understand the depends_on + health order
- [ ] After editing api, only api is redeployed
- [ ] When redis is stopped, the api health fails

## What to take to work

- `docker compose config` — a check before committing
- Smoke — the minimal "the stack is alive" contract
- `--build` after changing the Dockerfile/code

Next lesson: [12. Registry](12-registry.md).
