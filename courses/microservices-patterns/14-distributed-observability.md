# 14. Observability в распределённой системе

## Введение

Лог «ERROR null» в одном из 20 подов без **trace id** — день дебага. Микросервисы **требуют** correlation, distributed tracing и метрики по **dependency**, не только по process.

---

## Три столпа (microservices edition)

| Столп | Microservices focus |
|-------|---------------------|
| **Logs** | structured JSON + `trace_id`, `span_id`, `service.name` |
| **Metrics** | RED per service + client metrics per downstream |
| **Traces** | end-to-end latency breakdown |

[observability-basic](../observability-basic/README.md) → [advanced](../observability-advanced/README.md).

---

## Correlation ID

```http
X-Request-Id: req_abc   (client or edge generates)
traceparent: W3C trace context
```

Пробрасывать через **все** sync и в **metadata** gRPC; в consumer events — в payload или headers Kafka.

Реализация: [fastapi/36–38](../fastapi/36-observability.md).

---

## Distributed tracing

```text
[Gateway span]
   ├─ [Order svc span]
   │     └─ [Payment client span]
   └─ [Inventory client span]
```

| Вопрос | Trace отвечает |
|--------|----------------|
| Где 2s из 3s? | длинный span Payment |
| Сколько fan-out? | количество child spans |

Sampling: 100% errors, 1–10% success в prod.

---

## Метрики зависимостей

```promql
histogram_quantile(0.99,
  sum by (le, downstream) (rate(http_client_request_duration_seconds_bucket[5m]))
)
```

Алерт: **client** p99 к Inventory > 500ms.

---

## Логи ≠ трассировка

Не дублируйте каждый span в лог. **Логируйте** business events и ошибки с `trace_id` для перехода в Jaeger/Tempo.

---

## Service map

Автоматическая карта «кто кого зовёт» — drift detection (появился неожиданный вызов к Legacy).

---

## SLO cross-service

| SLI | Граница |
|-----|---------|
| User checkout success | edge / BFF |
| Payment capture | Payment svc owner |

Error budget одного svc влияет на цепочку — [sre/03](../sre/03-sli-slo.md).

---

## В mock-exams

| Тема | Курс |
|------|------|
| OTel FastAPI | [fastapi/38](../fastapi/38-opentelemetry.md) |
| Prometheus K8s | [kuber-advanced/14](../kuber-advanced/14-observability.md) |
| Loki logs | [observability-intermediate](../observability-intermediate/README.md) |

---

## Подзадачи

**Время:** ~60–70 мин.

### 14.1 Log fields (15 мин)

Список обязательных полей structured log для любого svc (≥10 полей).

### 14.2 Trace walkthrough (15 мин)

Нарисуйте 5 spans для Place Order. Где поставите span attributes (`order.id`)?

### 14.3 Dashboard (15 мин)

Список 6 панелей Grafana для «здоровья» микросервисной фичи checkout.

### 14.4 Alert rules (10 мин)

3 alert: symptom-based (user) + cause-based (dependency).

### 14.5 Sampling policy (10 мин)

Prod: % success traces, % errors, head-based vs tail-based — ваш выбор.

---

## Резюме

Без trace id микросервисы **не дебажатся**. Метрики client-side ловят чужие сбои раньше, чем ваш 500.

---

## Чек-лист

- [ ] trace_id end-to-end?
- [ ] Client metrics per downstream?
- [ ] SLO на границе user journey?

**Дальше:** [15. Независимый deploy и версии](15-deployment-versioning.md).
