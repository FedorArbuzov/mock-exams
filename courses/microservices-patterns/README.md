# Microservices Patterns

Теоретический курс **«как проектировать и эволюционировать распределённую систему»**: когда дробить монолит, **bounded context**, sync/async, **saga**, **outbox/CQRS**, устойчивость, observability, тестирование и миграция. Формат «книги» на русском с **подзадачами** в каждой главе; **без нового стенда** — hands-on в существующих курсах и `deploy/*`.

**Для кого:** backend / platform / tech lead; архитекторы перед **system design**, рефакторингом монолита или собеседованием.

**Предварительно (хотя бы два):**

| Курс | Зачем |
|------|--------|
| [containers-basic](../containers-basic/README.md) | образы, сеть, deploy unit |
| [messaging-deep](../messaging-deep/README.md) | очереди, гарантии, outbox (вводная) |
| [api-design](../api-design/README.md) | HTTP-контракты, BFF, границы API |

**Полезно:** [kuber-intermediate](../kuber-intermediate/README.md), [observability-intermediate](../observability-intermediate/README.md), [devops-culture/05–08](../devops-culture/05-conway-law.md), [python-celery](../python-celery/README.md), [fastapi/40](../fastapi/40-system-design.md).

## Как читать

- Главы **01–18** — ~**45–60 мин** (теория + **подзадачи**).
- Главы **19–20** — case studies и **финальный ADR** (**3–4 ч**).
- Блок **«В mock-exams»** — практика в других курсах.
- В конце каждой главы — **чек-лист**; не переходите дальше, пока подзадачи не сделаны (хотя бы в черновике).

**Время:** ~**20–28 часов**.

## Программа

### Часть I — Когда и как дробить (01–04)

| № | Глава |
|---|--------|
| 01 | [Монолит vs микросервисы: decision framework](01-monolith-vs-microservices.md) |
| 02 | [Bounded context и декомпозиция домена](02-bounded-context-ddd.md) |
| 03 | [Конвей и топология команд](03-conway-teams.md) |
| 04 | [Strangler Fig и поэтапное выделение](04-strangler-extraction.md) |

### Часть II — Коммуникация (05–08)

| № | Глава |
|---|--------|
| 05 | [Синхронная коммуникация: REST, gRPC, контракты](05-sync-communication.md) |
| 06 | [Асинхронность и event-driven architecture](06-async-events.md) |
| 07 | [API Gateway, BFF и service mesh (обзор)](07-gateway-bff-mesh.md) |
| 08 | [Database per service и владение данными](08-database-per-service.md) |

### Часть III — Данные и согласованность (09–12)

| № | Глава |
|---|--------|
| 09 | [Saga: оркестрация и хореография](09-saga-patterns.md) |
| 10 | [Outbox, inbox и event sourcing](10-outbox-eventsourcing.md) |
| 11 | [CQRS и read models](11-cqrs-read-models.md) |
| 12 | [CAP, eventual consistency и компромиссы](12-consistency-cap.md) |

### Часть IV — Устойчивость и эксплуатация (13–16)

| № | Глава |
|---|--------|
| 13 | [Resilience: timeout, retry, circuit breaker, bulkhead](13-resilience-patterns.md) |
| 14 | [Observability в распределённой системе](14-distributed-observability.md) |
| 15 | [Независимый deploy, версии и feature flags](15-deployment-versioning.md) |
| 16 | [Стратегия тестирования микросервисов](16-testing-strategy.md) |

### Часть V — Антипаттерны и миграция (17–18)

| № | Глава |
|---|--------|
| 17 | [Антипаттерны: distributed monolith и др.](17-anti-patterns.md) |
| 18 | [Playbook миграции с монолита](18-migration-playbook.md) |

### Часть VI — Синтез (19–20)

| № | Глава |
|---|--------|
| 19 | [System design: разбор кейсов](19-system-design-cases.md) |
| 20 | [Синтез: Architecture Decision Record](20-synthesis.md) |

## Стенды (опционально)

| Паттерн | Практика |
|---------|----------|
| HTTP + несколько сервисов | [deploy/python-async](../../deploy/python-async/README.md), [python-async/18](../python-async/18-lab-parallel-fetch.md) |
| Очереди / saga / outbox | [deploy/celery](../../deploy/celery/README.md), [deploy/kafka](../../deploy/kafka/README.md), [messaging-deep/10](../messaging-deep/10-outbox-saga.md) |
| K8s deploy | `mockctl` + [kuber-intermediate](../kuber-intermediate/README.md) |
| Tracing | [observability-advanced](../observability-advanced/README.md), [fastapi/38](../fastapi/38-opentelemetry.md) |
| Contract tests | [fastapi/32](../fastapi/32-contract-tests.md), [python-testing](../python-testing/README.md) |

## Что должно получиться

- Обоснуете **нужны ли** микросервисы для продукта (и когда вернуться к монолиту).
- Нарисуете **bounded contexts**, sync/async границы и **владельца данных**.
- Спроектируете **saga** с компенсациями и **outbox** для критичных событий.
- Заложите **timeout/retry/CB** и **distributed tracing**.
- Оформите **ADR** «разбиение Order Platform» с фазами миграции.

## Связь с другими курсами

| Курс | Пересечение |
|------|-------------|
| [messaging-deep](../messaging-deep/README.md) | брокеры, DLQ, outbox (углубление транспорта) |
| [api-design](../api-design/README.md) | публичный контракт, BFF, versioning |
| [devops-culture](../devops-culture/README.md) | Conway, Team Topologies |
| [sre](../sre/README.md) | SLO, инциденты, error budget |
