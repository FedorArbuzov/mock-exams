# 36. Capstone: Order Processing Platform

## Цель

Построить **production-style** order pipeline на Celery — **4–6 часов**. Форк [`deploy/celery`](../../deploy/celery/stack) или расширение in-place.

---

## Функциональные требования

| # | Feature |
|---|---------|
| 1 | POST `/orders/` → async processing + task_id |
| 2 | Idempotent `process_order` (Redis NX or DB unique) |
| 3 | `send_confirmation_email` with retries + backoff |
| 4 | chord: validate → charge → email → analytics |
| 5 | Beat: hourly stale order cleanup |
| 6 | Routes: `orders`, `emails`, `reports` queues |
| 7 | Split workers (orders vs emails) in compose |
| 8 | Flower + smoke script extended |
| 9 | pytest: ≥10 tests (unit + API mock) |

---

## Non-functional

| # | Requirement |
|---|-------------|
| N1 | JSON serialization only |
| N2 | acks_late + prefetch=1 |
| N3 | No `.get()` in HTTP handlers |
| N4 | Structured logging with order_id |
| N5 | README ops runbook (1 page) |

---

## Фазы

### Phase 1 — Domain tasks (1.5h)

Implement validate_order, charge_payment (mock), send_email, mark_completed. Redis idempotency.

### Phase 2 — Workflows (1h)

chain/chord for checkout pipeline. Error → FAILURE visible in API poll.

### Phase 3 — Ops (1.5h)

Multi-queue workers, beat cleanup, extend smoke.sh for order e2e.

### Phase 4 — Quality (1h)

pytest suite, troubleshooting doc, optional GitLab CI job.

### Phase 5 — Optional (+2h)

- Wire trigger from [`deploy/fastapi`](../../deploy/fastapi/README.md) or [`deploy/django`](../../deploy/django/README.md)
- Prometheus metrics export
- DLX queue in RabbitMQ for failed orders

---

## Критерии приёмки

```bash
cd deploy/celery
docker compose up -d --build
bash scripts/smoke.sh
pytest stack/tests -v
curl -X POST http://localhost:8093/orders/ ...  # e2e
open http://localhost:5555
```

| Check | Pass |
|-------|------|
| smoke.sh | ✓ |
| pytest | ✓ |
| duplicate order_id safe | ✓ |
| beat cleanup in logs | ✓ |
| 2+ queues with dedicated workers | ✓ |

---

## Deliverables

1. Code branch with tasks + compose
2. `CAPSTONE.md` — idempotency + queue split decisions
3. Post-mortem: «100k orders/day — what breaks first?»

---

## Связь с курсами

| Курс | Capstone uses |
|------|---------------|
| rabbitmq-intermediate | DLX, quorum |
| redis-basic | NX dedup |
| python-testing | pytest patterns |
| gitlab-basic | CI pytest job |
| messaging-deep | outbox pattern doc |

Поздравляем — курс **Python Celery** завершён.
