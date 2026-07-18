# API Design

Теоретический курс **«как проектировать HTTP API»**: REST-семантика, моделирование ресурсов, **OpenAPI**, ошибки, версии, идемпотентность, auth, webhooks и границы сервисов. Формат «книги» на русском, **без нового стенда** — практика в [fastapi](../fastapi/README.md), [django](../django/README.md) и `deploy/*`.

**Для кого:** backend-разработчики, tech lead, platform engineer; те, кто проектирует **публичный или внутренний API** и готовит **system design** / собеседования.

**Предварительно (хотя бы одно, лучше два):**

| Курс | Зачем |
|------|--------|
| [fastapi/02](../fastapi/02-first-app.md) | OpenAPI из коробки, первый эндпоинт |
| [nginx-basic](../nginx-basic/README.md) | HTTP, reverse proxy, TLS |
| [postgresql-basic/03](../postgresql-basic/03-databases-schemas.md) | сущности и связи в данных |

**Полезно:** [fastapi/39](../fastapi/39-versioning-idempotency.md), [fastapi/32](../fastapi/32-contract-tests.md), [messaging-deep](../messaging-deep/README.md) (async/events), [microservices-patterns](../microservices-patterns/README.md) (границы и saga), [appsec-fundamentals](../appsec-fundamentals/README.md).

## Как читать

- Главы **01–12** — ~**35–50 мин** каждая.
- Блок **«В mock-exams»** — куда идти за hands-on.
- [Финал](14-synthesis.md) — **API Design Record (ADR)** для одного продукта (**2–3 ч**).

**Время:** ~**12–16 часов**.

## Программа

### Часть I — Основы (01–03)

| № | Глава |
|---|--------|
| 01 | [Стили API: REST, RPC, GraphQL, gRPC, events](01-landscape-styles.md) |
| 02 | [HTTP: методы, коды, safe и idempotent](02-http-semantics.md) |
| 03 | [Моделирование ресурсов и URL](03-resource-modeling.md) |

### Часть II — Контракт (04–07)

| № | Глава |
|---|--------|
| 04 | [OpenAPI: contract-first и code-first](04-openapi-contracts.md) |
| 05 | [Списки: пагинация, фильтры, сортировка](05-pagination-filtering.md) |
| 06 | [Ошибки и Problem Details (RFC 7807)](06-errors-problem-details.md) |
| 07 | [Версионирование и обратная совместимость](07-versioning-compatibility.md) |

### Часть III — Надёжность и безопасность (08–10)

| № | Глава |
|---|--------|
| 08 | [Идемпотентность, повторы и rate limit](08-idempotency-retries.md) |
| 09 | [Аутентификация и авторизация API](09-auth-patterns.md) |
| 10 | [Безопасность публичного API](10-security-public-api.md) |

### Часть IV — Жизненный цикл (11–14)

| № | Глава |
|---|--------|
| 11 | [Асинхронные API: webhooks, polling, long-running](11-async-webhooks.md) |
| 12 | [Observability и lifecycle API](12-observability-lifecycle.md) |
| 13 | [Границы сервисов и system design](13-boundaries-system-design.md) |
| 14 | [Синтез: API Design Record](14-synthesis.md) |

## Стенды (опционально)

| Практика | Где |
|----------|-----|
| FastAPI + OpenAPI | [`deploy/fastapi`](../../deploy/fastapi/README.md) — [fastapi](../fastapi/README.md) |
| Django REST Framework | [`deploy/django`](../../deploy/django/README.md) — [django](../django/README.md) |
| Contract tests | [fastapi/32](../fastapi/32-contract-tests.md), [python-testing](../python-testing/README.md) |
| nginx / TLS | [`deploy/nginx`](../../deploy/nginx/README.md) |

## Что должно получиться

- Выбираете стиль API (**REST vs RPC vs events**) по задаче, а не по моде.
- Проектируете **ресурсы, URL и коды ответов** без «POST /getUserById».
- Описываете контракт в **OpenAPI** и отличаете breaking от compatible изменений.
- Закладываете **Idempotency-Key**, единый формат ошибок и **deprecation policy**.
- Оформляете **ADR** «API заказов v1» с альтернативами и чеклистом безопасности.

## Связь с fastapi

[fastapi](../fastapi/README.md) — **реализация** на Python. **API Design** — **принципы**, применимые к FastAPI, DRF, Go, Node. Пересечение: [39-versioning-idempotency](../fastapi/39-versioning-idempotency.md), [32-contract-tests](../fastapi/32-contract-tests.md), [22-security-checklist](../fastapi/22-security-checklist.md). Дальше: [microservices-patterns](../microservices-patterns/README.md) — saga, outbox, миграция с монолита.
