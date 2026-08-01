# 27. Flower, monitoring, metrics

## Intro

"Tasks stuck" — without visibility, ops are blind. **Flower** = a web UI for Celery. Production adds Prometheus + alerts.

## What you'll learn

- Flower dashboards.
- `inspect`, `control` CLI.
- Metrics to watch.

---

## Flower

```bash
celery -A shop.celery_app flower --port=5555
```

Stack: [http://localhost:5555](http://localhost:5555)

| View | Info |
|------|------|
| Workers | online, concurrency, processed |
| Tasks | active, reserved, scheduled |
| Monitor | real-time task stream |
| Broker | queue lengths (limited) |

---

## celery inspect

```bash
celery -A shop.celery_app inspect active
celery -A shop.celery_app inspect reserved
celery -A shop.celery_app inspect scheduled
celery -A shop.celery_app inspect stats
```

Scripting health checks in CI.

---

## celery control

```bash
celery -A shop.celery_app control pool_grow 2
celery -A shop.celery_app control shutdown  # graceful worker stop
```

---

## Key metrics (production)

| Metric | Alert |
|--------|-------|
| Queue depth | > threshold 5min |
| Task runtime p99 | SLA breach |
| FAILURE rate | spike |
| Worker count | 0 online |
| Beat last tick | stale scheduler |

[`observability-basic`](../observability-basic/README.md) — Prometheus patterns.

---

## RabbitMQ monitoring

Management UI + `15692/metrics` — [`deploy/rabbitmq`](../../deploy/rabbitmq/README.md).

---

## Logging

Structured logs in tasks:

```python
logger.info("order_processed", extra={"order_id": order_id, "duration_ms": ms})
```

Correlate with `task_id` from `self.request.id`.

---

## Security Flower

**Never expose Flower public** — no auth by default. Behind VPN or enable `flower --basic_auth=user:pass`.

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Flower as only monitoring | add queue depth alerts |
| Public :5555 | firewall / auth |
| Ignore FAILURE rate | alert on ratio |

## Summary

Flower for dev/small prod. inspect/control for ops. Alert on queue depth + failure rate. Protect Flower.

Next: [28-lab-flower](28-lab-flower.md).
