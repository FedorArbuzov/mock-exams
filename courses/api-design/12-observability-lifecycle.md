# 12. Observability и lifecycle API

## Введение

«API тормозит» — без метрик по route, версии и tenant это спор между backend и «сетью». Observability и **lifecycle** (changelog, deprecation) — часть продукта API, как и схема JSON.

---

## Золотые сигналы для API

| Сигнал | Метрика |
|--------|---------|
| Latency | histogram `http_request_duration_seconds` by route |
| Traffic | `http_requests_total` by method, route, status |
| Errors | rate 5xx, 4xx business |
| Saturation | CPU, pool connections, queue depth |

RED method: Rate, Errors, Duration — [observability-basic](../observability-basic/README.md).

---

## Labels cardinality

```promql
# Хорошо
sum by (handler, method, status) (rate(http_requests_total[5m]))

# Опасно — cardinality explosion
http_requests_total{user_id="..."}
```

В labels: `route template` (`/orders/{id}`), не raw path с uuid.

Реализация: [fastapi/36–37](../fastapi/36-observability.md).

---

## Correlation и tracing

```http
X-Request-Id: req_7c9e6679
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

- Клиент может прислать `X-Request-Id`; сервер дополняет или генерирует
- Возвращайте id в Problem `instance` — [06-errors-problem-details](06-errors-problem-details.md)
- OpenTelemetry: [fastapi/38](../fastapi/38-opentelemetry.md)

---

## Health endpoints

| Path | Назначение | Кто вызывает |
|------|------------|--------------|
| `/health` | liveness (процесс жив) | kubelet |
| `/ready` | DB/redis ok | kubelet, LB |
| `/health/deep` | все зависимости | мониторинг (не каждую секунду) |

Не смешивайте публичный `/health` с утечкой внутренних имён сервисов.

---

## API changelog

Вне OpenAPI — human-readable **CHANGELOG.md** или docs site:

```markdown
## 2024-06-01
- Added optional `metadata` to Order (compatible).
- Deprecated GET /api/v1/legacy-search; use POST /api/v1/orders/search.
```

Связывайте с `info.version` и sunset headers — [07-versioning-compatibility](07-versioning-compatibility.md).

---

## SLO для API

| SLI | Пример SLO |
|-----|------------|
| Availability | 99.9% успешных (non-5xx) |
| Latency | p99 GET /orders < 300ms |
| Correctness | 0 duplicate charges (business metric) |

Error budget → freeze breaking changes: [sre](../sre/README.md).

---

## Synthetic checks

Периодический `GET /health` + критичный `POST` с test key в staging — раньше клиентов узнаёте о поломке.

---

## Документация как lifecycle

| Артефакт | Обновляется когда |
|----------|-------------------|
| OpenAPI | каждый PR с API change |
| Migration guide | breaking / deprecation |
| Postman/Insomnia collection | release tag |
| SDK semver | следует API major |

---

## В mock-exams

| Тема | Курс |
|------|------|
| Prometheus metrics | [fastapi/36–37](../fastapi/36-observability.md) |
| SLO | [observability-intermediate](../observability-intermediate/README.md), [sre/03](../sre/03-sli-slo.md) |
| K8s probes | [kuber-basic probes](../kuber-basic/README.md) |

---

## Резюме

Метрики по **шаблону route**, tracing через request id, health для оркестратора, changelog для людей. API без observability — чёрный ящик для платформы.

---

## Чек-лист

- [ ] RED метрики по handler?
- [ ] Request id в логах и ошибках?
- [ ] Changelog process есть?

**Дальше:** [13. Границы сервисов и system design](13-boundaries-system-design.md).
