import logging
import random
import time
from datetime import UTC, datetime

from celery import shared_task
from celery.exceptions import Reject

logger = logging.getLogger(__name__)

# In-memory store for lab demos (not production)
ORDERS: dict[str, dict] = {}
PROCESSED_IDS: set[str] = set()


@shared_task(name="shop.tasks.ping")
def ping() -> dict:
    return {"pong": True, "at": datetime.now(UTC).isoformat()}


@shared_task(name="shop.tasks.send_welcome_email", bind=True, max_retries=3)
def send_welcome_email(self, user_id: str, email: str) -> dict:
    logger.info("Sending welcome email user_id=%s email=%s", user_id, email)
    time.sleep(0.5)
    if random.random() < 0.15:
        raise self.retry(countdown=2 ** self.request.retries)
    return {"user_id": user_id, "email": email, "status": "sent"}


@shared_task(name="shop.tasks.process_order", bind=True, max_retries=5, acks_late=True)
def process_order(self, order_id: str, amount: str) -> dict:
    if order_id in PROCESSED_IDS:
        logger.info("Duplicate order_id=%s — idempotent skip", order_id)
        return {"order_id": order_id, "status": "already_processed"}

    logger.info("Processing order_id=%s amount=%s", order_id, amount)
    time.sleep(1.0)

    if amount == "fail":
        raise Reject("Simulated permanent failure", requeue=False)

    if amount == "retry":
        raise self.retry(countdown=3, exc=RuntimeError("transient payment error"))

    PROCESSED_IDS.add(order_id)
    ORDERS[order_id] = {"amount": amount, "status": "completed"}
    return {"order_id": order_id, "status": "completed", "amount": amount}


@shared_task(name="shop.tasks.generate_report", bind=True)
def generate_report(self, report_type: str) -> dict:
    logger.info("Generating report type=%s", report_type)
    time.sleep(3.0)
    return {"report_type": report_type, "rows": 42, "generated_at": datetime.now(UTC).isoformat()}


@shared_task(name="shop.tasks.cleanup_expired_carts")
def cleanup_expired_carts() -> dict:
    logger.info("Beat: cleanup expired carts")
    return {"removed": 0, "at": datetime.now(UTC).isoformat()}


@shared_task(name="shop.tasks.add")
def add(x: int, y: int) -> int:
    return x + y
