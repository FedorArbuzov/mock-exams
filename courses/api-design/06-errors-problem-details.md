# 06. Ошибки и Problem Details (RFC 7807)

## Введение

Клиент получил `400` с телом `{"error": "bad request"}` — что исправить? Поле `email`? Заголовок? Версию API? **Единый формат ошибок** экономит недели интеграций.

---

## Антипаттерны

```json
{ "success": false, "message": "Error" }
{ "error": true, "data": null }
{ "errors": "invalid" }
```

Проблемы: нет **типа** ошибки, нет **привязки к полю**, мониторинг не отличит 400 от 500 по телу.

---

## RFC 7807 Problem Details

```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json

{
  "type": "https://api.example.com/problems/validation-error",
  "title": "Validation failed",
  "status": 422,
  "detail": "One or more fields are invalid.",
  "instance": "/orders/req-abc123",
  "errors": [
    { "field": "items[0].quantity", "code": "min_value", "message": "Must be >= 1" }
  ]
}
```

| Поле | Назначение |
|------|------------|
| `type` | URI идентификатора класса ошибки (стабильный) |
| `title` | кратко для человека |
| `status` | дублирует HTTP (для логов без headers) |
| `detail` | конкретика инцидента |
| `instance` | URI запроса или correlation id |
| extension | `errors[]`, `retry_after`, domain codes |

`type` может быть `about:blank` для generic, но для публичного API лучше **свои URI**.

---

## Коды ошибок приложения

```json
{
  "type": ".../insufficient-stock",
  "code": "INSUFFICIENT_STOCK",
  "detail": "SKU laptop-15: requested 5, available 2"
}
```

| Уровень | Пример |
|---------|--------|
| HTTP status | 409 Conflict |
| `type` / `code` | `ORDER_ALREADY_CANCELLED` |
| `field` | `status` |

Клиенты SDK ветвятся по **`code`**, не по тексту `detail`.

---

## 401 vs 403 vs 404

| Статус | Смысл | Тело |
|--------|-------|------|
| **401** | нет/битый токен | `.../unauthorized` |
| **403** | токен ок, прав нет | `.../forbidden` |
| **404** | ресурс не найден | не раскрывать существование чужих id |

Для multi-tenant: `GET /orders/other-tenant-id` → **404**, не 403 (иначе enumeration).

---

## 422 vs 400

| | 400 Bad Request | 422 Unprocessable |
|--|-----------------|-------------------|
| Синтаксис JSON битый | да | — |
| Семантика полей (Pydantic) | спорно | часто 422 |
| Бизнес-правило «корзина пуста» | 400 или 409 | — |

**Главное:** одна политика на весь API и в OpenAPI.

---

## Ошибки в OpenAPI

```yaml
responses:
  '409':
    description: Conflict
    content:
      application/problem+json:
        schema:
          $ref: '#/components/schemas/Problem'
        example:
          type: https://api.example.com/problems/duplicate-order
          status: 409
          code: DUPLICATE_CLIENT_ORDER_ID
```

---

## Логирование vs ответ клиенту

| В лог (server) | Клиенту |
|----------------|---------|
| stack trace, SQL | нет |
| correlation id | да (`instance` / `request_id`) |
| внутренний shard | нет |

Заголовок **`X-Request-Id`** или `traceparent` — [12-observability-lifecycle](12-observability-lifecycle.md).

---

## В mock-exams

| Тема | Курс |
|------|------|
| HTTPException, handlers | [fastapi/11–12](../fastapi/11-errors-response-model.md) |
| Validation 422 | [fastapi/04](../fastapi/04-pydantic-v2.md) |
| Security errors | [fastapi/22](../fastapi/22-security-checklist.md) |

---

## Резюме

Ошибка — **часть контракта**. Problem Details + стабильные `code` + единая политика статусов. Текст `detail` можно локализовать; логика клиента — по `code`.

---

## Чек-лист

- [ ] Все 4xx/5xx в одном JSON-формате?
- [ ] Есть correlation id в ответе?
- [ ] OpenAPI описывает error responses?

**Дальше:** [07. Версионирование и обратная совместимость](07-versioning-compatibility.md).
