# 05. Лаба: ping task и add

## Сценарий

Перед production tasks — **health check task**: worker жив, broker reachable, serialization works.

**Цель:** добавить/проверить `ping` и `add`, вызвать через API и shell.

---

## Шаг 1. Tasks (эталон уже есть)

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

## Шаг 2. Rebuild worker после изменений

```bash
docker compose up -d --build worker api
docker exec mock-celery-worker celery -A shop.celery_app inspect registered | grep ping
```

---

## Шаг 3. API trigger

```bash
curl -s -X POST http://localhost:8093/tasks/ping/
curl -s -X POST "http://localhost:8093/tasks/add/?x=7&y=5"
```

Poll result:

```bash
curl -s http://localhost:8093/tasks/<task_id>/
```

Ожидаем `"result": 12` для add.

---

## Шаг 4. Python shell (producer без HTTP)

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

## Шаг 5. Sync execute (debug only)

```python
ping()  # direct call — no broker
```

**Never** `task()` in production request path for slow work — blocks API.

`CELERY_TASK_ALWAYS_EAGER=True` — tests only — [31-testing-celery](31-testing-celery.md).

---

## Шаг 6. Intentional failure task (optional)

Добавьте:

```python
@shared_task
def fail_task():
    raise ValueError("lab failure")
```

Проверьте state `FAILURE` и `"error"` в GET `/tasks/{id}/`.

---

## Критерии приёмки

- [ ] ping → SUCCESS с `pong: true`
- [ ] add(7,5) → result 12
- [ ] `inspect registered` lists shop.tasks.ping
- [ ] FAILURE task показывает error в API (optional)

Далее: [06-delay-async-result](06-delay-async-result.md).
