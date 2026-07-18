# 19. System design: разбор кейсов

## Введение

Три типовых кейса собеседования и архитектурного review — с **подзадачами** полного разбора. Используйте паттерны курса; не начинайте с «20 микросервисов».

---

## Кейс A — E-commerce checkout

**Требования:** 10k orders/hour peak, payment PCI scope изолирован, inventory не oversell, email async.

### Референсная архитектура

```text
[BFF] → Order (sync create)
     → sync Reserve Inventory (short timeout)
     → sync Authorize Payment
     → async OrderPlaced → Notification, Analytics, Warehouse
```

| Решение | Паттерн |
|---------|---------|
| Inventory reserve | sync + local TX или saga step |
| Payment | отдельный svc / PCI boundary |
| Fan-out | outbox + events |
| Read catalog | CQRS/cache |

### Типичные ошибки кандидата

- Sync вызов analytics в checkout path
- Shared `orders` table
- Нет idempotency на POST /orders

---

## Кейс B — Upload & process (image-platform)

**Требования:** upload large files, async processing, notify when done ([image-platform](../aws-intermediate/projects/image-platform/)).

```text
POST /uploads → 202 + upload_id
S3 presigned URL
Event upload.completed → Worker → processing
GET /jobs/{id} or webhook
```

| Решение | Паттерн |
|---------|---------|
| Long work | async job ([api-design/11](../api-design/11-async-webhooks.md)) |
| Storage | S3 ([python-aws](../python-aws/README.md)) |
| Queue | SQS / Celery |

Микросервисы **опциональны** — сначала modular monolith + worker.

---

## Кейс C — Multi-tenant SaaS billing

**Требования:** tenant isolation, usage metering, invoice monthly, audit.

| Сервис | Владение |
|--------|----------|
| Identity/Tenant | tenant_id claim |
| Usage | append-only events |
| Billing | invoice generation |
| Notification | email |

| Паттерн | Применение |
|---------|------------|
| DB per tenant (enterprise) или row-level `tenant_id` | trade-off cost |
| Event sourcing usage | audit |
| Saga | invoice + payment fail compensate |

---

## Framework ответа (45 мин interview)

| Минута | Блок |
|--------|------|
| 0–5 | уточняющие вопросы (scale, consistency, clients) |
| 5–15 | high-level diagram + bounded contexts |
| 15–25 | API + data + sync/async |
| 25–35 | failure modes + saga/resilience |
| 35–45 | observability, deploy, evolution |

---

## В mock-exams

| Кейс | Курс |
|------|------|
| FastAPI system design | [fastapi/40](../fastapi/40-system-design.md) |
| Async microservices | [python-async/34](../python-async/34-system-design-async.md) |
| Messaging SD | [messaging-deep/12](../messaging-deep/12-system-design.md) |

---

## Подзадачи

**Время:** ~90–120 мин (выберите **один** кейс полностью или **три** кратко).

### 19.A E-commerce (если выбран A)

| # | Задача | Время |
|---|--------|-------|
| A1 | Уточняющие вопросы (≥8) | 10 мин |
| A2 | Context map + diagram | 20 мин |
| A3 | Sync vs async таблица | 15 мин |
| A4 | Saga failure matrix | 15 мин |
| A5 | Observability + SLO | 10 мин |
| A6 | «Почему не 15 сервисов» | 10 мин |

### 19.B Image platform (если выбран B)

| # | Задача | Время |
|---|--------|-------|
| B1 | API endpoints list | 15 мин |
| B2 | Job state machine | 15 мин |
| B3 | AWS/queue choice ADR | 15 мин |
| B4 | Webhook security | 10 мин |
| B5 | Monolith vs 2 svc | 15 мин |

### 19.C Billing SaaS (если выбран C)

| # | Задача | Время |
|---|--------|-------|
| C1 | Tenant isolation model | 20 мин |
| C2 | Usage event schema | 15 мин |
| C3 | Invoice saga | 20 мин |
| C4 | Audit / compliance | 10 мин |
| C5 | Cost estimate order of magnitude | 15 мин |

---

## Резюме

Хороший design **сначала** monolith/modular + явные границы; микросервисы — где scale/org требуют. Всегда: failure, idempotency, observability.

---

## Чек-лист

- [ ] Один кейс разобран end-to-end?
- [ ] Есть rejected «набросать 20 svc»?
- [ ] Failure mode не забыт?

**Дальше:** [20. Синтез: Architecture Decision Record](20-synthesis.md).
