# Python — Celery (specialization)

An in-depth course on **Celery 5**: background tasks, the **RabbitMQ** broker, the **Redis** result backend, retries, idempotency, **chains/chords**, **Beat**, routing, **Flower**, Docker, and testing. **36 lessons** + capstone + interview cheatsheet.

**Prerequisites:** basic Python, HTTP ([`fastapi`](../fastapi/README.md) or [`django`](../django/README.md) — at least a skim). Useful in parallel: [`rabbitmq-basic`](../rabbitmq-basic/README.md), [`redis-basic`](../redis-basic/README.md), [`python-testing`](../python-testing/README.md).

**Locally:** [`deploy/celery`](../../deploy/celery/README.md) — `docker compose up -d --build`:

| Service | URL |
|--------|-----|
| API | [http://localhost:8093/health/](http://localhost:8093/health/) |
| Flower | [http://localhost:5555](http://localhost:5555) |
| RabbitMQ UI | [http://localhost:15673](http://localhost:15673) — `course` / `course` |

Smoke test: `bash scripts/smoke.sh` in `deploy/celery`.

## How to read this

1. **Theory** — scenario → concepts → code → common mistakes.
2. **Lab** — the `:8093` stack, edits go in [`deploy/celery/stack/shop`](../../deploy/celery/stack/shop).
3. After lesson **35** — [`interview-cheatsheet.md`](interview-cheatsheet.md).
4. [36-capstone.md](36-capstone.md) — **4–6 hours**.

**Time:** ~45–60 min per "theory + lab" pair; the whole course is **~18–24 hours**.

## Syllabus (36 lessons)

### Phase 1. Landscape and your first task (01–06)
| 01 | [Task queues: Celery vs SQS vs raw AMQP](01-task-queues-landscape.md) |
| 02 | [Architecture: broker, worker, backend](02-celery-architecture.md) |
| 03 | [Lab: explore the stack](03-lab-explore-stack.md) |
| 04 | [Celery app: configuration, shared_task](04-celery-app-config.md) |
| 05 | [Lab: a ping task](05-lab-first-task.md) |
| 06 | [delay, apply_async, AsyncResult](06-delay-async-result.md) |

### Phase 2. Broker and backend (07–12)
| 07 | [RabbitMQ as broker: AMQP, queues](07-rabbitmq-broker.md) |
| 08 | [Lab: queues in the Management UI](08-lab-rabbit-queues.md) |
| 09 | [Redis: broker vs result backend](09-redis-backend.md) |
| 10 | [Lab: results in Redis](10-lab-redis-results.md) |
| 11 | [Serialization, content types, limits](11-serialization.md) |
| 12 | [Lab: JSON payloads](12-lab-json-tasks.md) |

### Phase 3. Reliability (13–18)
| 13 | [acks_late, prefetch, visibility](13-acks-prefetch.md) |
| 14 | [Lab: ack scenarios](14-lab-acks.md) |
| 15 | [Retries, backoff, max_retries](15-retries-backoff.md) |
| 16 | [Lab: retry a welcome email](16-lab-retries.md) |
| 17 | [Idempotency, deduplication, outbox](17-idempotency.md) |
| 18 | [Lab: idempotent order](18-lab-idempotent-order.md) |

### Phase 4. Workflows (19–24)
| 19 | [chain, group, chord, canvas](19-workflows-canvas.md) |
| 20 | [Lab: report pipeline](20-lab-pipeline.md) |
| 21 | [Celery Beat: periodic tasks](21-celery-beat.md) |
| 22 | [Lab: cleanup beat task](22-lab-beat.md) |
| 23 | [Routes, queues, priorities](23-routes-queues.md) |
| 24 | [Lab: multi-queue workers](24-lab-multi-queue.md) |

### Phase 5. Integration and ops (25–30)
| 25 | [FastAPI / Django integration](25-api-integration.md) |
| 26 | [Lab: trigger from the API](26-lab-api-trigger.md) |
| 27 | [Flower, monitoring, metrics](27-flower-monitoring.md) |
| 28 | [Lab: Flower dashboard](28-lab-flower.md) |
| 29 | [Docker, scaling workers](29-docker-scaling.md) |
| 30 | [Lab: scale workers](30-lab-scale-workers.md) |

### Phase 6. Quality and senior-level topics (31–36)
| 31 | [Testing: eager mode, pytest](31-testing-celery.md) |
| 32 | [Lab: test tasks](32-lab-testing.md) |
| 33 | [Troubleshooting production](33-troubleshooting.md) |
| 34 | [Security: signing, broker ACL](34-security.md) |
| 35 | [Interview Q&A (top 35)](35-interview-qa.md) |
| 36 | [Capstone: Order processing platform](36-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## What you'll come away with

- You can explain **when to reach for Celery**, and when SQS/Kafka/cron is the better fit.
- You can write **tasks** with retries, idempotency, and routing.
- You can configure **Beat**, **Flower**, and **multi-queue workers**.
- You can integrate with **FastAPI/Django** and deploy to **Docker**.

## Related courses

| Course | Connection |
|------|-------|
| [`rabbitmq-basic`](../rabbitmq-basic/README.md) | AMQP, DLX, quorum |
| [`redis-basic`](../redis-basic/README.md) | result backend, TTL |
| [`fastapi`](../fastapi/README.md) | API trigger pattern |
| [`django`](../django/README.md) | django-celery integration |
| [`messaging-deep`](../messaging-deep/README.md) | queue vs log, outbox |
| [`python-testing`](../python-testing/README.md) | pytest for tasks |
| [`gitlab-basic`](../gitlab-basic/README.md) | CI worker tests |

## Reference code

[`deploy/celery/stack/shop`](../../deploy/celery/stack/shop) — `celery_app.py`, `tasks.py`, `main.py` (FastAPI).
