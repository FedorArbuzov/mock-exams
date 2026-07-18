# 01. Стили API: REST, RPC, GraphQL, gRPC, events

## Введение

«Сделаем REST» часто означает «JSON по HTTP» — без ресурсов, без кодов статуса и без мысли о клиентах. На собеседовании и в проде важно назвать **стиль** и объяснить **trade-offs**, а не спорить о чистоте REST Level 3.

---

## Пять подходов

| Стиль | Транспорт | Сильная сторона | Слабая сторона |
|-------|-----------|-----------------|----------------|
| **REST (resource-oriented)** | HTTP + JSON | кэш, стандартные коды, OpenAPI | много round-trip для графа данных |
| **RPC (procedure-oriented)** | HTTP/JSON, gRPC | простые команды «сделай X» | путается с REST, хуже кэш |
| **GraphQL** | HTTP POST | один запрос — граф полей | сложность, N+1, кэш CDN |
| **gRPC** | HTTP/2, protobuf | скорость, streaming, контракт | браузер, публичные партнёры |
| **Events (async)** | Kafka, SQS, webhooks | decoupling, replay | eventual consistency |

```text
Sync request/response          Async
─────────────────────          ─────
Client ──HTTP──► API           Producer ──► bus ──► consumers
         ◄──JSON──             (webhook / poll для статуса)
```

---

## REST — что имеется в виду на практике

**Хороший REST API** (в смысле индустрии, не академического HATEOAS):

- **Существительные** в URL: `/orders`, `/orders/{id}/items`
- **Глаголы HTTP** несут смысл: GET читает, POST создаёт, PATCH частично меняет
- **Статус-коды** отражают исход: 201 + `Location`, 409 при конфликте
- **Stateless** сервер: контекст в токене/заголовках, не в сессии на сервере

**Не REST:** `POST /api/getOrder`, `GET /api/deleteUser?id=5`.

---

## RPC поверх HTTP

Допустим для **внутренних** сервисов и **команд**:

```http
POST /rpc/orders.cancel
{"order_id": "ord_42", "reason": "customer_request"}
```

Плюсы: явное действие, проще для legacy-клиентов. Минусы: всё через POST, кэш бесполезен, OpenAPI менее выразителен.

**Правило:** публичный продуктовый API — resource REST; внутренний «сделай отмену» — RPC или gRPC.

---

## GraphQL — когда уместен

| Подходит | Не подходит |
|----------|-------------|
| Мобильное приложение с разными экранами | Простой CRUD с 3 эндпоинтами |
| BFF перед множеством микросервисов | Жёсткие SLA на p99 без tuning |
| Партнёры хотят выбирать поля | Нужен агрессивный CDN-кэш GET |

Связь с [13-boundaries-system-design](13-boundaries-system-design.md) (BFF).

---

## gRPC

- **Protobuf** — бинарный контракт, codegen для клиентов
- **Streaming** — server/client/bidirectional
- Типично: **service-to-service** внутри mesh/K8s, не замена публичного REST

В mock-exams gRPC не разбирается отдельным курсом; для собеседования достаточно: «публично REST/OpenAPI, внутри mesh — gRPC».

---

## Events вместо или вместе с API

| Сценарий | Sync API | Events |
|----------|----------|--------|
| «Создай заказ сейчас» | POST /orders | — |
| «Уведоми 5 систем о заказе» | 5 HTTP вызовов из API | один `order.created` |
| «Пересчитай отчёт за вчера» | долгий POST | job + webhook/poll |

Подробнее: [messaging-deep](../messaging-deep/README.md), [11-async-webhooks](11-async-webhooks.md).

---

## В mock-exams

| Стиль | Курс |
|-------|------|
| REST + OpenAPI | [fastapi](../fastapi/README.md), [django](../django/README.md) |
| Async/events | [messaging-deep](../messaging-deep/README.md), [python-celery](../python-celery/README.md) |
| Webhooks | [fastapi/25](../fastapi/25-websockets-sse.md), [11-async-webhooks](11-async-webhooks.md) |

---

## Резюме

Сначала **кто клиент** (браузер, мобилка, партнёр, другой сервис), потом стиль. Публичный HTTP JSON — чаще **resource REST + OpenAPI**. Внутри кластера — **gRPC**. Изменения состояния для многих подписчиков — **events**.

---

## Чек-лист

- [ ] Ваш текущий API — REST, RPC или «смесь»?
- [ ] Есть ли операции, которые лучше вынести в события?
- [ ] Нужен ли BFF/GraphQL между клиентом и микросервисами?

**Дальше:** [02. HTTP: методы, коды, safe и idempotent](02-http-semantics.md).
