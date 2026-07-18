# 08. Идемпотентность, повторы и rate limit

## Введение

Клиент отправил `POST /payments` — таймаут. Повторил. Два списания. Сеть **будет** терять пакеты; API обязан пережить **at-least-once delivery** на границе.

---

## Где нужна идемпотентность

| Операция | HTTP idempotent? | Нужен Idempotency-Key? |
|----------|------------------|------------------------|
| GET /orders/42 | да | нет |
| PUT /orders/42 (полная замена) | да | желательно при create-by-put |
| PATCH status | часто | при деньгах — да |
| POST /orders | **нет** | **да** |
| POST /payments | **нет** | **да** |

---

## Idempotency-Key (Stripe-style)

```http
POST /orders
Idempotency-Key: 7c9e6679-7425-40de-944b-e07fc1f90ae7
Content-Type: application/json

{ "items": [...], "customer_id": "cus_1" }
```

| Ответ | Смысл |
|-------|-------|
| 201 + тело | первый успех, сохранили key → response |
| 200/201 + **то же** тело | повтор с тем же key и тем же телом |
| 409 | тот же key, **другое** тело |
| 422 | первый запрос ещё в processing (опционально) |

TTL хранения: **24–72 ч** типично.

---

## Хранилище ключей

```text
Redis:  SET idem:{key} → serialized response, EX 86400
Postgres: UNIQUE(idempotency_key), status, response_body, request_hash
```

| | Redis | Postgres |
|--|-------|----------|
| Скорость | высокая | ниже |
| Audit | слабый | сильный |
| Crash между write и response | риск | транзакция |

Реализация: [fastapi/39](../fastapi/39-versioning-idempotency.md).

---

## Retry-safe клиенты

Клиент **должен** retry только:

| Статус | Retry? |
|--------|--------|
| 408, 429 (с Retry-After) | да, с backoff |
| 500, 502, 503, 504 | да, с backoff + idempotency key |
| 400, 401, 403, 404, 409, 422 | **нет** (без смены запроса) |

**Exponential backoff + jitter:**

```text
delay = min(cap, base * 2^attempt) + random(0, jitter)
```

---

## Exactly-once illusion

End-to-end exactly-once **дорого**. Практика:

```text
at-least-once transport + idempotent handler + dedup key
```

Связь: [messaging-deep/02](../messaging-deep/02-delivery-guarantees.md).

---

## Rate limiting

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1718123456
```

| Алгоритм | Поведение |
|----------|-----------|
| Fixed window | простой; burst на границе окна |
| Sliding window | ровнее |
| Token bucket | допускает краткий burst |

Лимиты: **per API key**, **per IP** (осторожно с NAT), **per user**.

Практика: [fastapi/28–29](../fastapi/28-redis-cache.md), [redis-basic](../redis-basic/README.md).

---

## В mock-exams

| Тема | Курс |
|------|------|
| Idempotency-Key | [fastapi/39](../fastapi/39-versioning-idempotency.md) |
| Redis rate limit | [fastapi/29-lab](../fastapi/29-lab-redis.md) |
| Celery retries | [python-celery/15](../python-celery/15-retries-backoff.md) |

---

## Резюме

POST с деньгами **без** Idempotency-Key — инцидент в ожидании. Документируйте retry policy и 429 для клиентов.

---

## Чек-лист

- [ ] Какие POST требуют Idempotency-Key?
- [ ] TTL и 409 на mismatch body?
- [ ] 429 с Retry-After?

**Дальше:** [09. Аутентификация и авторизация API](09-auth-patterns.md).
