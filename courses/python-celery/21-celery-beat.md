# 21. Celery Beat: periodic tasks

## Введение

Каждую минуту — cleanup carts. Каждую ночь — reports. **Celery Beat** publishes scheduled tasks to broker; workers execute them.

## Что вы узнаете

- `beat_schedule` configuration.
- crontab vs interval.
- Single beat rule, timezone.

---

## beat_schedule

```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    "cleanup-expired-carts-every-minute": {
        "task": "shop.tasks.cleanup_expired_carts",
        "schedule": 60.0,  # seconds
    },
    "nightly-report": {
        "task": "shop.tasks.generate_report",
        "args": ("nightly",),
        "schedule": crontab(hour=2, minute=0),
        "options": {"queue": "reports"},
    },
}
```

Стенд: [`celery_app.py`](../../deploy/celery/stack/shop/celery_app.py) — cleanup every 60s.

---

## Run beat

```bash
celery -A shop.celery_app beat --loglevel=info
```

Docker: service `beat` in compose. **Exactly one beat** per schedule namespace.

---

## crontab examples

```python
crontab(minute=0, hour="*/3")      # every 3 hours
crontab(minute=0, hour=9, day_of_week="mon-fri")
crontab(day_of_month=1, hour=0)    # monthly
```

---

## timezone

```python
app.conf.timezone = "UTC"
app.conf.enable_utc = True
```

Business local time → set `timezone = "Europe/Moscow"` + `enable_utc` carefully.

---

## django-celery-beat (mention)

Django: schedules in **admin** via `django-celery-beat` — dynamic cron without redeploy.

---

## Beat vs systemd cron

| Beat | cron |
|------|------|
| same codebase as tasks | shell scripts |
| needs broker + worker | standalone |
| distributed lock needed for multi-beat | single host |

---

## Missed schedules

Beat catches up **one** missed tick if down briefly — not full backlog replay. Long outage → manual run.

---

## Типичные ошибки

| Ошибка | Effect |
|--------|--------|
| 2 beat instances | duplicate periodic tasks |
| No worker on queue | schedule fires, tasks pile up |
| Heavy job every minute | overload — increase interval |

## Резюме

Beat = scheduler publishing to broker. `beat_schedule` in config. One beat process. crontab for complex schedules.

Далее: [22-lab-beat](22-lab-beat.md).
