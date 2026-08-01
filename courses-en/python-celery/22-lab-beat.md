# 22. Lab: cleanup beat task

## Goal

Observe the **periodic** `cleanup_expired_carts` every 60 seconds in logs and Flower.

---

## Step 1. Verify beat running

```bash
docker compose ps beat
docker compose logs beat --tail=20
```

Scheduler entries — `cleanup-expired-carts-every-minute`.

---

## Step 2. Worker logs

```bash
docker compose logs worker -f | grep "cleanup expired"
```

Line every ~60s: `Beat: cleanup expired carts`.

---

## Step 3. Add crontab task (optional)

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

## Step 4. Stop beat — no new periodic

```bash
docker compose stop beat
# cleanup stops appearing
docker compose start beat
```

---

## Step 5. Duplicate beat anti-pattern demo

```bash
docker compose up -d --scale beat=2
# WARNING: duplicate schedules — don't do in prod
docker compose up -d --scale beat=1
```

---

## Success criteria

- [ ] cleanup logs every 60s with a single beat
- [ ] Stopping beat stops periodic tasks
- [ ] Optional crontab task fires on the reports queue

Next: [23-routes-queues](23-routes-queues.md).
