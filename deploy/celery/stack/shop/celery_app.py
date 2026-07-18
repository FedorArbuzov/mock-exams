from celery import Celery

from shop.config import settings

app = Celery("shop")
app.conf.update(
    broker_url=settings.celery_broker_url,
    result_backend=settings.celery_result_backend,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "shop.tasks.process_order": {"queue": "orders"},
        "shop.tasks.generate_report": {"queue": "reports"},
    },
    beat_schedule={
        "cleanup-expired-carts-every-minute": {
            "task": "shop.tasks.cleanup_expired_carts",
            "schedule": 60.0,
        },
    },
)

import shop.tasks  # noqa: F401, E402 — register tasks with app
