# 05. Lab: ping task and add

## Scenario

Before production tasks — a **health check task**: the worker is alive, the broker is reachable, serialization works.

**Goal:** add/verify `ping` and `add`, and call them via the API and the shell.

---

## Step 1. Tasks (reference already exists)

```python
# shop/tasks.py
@shared_task(name="shop.tasks.ping")
def ping() -> dict:
    return {"pong": True, "at": datetime.now(UTC).isoformat()}

@shared_task(name="shop.tasks.add")
def add(x: int, y: int) -> int:
    return x + y
```

---

## Step 2. Rebuild the worker after changes

```bash
docker compose up -d --build worker api
docker exec mock-celery-worker celery -A shop.celery_app inspect registered | grep ping
```

---

## Step 3. API trigger

```bash
curl -s -X POST http://localhost:8093/tasks/ping/
curl -s -X POST "http://localhost:8093/tasks/add/?x=7&y=5"
```

Poll result:

```bash
curl -s http://localhost:8093/tasks/<task_id>/
```

Expect `"result": 12` for add.

---

## Step 4. Python shell (producer without HTTP)

```bash
docker exec -it mock-celery-api python
```

```python
from shop.tasks import ping, add

r = ping.delay()
r.id, r.get(timeout=10)

add.delay(3, 4).get(timeout=10)
```

---

## Step 5. Sync execute (debug only)

```python
ping()  # direct call — no broker
```

**Never** `task()` in production request path for slow work — blocks API.

`CELERY_TASK_ALWAYS_EAGER=True` — tests only — [31-testing-celery](31-testing-celery.md).

---

## Step 6. Intentional failure task (optional)

Add:

```python
@shared_task
def fail_task():
    raise ValueError("lab failure")
```

Check the state `FAILURE` and `"error"` in GET `/tasks/{id}/`.

---

## Success criteria

- [ ] ping → SUCCESS with `pong: true`
- [ ] add(7,5) → result 12
- [ ] `inspect registered` lists shop.tasks.ping
- [ ] FAILURE task shows the error in the API (optional)

Next: [06-delay-async-result](06-delay-async-result.md).
