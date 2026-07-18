# 22. Лаба: cleanup beat task

## Цель

Наблюдать **periodic** `cleanup_expired_carts` каждые 60 секунд в logs и Flower.

---

## Шаг 1. Verify beat running

```bash
docker compose ps beat
docker compose logs beat --tail=20
```

Scheduler entries — `cleanup-expired-carts-every-minute`.

---

## Шаг 2. Worker logs

```bash
docker compose logs worker -f | grep "cleanup expired"
```

Line every ~60s: `Beat: cleanup expired carts`.

---

## Шаг 3. Add crontab task (optional)

In `celery_app.py`:

```python
from celery.schedules import crontab

"nightly-report": {
    "task": "shop.tasks.generate_report",
    "args": ("nightly",),
    "schedule": crontab(minute="*/2"),  # every 2 min for lab
    "options": {"queue": "reports"},
},
```

Rebuild beat. Reports queue every 2 min.

---

## Шаг 4. Stop beat — no new periodic

```bash
docker compose stop beat
# cleanup stops appearing
docker compose start beat
```

---

## Шаг 5. Duplicate beat anti-pattern demo

```bash
docker compose up -d --scale beat=2
# WARNING: duplicate schedules — don't do in prod
docker compose up -d --scale beat=1
```

---

## Критерии приёмки

- [ ] cleanup logs every 60s with single beat
- [ ] Stopping beat stops periodic tasks
- [ ] Optional crontab task fires on reports queue

Далее: [23-routes-queues](23-routes-queues.md).
