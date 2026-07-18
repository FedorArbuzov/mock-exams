# 13. Resilience: timeout, retry, circuit breaker, bulkhead

## Введение

Один медленный Inventory роняет весь checkout — **cascade failure**. Устойчивость — **явные** timeout, retry с jitter, circuit breaker и изоляция пулов (bulkhead).

---

## Timeout (обязателен)

Без timeout = зависший thread/goroutine до вечности.

```text
client_timeout ≥ sum(hops) + margin
каждый hop передаёт remaining deadline
```

Связь: [05-sync-communication](05-sync-communication.md).

---

## Retry

| Retry | Не retry |
|-------|----------|
| 503, 502, connection reset | 400, 401, 404, 409 |
| idempotent GET | POST без idempotency key |

**Exponential backoff + full jitter:**

```text
sleep = random(0, min(cap, base * 2^attempt))
```

Лимит попыток: 3–5; иначе **retry storm** на recovering service.

---

## Circuit breaker (CB)

```text
Closed → (errors > threshold) → Open → (wait) → Half-Open → probe
```

| Состояние | Поведение |
|-----------|-----------|
| Closed | нормальные вызовы |
| Open | fail fast, не нагружать sick svc |
| Half-Open | один пробный запрос |

Библиотеки: resilience4j, tenacity, Polly; в mesh — outlier detection.

---

## Bulkhead

Изолируйте ресурсы:

```text
Pool A: checkout → inventory (max 20 threads)
Pool B: admin reports (max 5)
```

Падение reports не съедает пул checkout.

---

## Fallback vs fail fast

| Стратегия | Когда |
|-----------|-------|
| Fail fast + 503 | критичные данные (цена, stock) |
| Cached fallback | recommendations, аватары |
| Default empty | non-critical blocks |

Не возвращайте **устаревшую цену** из cache без маркировки.

---

## Bulkhead + rate limit

Edge rate limit ([api-design/08](../api-design/08-idempotency-retries.md)) + per-dependency limit внутри svc.

---

## В mock-exams

| Тема | Курс |
|------|------|
| Async timeouts | [python-async/34](../python-async/34-system-design-async.md) |
| Celery retry | [python-celery/15](../python-celery/15-retries-backoff.md) |
| HPA / resources | [kuber-intermediate](../kuber-intermediate/README.md) |

---

## Подзадачи

**Время:** ~60–70 мин.

### 13.1 Policy table (20 мин)

Для 4 downstream зависимостей: timeout | max retries | retryable codes | CB threshold | fallback |

### 13.2 Cascade scenario (15 мин)

Опишите cascade без CB; тот же сценарий с CB + bulkhead (2 абзаца).

### 13.3 Retry storm (10 мин)

Сервис восстановился — почему retry всех клиентов опасен? Как jitter помогает?

### 13.4 Half-open probe (10 мин)

Какие метрики смотрите перед закрытием CB?

### 13.5 Code sketch (15 мин)

Псевдокод `call_with_resilience(dependency_config)` — без привязки к языку.

---

## Резюме

Resilience — **политики по зависимостям**, не глобальный «retry=3». Fail fast, isolate pools, не retry non-idempotent POST.

---

## Чек-лист

- [ ] У каждого client есть timeout?
- [ ] POST retry только с idempotency?
- [ ] Bulkhead для тяжёлых путей?

**Дальше:** [14. Observability в распределённой системе](14-distributed-observability.md).
