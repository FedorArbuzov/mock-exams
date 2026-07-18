# 14. Синтез: API Design Record

## Практическое задание

Выберите продукт:

- [image-platform](../aws-intermediate/projects/image-platform/) (upload → process → status), или
- [fastapi/42 capstone](../fastapi/42-capstone.md) (tasks API), или
- свой сервис.

### Deliverable: API Design Record (ADR) (2–3 ч)

**1. Context**

| Поле | Значение |
|------|----------|
| Клиенты | web / mobile / partners / M2M |
| Публичный или internal | |
| Ожидаемый RPS (order of magnitude) | |
| Критичность (деньги, PII) | |

**2. Style decision**

Обоснуйте: REST / RPC / events / комбинация.

| Критерий | REST | Events | Выбор |
|----------|------|--------|-------|
| Кэш GET | | | |
| Fan-out уведомлений | | | |
| Долгие операции | | | |

**3. Resource map**

```text
/...
  ├── ...
  └── ...
```

Таблица: resource, methods, id type, auth scope.

**4. Contract snippets**

- OpenAPI fragment (1 create + 1 list + 1 error response)
- Пример Problem Details
- Pagination format (cursor или offset — почему)

**5. Cross-cutting**

| Тема | Решение |
|------|---------|
| Versioning | `/api/v1`, sunset policy |
| Idempotency | какие POST + TTL |
| Rate limit | лимиты per key |
| Errors | `application/problem+json` |
| Long-running | 202 + job + webhook? |

**6. Security**

- BOLA test scenario
- Scopes matrix (role × endpoint)
- Что не попадает в JSON response

**7. Observability**

- 3 ключевые метрики (RED)
- SLO draft (availability, p99)
- `X-Request-Id` policy

**8. Rejected alternatives**

Минимум две: «почему не GraphQL», «почему не sync для step X».

---

## Мастер-таблица курса

| Вопрос | Глава |
|--------|-------|
| REST vs gRPC vs events? | [01](01-landscape-styles.md) |
| Какой метод и статус? | [02](02-http-semantics.md) |
| Как назвать URL? | [03](03-resource-modeling.md) |
| Где OpenAPI? | [04](04-openapi-contracts.md) |
| Как резать списки? | [05](05-pagination-filtering.md) |
| Формат ошибок? | [06](06-errors-problem-details.md) |
| Когда v2? | [07](07-versioning-compatibility.md) |
| Повтор POST? | [08](08-idempotency-retries.md) |
| Кто может вызвать? | [09](09-auth-patterns.md) |
| OWASP baseline? | [10](10-security-public-api.md) |
| Долгий запрос? | [11](11-async-webhooks.md) |
| Метрики и changelog? | [12](12-observability-lifecycle.md) |
| BFF и границы? | [13](13-boundaries-system-design.md) |

---

## Карта курса

```text
01–03  Стили, HTTP, ресурсы
04–07  OpenAPI, списки, ошибки, версии
08–10  Идемпотентность, auth, security
11–14  Async, ops, system design, ADR
```

---

## В mock-exams — практика

| ADR пункт | Курс |
|-----------|------|
| Реализовать CRUD + OpenAPI | [fastapi](../fastapi/README.md) |
| DRF + serializers | [django](../django/README.md) |
| Contract tests | [fastapi/32](../fastapi/32-contract-tests.md) |
| Idempotency + v2 | [fastapi/39](../fastapi/39-versioning-idempotency.md) |
| Events после create | [messaging-deep](../messaging-deep/README.md) |
| Metrics | [fastapi/36–37](../fastapi/36-observability.md) |

---

## Резюме

Хороший API — не «красивый JSON», а **согласованный контракт** на годы: ресурсы, ошибки, версии, безопасность и способ эволюции. ADR фиксирует решения до первой строки кода.

---

## Чек-лист финала

- [ ] ADR согласован с OpenAPI fragment?
- [ ] Есть rejected alternatives?
- [ ] Idempotency и pagination явно указаны?
- [ ] Security matrix заполнена?

**Курс завершён.** Дальше: [fastapi/42 capstone](../fastapi/42-capstone.md), [messaging-deep](../messaging-deep/README.md), [appsec-fundamentals](../appsec-fundamentals/README.md).
