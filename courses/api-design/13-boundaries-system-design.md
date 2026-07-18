# 13. Границы сервисов и system design

## Введение

На собеседовании: «Спроектируйте API маркетплейса». Это не CRUD за 5 минут — это **границы**, **консистентность** и **контракты** между командами.

---

## Монолит vs микросервисы (API lens)

| | Monolith API | Microservices |
|--|--------------|---------------|
| Граница | модули внутри | сеть между |
| Транзакции | локальный ACID | saga / eventual |
| Версия | один deploy | N версий, compatibility matrix |
| Клиент | один OpenAPI | BFF или API Gateway aggregation |

Закон Конвея: [devops-culture/05](../devops-culture/05-conway-law.md).

---

## API Gateway и BFF

```text
Mobile ──► BFF (mobile) ──┬──► Orders Svc
Web    ──► BFF (web)    ──┼──► Catalog Svc
Partner──► API GW (auth) ─┘──► Billing Svc
```

| Слой | Задача |
|------|--------|
| **API Gateway** | auth, rate limit, TLS termination, routing |
| **BFF** | агрегация под UI, меньше round-trips |
| **Service** | доменный контракт, не «всё для фронта» |

Не протаскивайте **chatty** 10 HTTP вызовов на один экран без BFF.

---

## Granularity сервисов

| Слишком мелко | Слишком крупно |
|---------------|----------------|
| отдельный svc на каждую таблицу | «God service» 200 endpoints |
| distributed monolith | нельзя деплоить независимо |

Тест: **может ли команда владеть API целиком** и деплоить без согласования 5 команд?

---

## Sync vs async между сервисами

| | Sync HTTP | Events |
|--|-----------|--------|
| Coupling | высокий (cascade failure) | ниже |
| Consistency | immediate | eventual |
| Debug | проще trace | сложнее |

Гибрид: `POST /orders` sync → `order.created` event для warehouse, email, analytics — [messaging-deep/10](../messaging-deep/10-outbox-saga.md).

---

## API composition patterns

| Паттерн | Пример |
|---------|--------|
| **Choreography** | сервисы слушают events, без оркестратора |
| **Orchestration** | saga coordinator вызывает шаги |
| **Strangler** | v1 monolith + v2 новые routes на новый svc |

---

## Case study: заказ

```text
POST /orders
  → Orders: validate, persist (pending)
  → Payment: authorize (sync) OR payment.requested (async)
  → Inventory: reserve (sync with timeout)
  → 201 { id, status: "pending_payment" }

Events: order.created, payment.captured, order.shipped
```

| Решение | Trade-off |
|---------|-----------|
| Sync inventory reserve | проще клиенту; coupling |
| Async reserve + webhook | 202 job; сложнее UX |

Документируйте **state machine** заказа в OpenAPI enum `status`.

---

## Версии в микросервисах

```text
Catalog v3 + Orders v1 + Billing v2  →  BFF адаптирует для клиента v1
```

Клиент видит **одну** версию публичного API; внутренний хаос скрыт за BFF/GW.

---

## Interview checklist

1. Кто клиенты (web, partner, internal)?
2. Read vs write ratio?
3. Consistency requirements (деньги vs каталог)?
4. Idempotency на create?
5. Pagination на списках?
6. Auth (tenant, scopes)?
7. Async для долгих шагов?
8. Events для fan-out?

Связь: [messaging-deep/12](../messaging-deep/12-system-design.md), [fastapi/42 capstone](../fastapi/42-capstone.md).

---

## В mock-exams

| Тема | Курс |
|------|------|
| Outbox / saga | [messaging-deep/10](../messaging-deep/10-outbox-saga.md) |
| FastAPI capstone | [fastapi/42](../fastapi/42-capstone.md) |
| Django multi-app | [django/05](../django/05-apps-structure.md) |
| API Gateway AWS | [aws-intermediate/05](../aws-intermediate/05-api-gateway.md) |

---

## Резюме

API design на уровне системы — **границы**, **согласованность** и **агрегация**. Публичный контракт стабилен; внутренние сервисы могут меняться за BFF.

---

## Чек-лист

- [ ] Нарисованы клиент → GW/BFF → services?
- [ ] Sync vs event для каждого шага?
- [ ] State machine документирована?

**Дальше:** [14. Синтез: API Design Record](14-synthesis.md).
