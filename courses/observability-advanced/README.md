# Observability — Advanced

Продвинутый уровень для **собеседований** и **on-call**: **distributed tracing** (OpenTelemetry, Jaeger), **Kubernetes monitoring** (kube-prometheus-stack, ServiceMonitor), **cardinality и стоимость**, **runbooks**, **mock interview**, **system design** observability-платформы и **on-call capstone**.

**Предварительно:** базовые метрики/алерты (курсы `observability-basic` / `observability-intermediate`, если есть в репозитории) или практика с Prometheus/Grafana. Полезно: [`kuber-advanced/14`](../kuber-advanced/14-observability.md), [`aws-intermediate/19`](../aws-intermediate/19-cloudwatch.md).

**Локально (Docker):** [`deploy/observability`](../../deploy/observability/README.md) — Prometheus, Grafana, Alertmanager, demo-app. **Overlay traces:** `docker-compose.otel.yml` → Jaeger UI **16686**.

**Kubernetes (опционально, 4+ ГБ RAM):** `mockctl up` + **kube-prometheus-stack** — как в [kuber-advanced/14](../kuber-advanced/14-observability.md).

| Стенд | Команда | UI |
|-------|---------|-----|
| Базовый | `cd deploy/observability && docker compose up -d --build` | Grafana `3000`, Prometheus `9090` |
| + Traces | `docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d` | Jaeger `16686` |
| K8s | `helm install kube-prom ...` (см. 03) | `kubectl port-forward` Grafana/Prometheus |

Перед сменой стенда: `docker compose down -v` — иначе конфликт портов.

## Как читать главы

Каждый урок — **глава книги** под подготовку к интервью, не сухая шпаргалка.

1. **Теория** (01, 03, 05…) — сценарий с работы → концепции → стенд/команды → типичные ошибки → «на собеседовании» → резюме.
2. **Лаба** (02, 04, 06…) — цель → предварительно → задания → «что увидите» / «если не работает» → критерии успеха.
3. После блоков 09–10 — пройдите [`interview-cheatsheet.md`](interview-cheatsheet.md) без подглядывания в ответы.

**Время:** ~60–90 минут на пару «теория + лаба»; [capstone](13-on-call-capstone.md) — **4–6 часов**.

## Программа

### Traces и OTel (01–02)

| # | Урок |
|---|------|
| 01 | [OpenTelemetry и traces](01-otel-traces.md) |
| 02 | [Лаба: Jaeger и OTLP](02-lab-jaeger.md) |

### Kubernetes metrics (03–04)

| 03 | [kube-prometheus-stack](03-kube-prometheus.md) |
| 04 | [Лаба: ServiceMonitor](04-lab-servicemonitor.md) |

### Стоимость и cardinality (05–06)

| 05 | [Cardinality и cost](05-cardinality-cost.md) |
| 06 | [Лаба: cardinality](06-lab-cardinality.md) |

### On-call (07–08)

| 07 | [Troubleshooting и runbooks](07-troubleshooting-runbooks.md) |
| 08 | [Лаба: on-call drill](08-lab-oncall-drill.md) |

### Интервью (09–10)

| 09 | [Interview Q&A (топ-30)](09-interview-qa.md) |
| 10 | [Лаба: mock interview](10-lab-mock-interview.md) |

### System design (11–12)

| 11 | [System design: observability](11-system-design-observability.md) |
| 12 | [Лаба: system design](12-lab-system-design.md) |

### Capstone

| 13 | [On-call capstone](13-on-call-capstone.md) |

### Шпаргалка и примеры

| — | [Interview cheatsheet](interview-cheatsheet.md) |
| — | [examples/runbook-template.md](examples/runbook-template.md) |
| — | [examples/otel-span.json](examples/otel-span.json) |

## Что должно получиться

- Объясняете **три столпа** (metrics, logs, traces) и когда какой использовать.
- Настраиваете **OTLP → Collector → Jaeger**, читаете **trace** (spans, parent/child, attributes).
- Ставите **kube-prometheus-stack**, пишете **ServiceMonitor** / **PrometheusRule**.
- Оцениваете **cardinality** и стоимость хранения; избегаете `user_id` в labels.
- Ведёте **runbook** по RED/USE; коррелируете метрики, логи и traces.
- Отвечаете на **system design** «observability для 200 микросервисов» с trade-offs.
- Связываете стенд с **Redis monitoring** и **CloudWatch** в гибридных схемах.

## Связь с другими курсами

| Курс | Связь |
|------|-------|
| [`kuber-advanced/14`](../kuber-advanced/14-observability.md) | Helm install, port-forward, базовые метрики |
| [`kuber-advanced/15`](../kuber-advanced/15-lab-observability.md) | OOMKilled, PromQL в кластере |
| [`redis-intermediate/15`](../redis-intermediate/15-monitoring.md) | INFO, SLOWLOG, exporter — метрики datastore |
| [`redis-advanced/09`](../redis-advanced/09-troubleshooting.md) | Runbook-стиль диагностики |
| [`aws-intermediate/19`](../aws-intermediate/19-cloudwatch.md) | Logs, metric filters, alarms, X-Ray |
| [`aws-intermediate/20`](../aws-intermediate/20-lab-cloudwatch.md) | Лаба alarms на Lambda/DLQ |
| [`linux-advanced/23`](../linux-advanced/23-capacity-runbooks.md) | Capacity и runbooks на хосте |
