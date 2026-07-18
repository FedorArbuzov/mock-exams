# 05. Синхронная коммуникация: REST, gRPC, контракты

## Введение

«Просто вызовем соседа по HTTP» — без timeout, retry policy и контракта превращается в **каскадный сбой**. Sync уместен для **read** и **немедленного решения**; каждый вызов — liability в цепочке latency.

---

## Когда sync

| Подходит | Не подходит |
|----------|-------------|
| Нужен ответ сейчас (цена, stock check) | Fan-out 10+ сервисов на один запрос |
| Простой query | Долгая оркестрация минутами |
| Низкая частота | Высокий throughput fire-and-forget |

Правило: **минимизируйте глубину** sync-цепочки (≤ 2–3 hop для user-facing p99).

---

## REST между сервисами

| Практика | Деталь |
|----------|--------|
| Контракт | OpenAPI + [contract tests](../fastapi/32-contract-tests.md) |
| Версия | `/internal/v1/` отдельно от публичного API |
| Ошибки | Problem Details ([api-design/06](../api-design/06-errors-problem-details.md)) |
| Идемпотентность | Idempotency-Key на mutating POST |

**Consumer-driven contracts** (Pact): downstream задаёт ожидания upstream.

---

## gRPC internal

| | REST JSON | gRPC |
|--|-----------|------|
| Схема | OpenAPI | protobuf |
| Browser | да | нет (обычно) |
| Streaming | редко | да |
| Typing | слабее | сильный codegen |

Типично: **публично REST**, **внутри mesh gRPC**.

---

## Timeout budget

```text
Client deadline: 3000 ms
  Gateway:        500 ms overhead
  Service A:      2000 ms (включая B)
    Service B:    1500 ms max
```

Каждый hop **уменьшает** оставшийся budget; передавайте `deadline` / `grpc-timeout`.

---

## Partial failure в агрегации

BFF вызывает A и B параллельно:

| A | B | UX |
|---|---|-----|
| OK | OK | полный ответ |
| OK | fail | degraded (без блока B) или 503 |
| fail | fail | 503 |

Явная **degradation policy** в ADR ([api-design/13](../api-design/13-boundaries-system-design.md)).

---

## В mock-exams

| Тема | Курс |
|------|------|
| httpx parallel | [python-async/18](../python-async/18-lab-parallel-fetch.md) |
| API design | [api-design](../api-design/README.md) |
| Timeouts async | [python-async/32](../python-async/32-backpressure-semaphores.md) |

---

## Подзадачи

**Время:** ~50–60 мин.

### 5.1 Sync graph (15 мин)

Нарисуйте цепочку для «оформить заказ» (UI → … → сервисы). Подпишите sync вызовы. Посчитите **максимальную глубину**.

### 5.2 Timeout budget (15 мин)

Задайте p99 UI = 2s. Распределите budget по hop (таблица service | timeout | обоснование).

### 5.3 OpenAPI fragment (15 мин)

Один internal endpoint `GET /internal/v1/inventory/{sku}` — request/response/errors (псевдо-YAML или bullet).

### 5.4 Degradation (10 мин)

BFF: catalog OK, recommendations fail — что отдаёте клиенту? JSON sketch.

### 5.5 Contract test plan (5 мин)

Кто consumer, кто provider? Какой тест ломает CI при breaking change?

---

## Резюме

Sync — **долг latency и coupling**. Контракт, timeout budget и degradation обязательны; глубокие цепочки — сигнал к async или пересборке границ.

---

## Чек-лист

- [ ] Depth sync ≤ 3 для user path?
- [ ] Internal API versioned?
- [ ] Degradation описана?

**Дальше:** [06. Асинхронность и event-driven](06-async-events.md).
