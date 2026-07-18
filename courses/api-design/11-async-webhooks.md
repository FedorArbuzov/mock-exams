# 11. Асинхронные API: webhooks, polling, long-running

## Введение

`POST /reports/generate` выполняется 40 минут. Держать HTTP-соединение — плохо для LB и мобилки. Долгие операции — **другой контракт**: 202, job id, webhook или poll.

---

## Синхрон vs асинхрон

| Длительность | Паттерн |
|--------------|---------|
| < 2–5 с | sync 200/201 |
| 5–30 с | sync + увеличенный timeout **или** 202 (осторожно) |
| > 30 с | **202 Accepted** + status resource |

```http
POST /imports
→ 202 Accepted
   Location: /jobs/job_abc123
   { "id": "job_abc123", "status": "pending" }

GET /jobs/job_abc123
→ 200 { "status": "running", "progress": 45 }

GET /jobs/job_abc123
→ 200 { "status": "completed", "result_url": "/imports/imp_99" }
```

---

## Модель job

| Поле | Тип |
|------|-----|
| `id` | opaque string |
| `status` | `pending` \| `running` \| `completed` \| `failed` |
| `created_at` | ISO 8601 |
| `completed_at` | nullable |
| `error` | Problem object при failed |
| `progress` | 0–100 optional |

Не возвращайте 500 если job упал — **200** с `status: failed` и деталями.

---

## Webhooks (push)

```text
1. Client регистрирует POST https://partner.com/hooks
2. API завершает job
3. API POST event на URL с HMAC signature
4. Partner 2xx → доставлено; иначе retry с backoff
```

| Практика | Зачем |
|----------|-------|
| `event_id` unique | dedup у получателя |
| `timestamp` | replay protection |
| Retry 3–7 раз | transient failures |
| Dead letter после N | алерт ops |

Реализация очередей: [python-celery](../python-celery/README.md), [messaging-deep](../messaging-deep/README.md).

---

## Polling (pull)

```http
GET /jobs/job_abc123
If-None-Match: "v3"
→ 304 Not Modified   # пока status не менялся
```

Документируйте **рекомендуемый interval** (exponential: 1s, 2s, 5s, 10s… cap 60s).

---

## SSE и WebSockets

| | SSE | WebSocket |
|--|-----|-----------|
| Направление | server → client | двустороннее |
| HTTP совместимость | да | upgrade |
| Use case | статус job, live feed | чат, gaming |

[fastapi/25](../fastapi/25-websockets-sse.md) — не замена webhooks партнёрам (им нужен обычный HTTPS POST).

---

## Callback URL (осторожно SSRF)

Если клиент передаёт `callback_url`:

- whitelist схем `https` only
- block private IP ranges (10/8, 169.254, metadata)
- async fetch через isolated worker

OWASP API7 — [10-security-public-api](10-security-public-api.md).

---

## Идемпотентность событий

Webhook `order.paid` может прийти дважды. Получатель:

```text
if seen(event_id): return 200
process(); store event_id
```

---

## В mock-exams

| Тема | Курс |
|------|------|
| Background tasks | [fastapi/24](../fastapi/24-lifespan-background.md) |
| Celery pipeline | [python-celery/19–20](../python-celery/19-workflows-canvas.md) |
| SQS async | [aws-intermediate/07](../aws-intermediate/07-sqs-dlq.md) |
| EventBridge | [aws-intermediate/09](../aws-intermediate/09-eventbridge.md) |

---

## Резюме

Долгая работа — **ресурс job**, не висящий POST. Webhook для push, poll для простоты клиента; оба с dedup и подписью.

---

## Чек-лист

- [ ] Порог секунд для 202 задокументирован?
- [ ] Webhook retry и DLQ?
- [ ] event_id для идемпотентности?

**Дальше:** [12. Observability и lifecycle API](12-observability-lifecycle.md).
