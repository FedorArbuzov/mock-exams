# 16. Стратегия тестирования микросервисов

## Введение

E2E на 20 сервисов — медленный и хрупкий. Пирамида тестов **сдвигается** к contract и integration; E2E — **критические** user journeys только.

---

## Test pyramid (microservices)

```text
        ┌─────────┐
        │ E2E few │  5–15 сценариев
        ├─────────┤
        │Contract │  consumer-provider
        ├─────────┤
        │ Integr. │  svc + real DB/broker testcontainer
        ├─────────┤
        │  Unit   │  domain logic
        └─────────┘
```

---

## Unit tests

Доменная логика **без** сети: saga transitions, pricing rules, state machine.

[python-testing](../python-testing/README.md).

---

## Integration tests

| Компонент | Стенд |
|-----------|-------|
| Order svc | Postgres testcontainer |
| + outbox relay | embedded или test Kafka |
| + Redis | testcontainers |

[python-testing/22 testcontainers](../python-testing/22-testcontainers.md).

---

## Contract tests

Consumer (Order) публикует ожидания к Provider (Inventory):

```text
Given GET /sku/42
Expect 200 { "available": 10 }
```

Pact, OpenAPI diff ([fastapi/32](../fastapi/32-contract-tests.md)).

**Ломает CI** при breaking без согласования.

---

## Component tests (service in isolation)

Поднимаете Order + mock Inventory (WireMock, pytest-httpx) — быстрее E2E.

---

## E2E

| Делать | Не делать |
|--------|-----------|
| Happy path checkout | 500 комбинаций фильтров |
| Auth + payment sandbox | тестить чужой svc внутри |

Стенд: staging `mockctl` + [deploy/fastapi](../../deploy/fastapi/README.md), [deploy/celery](../../deploy/celery/README.md).

---

## Testing async / events

| Подход | Описание |
|--------|----------|
| In-memory broker | unit saga |
| Testcontainer Kafka | integration outbox |
| Assert on outbox table | без broker |

---

## В mock-exams

| Тема | Курс |
|------|------|
| pytest | [python-testing](../python-testing/README.md) |
| API tests | [fastapi/30–31](../fastapi/30-testing.md) |
| Contract | [fastapi/32](../fastapi/32-contract-tests.md) |
| Interview | [python-testing cheatsheet](../python-testing/interview-cheatsheet.md) |

---

## Подзадачи

**Время:** ~60–70 мин.

### 16.1 Pyramid для продукта (15 мин)

Оцените % усилий unit/integration/contract/e2e для вашей системы (сумма 100%).

### 16.2 Contract pair (20 мин)

Выберите consumer-provider. Напишите 3 contract examples (request/response).

### 16.3 Integration scope (15 мин)

Для Order svc: что в testcontainer (DB, Redis, Kafka)? Что mock?

### 16.4 E2E list (10 мин)

5 E2E сценариев max — только critical journeys.

### 16.5 Flaky test policy (10 мин)

Правило: flaky test → quarantine за N дней → fix or delete.

---

## Резюме

Contract tests — **страховка** независимого deploy. E2E дорог — берегите для journeys, не для coverage vanity.

---

## Чек-лист

- [ ] Contract на каждую sync dependency?
- [ ] Outbox/integration test есть?
- [ ] E2E < 20 сценариев?

**Дальше:** [17. Антипаттерны](17-anti-patterns.md).
