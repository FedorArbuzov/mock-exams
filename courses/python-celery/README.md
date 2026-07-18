# Python — Celery (специализация)

Мега-подробный курс по **Celery 5**: фоновые задачи, **RabbitMQ** broker, **Redis** result backend, retries, idempotency, **chains/chords**, **Beat**, routing, **Flower**, Docker, тесты. **36 уроков** + capstone + interview cheatsheet.

**Предварительно:** базовый Python, HTTP ([`fastapi`](../fastapi/README.md) или [`django`](../django/README.md) — хотя бы обзор). Полезно параллельно: [`rabbitmq-basic`](../rabbitmq-basic/README.md), [`redis-basic`](../redis-basic/README.md), [`python-testing`](../python-testing/README.md).

**Локально:** [`deploy/celery`](../../deploy/celery/README.md) — `docker compose up -d --build`:

| Сервис | URL |
|--------|-----|
| API | [http://localhost:8093/health/](http://localhost:8093/health/) |
| Flower | [http://localhost:5555](http://localhost:5555) |
| RabbitMQ UI | [http://localhost:15673](http://localhost:15673) — `course` / `course` |

Smoke: `bash scripts/smoke.sh` в `deploy/celery`.

## Как читать

1. **Теория** — сценарий → концепции → код → типичные ошибки.
2. **Лаба** — стенд `:8093`, правки в [`deploy/celery/stack/shop`](../../deploy/celery/stack/shop).
3. После **35** — [`interview-cheatsheet.md`](interview-cheatsheet.md).
4. [36-capstone.md](36-capstone.md) — **4–6 часов**.

**Время:** ~45–60 мин на пару «теория + лаба»; весь курс **~18–24 часа**.

## Программа (36 уроков)

### Фаза 1. Ландшафт и первый task (01–06)
| 01 | [Task queues: Celery vs SQS vs raw AMQP](01-task-queues-landscape.md) |
| 02 | [Архитектура: broker, worker, backend](02-celery-architecture.md) |
| 03 | [Лаба: explore стенд](03-lab-explore-stack.md) |
| 04 | [Celery app: конфигурация, shared_task](04-celery-app-config.md) |
| 05 | [Лаба: ping task](05-lab-first-task.md) |
| 06 | [delay, apply_async, AsyncResult](06-delay-async-result.md) |

### Фаза 2. Broker и backend (07–12)
| 07 | [RabbitMQ как broker: AMQP, queues](07-rabbitmq-broker.md) |
| 08 | [Лаба: очереди в Management UI](08-lab-rabbit-queues.md) |
| 09 | [Redis: broker vs result backend](09-redis-backend.md) |
| 10 | [Лаба: результат в Redis](10-lab-redis-results.md) |
| 11 | [Serialization, content types, limits](11-serialization.md) |
| 12 | [Лаба: JSON payloads](12-lab-json-tasks.md) |

### Фаза 3. Надёжность (13–18)
| 13 | [acks_late, prefetch, visibility](13-acks-prefetch.md) |
| 14 | [Лаба: ack scenarios](14-lab-acks.md) |
| 15 | [Retries, backoff, max_retries](15-retries-backoff.md) |
| 16 | [Лаба: retry welcome email](16-lab-retries.md) |
| 17 | [Idempotency, deduplication, outbox](17-idempotency.md) |
| 18 | [Лаба: idempotent order](18-lab-idempotent-order.md) |

### Фаза 4. Workflows (19–24)
| 19 | [chain, group, chord, canvas](19-workflows-canvas.md) |
| 20 | [Лаба: report pipeline](20-lab-pipeline.md) |
| 21 | [Celery Beat: periodic tasks](21-celery-beat.md) |
| 22 | [Лаба: cleanup beat task](22-lab-beat.md) |
| 23 | [Routes, queues, priorities](23-routes-queues.md) |
| 24 | [Лаба: multi-queue workers](24-lab-multi-queue.md) |

### Фаза 5. Integration и ops (25–30)
| 25 | [FastAPI / Django integration](25-api-integration.md) |
| 26 | [Лаба: trigger from API](26-lab-api-trigger.md) |
| 27 | [Flower, monitoring, metrics](27-flower-monitoring.md) |
| 28 | [Лаба: Flower dashboard](28-lab-flower.md) |
| 29 | [Docker, scaling workers](29-docker-scaling.md) |
| 30 | [Лаба: scale workers](30-lab-scale-workers.md) |

### Фаза 6. Quality и senior (31–36)
| 31 | [Testing: eager mode, pytest](31-testing-celery.md) |
| 32 | [Лаба: test tasks](32-lab-testing.md) |
| 33 | [Troubleshooting production](33-troubleshooting.md) |
| 34 | [Security: signing, broker ACL](34-security.md) |
| 35 | [Interview Q&A (топ-35)](35-interview-qa.md) |
| 36 | [Capstone: Order processing platform](36-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## Что должно получиться

- Объясняете **когда Celery**, а когда SQS/Kafka/cron.
- Пишете **tasks** с retries, idempotency, routing.
- Настраиваете **Beat**, **Flower**, **multi-queue workers**.
- Интегрируете с **FastAPI/Django** и деплоите в **Docker**.

## Связь с курсами

| Курс | Связь |
|------|-------|
| [`rabbitmq-basic`](../rabbitmq-basic/README.md) | AMQP, DLX, quorum |
| [`redis-basic`](../redis-basic/README.md) | result backend, TTL |
| [`fastapi`](../fastapi/README.md) | API trigger pattern |
| [`django`](../django/README.md) | django-celery integration |
| [`messaging-deep`](../messaging-deep/README.md) | queue vs log, outbox |
| [`python-testing`](../python-testing/README.md) | pytest для tasks |
| [`gitlab-basic`](../gitlab-basic/README.md) | CI worker tests |

## Эталонный код

[`deploy/celery/stack/shop`](../../deploy/celery/stack/shop) — `celery_app.py`, `tasks.py`, `main.py` (FastAPI).
