# 04. OpenAPI: contract-first и code-first

## Введение

Партнёр интегрируется по PDF из Confluence, а вы уже поменяли тип поля в коде. **OpenAPI** (бывший Swagger) — машиночитаемый контракт: документация, моки, SDK, contract tests из одного источника.

---

## Contract-first vs code-first

| Подход | Порядок | Плюсы | Минусы |
|--------|---------|-------|--------|
| **Contract-first** | YAML/JSON OpenAPI → codegen сервер/клиент | согласование до кода | дисциплина, дубли при ручной реализации |
| **Code-first** | код (FastAPI, DRF) → OpenAPI | скорость, меньше рассинхрона | контракт «за кодом», review сложнее |

**FastAPI** — code-first с автогенерацией: `/docs`, `/openapi.json`.

**Компромисс:** code-first + **PR review OpenAPI diff** в CI ([fastapi/32](../fastapi/32-contract-tests.md)).

---

## Структура OpenAPI 3.x

```yaml
openapi: 3.1.0
info:
  title: Orders API
  version: 1.2.0
paths:
  /orders:
    post:
      operationId: createOrder
      requestBody: ...
      responses:
        '201': ...
components:
  schemas:
    Order:
      type: object
      required: [id, status]
      properties:
        id: { type: string, format: uuid }
        status: { $ref: '#/components/schemas/OrderStatus' }
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
```

| Секция | Зачем |
|--------|-------|
| `paths` | эндпоинты, параметры, responses |
| `components/schemas` | переиспользуемые модели |
| `components/responses` | стандартные ошибки |
| `securitySchemes` | OAuth2, API key, bearer |

---

## operationId и теги

- **operationId** — стабильное имя для codegen (`createOrder`, не `create_order_orders_post`)
- **tags** — группировка в UI: `Orders`, `Admin`

---

## Примеры и описания

```yaml
status:
  type: string
  enum: [pending, paid, shipped, cancelled]
  description: Lifecycle state; see state machine in docs.
  example: pending
```

Примеры попадают в Swagger UI — снижают вопросы в Slack.

---

## Request vs response схемы

| Модель | Содержимое |
|--------|------------|
| `OrderCreate` | поля для POST (без `id`, `created_at`) |
| `OrderUpdate` | optional поля для PATCH |
| `Order` | полный ответ GET |
| `OrderSummary` | список без тяжёлых вложений |

Дублирование схем — норма; **не** отдавайте внутренние поля (`password_hash`, `internal_notes`) через «одну большую модель».

Связь: [fastapi/04 Pydantic](../fastapi/04-pydantic-v2.md).

---

## Nullable и required

OpenAPI 3.1 выровнен с JSON Schema:

```yaml
email:
  type: [string, "null"]   # nullable
required: [id, status]     # отсутствие ключа = ошибка валидации
```

Явно документируйте: «поле отсутствует» vs «поле null».

---

## Reusable errors

```yaml
components:
  responses:
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Problem'
```

См. [06-errors-problem-details](06-errors-problem-details.md).

---

## Версионирование spec

| Поле | Смысл |
|------|-------|
| `info.version` | версия **документа** (1.2.0) |
| URL `/api/v1` | версия **runtime** API |

Не путайте: bump `info.version` на каждый compatible fix; **v2 URL** — только на breaking.

---

## В mock-exams

| Тема | Курс |
|------|------|
| Авто-OpenAPI | [fastapi/02](../fastapi/02-first-app.md) |
| Contract tests | [fastapi/32](../fastapi/32-contract-tests.md) |
| DRF + OpenAPI | [django/41](../django/41-interview-qa.md), [django/42](../django/42-capstone.md) |
| Swagger UI | `http://localhost:8090/docs` — [deploy/fastapi](../../deploy/fastapi/README.md) |

---

## Резюме

OpenAPI — **источник правды** для внешних клиентов. Code-first ок, если diff в CI и отдельные Create/Out схемы. Без машинного контракта интеграции деградируют в переписку.

---

## Чек-лист

- [ ] Есть ли `components/schemas` без дублирования в 10 paths?
- [ ] operationId уникальны?
- [ ] Ошибки вынесены в reusable responses?

**Дальше:** [05. Списки: пагинация, фильтры, сортировка](05-pagination-filtering.md).
