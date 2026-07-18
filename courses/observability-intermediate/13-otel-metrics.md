# 13. OpenTelemetry: метрики через Collector

> **Опциональная** глава. Требует overlay `docker-compose.otel.yml` и ~1 ГБ RAM сверх базового стека.

## Зачем OTel, если есть Prometheus client

| Подход | Плюс | Минус |
|--------|------|-------|
| `prometheus_client` в приложении | Просто, прямой scrape | Привязка к формату Prometheus |
| **OpenTelemetry SDK** | Один SDK → traces + metrics + logs | Сложнее конфиг |
| **OTel Collector** | Приём OTLP, fan-out в Jaeger/Prometheus/вендор | Ещё один компонент |

В микросервисной среде OTel — **стандартный** слой: приложение шлёт OTLP, Collector маршрутизирует.

## Компоненты на стенде

```bash
docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d
```

| Сервис | Роль |
|--------|------|
| **otel-collector** | Receivers → processors → exporters |
| **jaeger** | UI трейсов (advanced) |
| **prometheus** | Scrape `:8889` (Prometheus exporter коллектора) |

Конфиг: `deploy/observability/config/otel-collector.yml`:

```yaml
receivers:
  otlp:
    protocols:
      grpc: { endpoint: 0.0.0.0:4317 }
      http: { endpoint: 0.0.0.0:4318 }

exporters:
  prometheus:
    endpoint: 0.0.0.0:8889
  otlp/jaeger:
    endpoint: jaeger:4317

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus, debug]
    traces:
      receivers: [otlp]
      exporters: [otlp/jaeger, debug]
```

Метрики OTLP превращаются в **Prometheus exposition format** на порту **8889** внутри сети compose.

## Подключение Prometheus

Добавьте job (вручную в `prometheus.yml` или merge `config/prometheus-otel.yml`):

```yaml
  - job_name: otel-collector
    static_configs:
      - targets: ["otel-collector:8889"]
```

Reload Prometheus. Target **UP** — в Targets появятся метрики вида `otelcol_*` и метрики от instrumented app после лабы.

## Модель данных OTel

- **Meter** → instruments (Counter, Histogram, …).
- Имена и атрибуты маппятся в Prometheus labels при export.
- **Resource attributes** (`service.name`) → labels на все метрики сервиса.

## OTLP endpoints

| Протокол | Порт (стенд) |
|----------|----------------|
| gRPC | 4317 |
| HTTP | 4318 |

Клиент (SDK) → `http://localhost:4318/v1/metrics` (с хоста) или `otel-collector:4317` из другого контейнера.

## Метрики vs трейсы

В этой главе фокус на **metrics pipeline**. Трейсы уходят в Jaeger — полная корреляция в [observability-advanced](../observability-advanced/README.md).

## Когда не усложнять

- Один монолит, один язык, Prometheus native — client library достаточно.
- Платформа требует OTLP (Grafana Cloud, Datadog agent) — Collector обязателен.

## Связь с Kubernetes

В k8s Collector часто DaemonSet + sidecar; scrape ServiceMonitor на collector metrics — см. [15-k8s-servicemonitor.md](15-k8s-servicemonitor.md) и [kuber-advanced/14-observability.md](../kuber-advanced/14-observability.md).

## Чек-лист

- [ ] Понимаете роль Collector между app и Prometheus.
- [ ] Знаете порты OTLP и Prometheus exporter 8889.
- [ ] Различаете pipelines metrics и traces в config.

**Дальше:** [14. Лаба: OTel Collector](14-lab-otel-collector.md).
