# 14. Лаба: OTel Collector и scrape метрик

> **Опционально.** Базовый курс intermediate можно завершить без этой лабы.

## Цель

Поднять overlay OTel, добавить scrape `otel-collector:8889` в Prometheus, отправить тестовую метрику по OTLP HTTP, увидеть её в Prometheus/Grafana.

## Подготовка

```bash
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d
docker compose ps
```

Jaeger UI: http://localhost:16686 (для проверки traces — опционально).

## Задание 1. Scrape job

В `config/prometheus.yml` добавьте в конец `scrape_configs`:

```yaml
  - job_name: otel-collector
    static_configs:
      - targets: ["otel-collector:8889"]
```

```bash
curl -X POST http://localhost:9090/-/reload
```

**Status → Targets** — `otel-collector` **UP**. Запрос `{job="otel-collector"}` — метрики `otelcol_receiver_*`, `otelcol_exporter_*`.

## Задание 2. OTLP HTTP smoke

С хоста (нужен `curl`):

```bash
curl -s -X POST "http://localhost:4318/v1/metrics" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceMetrics": [{
      "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "otel-lab"}}]},
      "scopeMetrics": [{
        "metrics": [{
          "name": "lab.requests",
          "sum": {
            "dataPoints": [{
              "asInt": "1",
              "timeUnixNano": "'$(date +%s000000000)'"
            }],
            "aggregationTemporality": 2,
            "isMonotonic": true
          }
        }]
      }]
    }]
  }'
```

*Примечание:* точный JSON OTLP/JSON verbose; при ошибке 400 используйте **grpcurl** или мини-скрипт на Python с `opentelemetry-exporter-otlp-proto-http` — главное увидеть рост счётчика на `:8889/metrics`.

Упрощённая проверка без custom metric: достаточно internal metrics collector после reload.

## Задание 3. Grafana

Explore → Prometheus → `otelcol_receiver_accepted_metric_points` (или аналог из вывода `/metrics`).

Панель: rate приёма точек за 5m — доказательство, что pipeline metrics жив.

## Задание 4. Trace (кратко)

```bash
curl -s -X POST "http://localhost:4318/v1/traces" \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}'
```

Или отправьте trace из Jaeger «Generate» в UI, если доступно. Цель — открыть Jaeger и увидеть **хотя бы один** trace path через collector (config `traces` pipeline).

## Задание 5. Документ «когда OTel»

В 5 предложениях: для demo-app на Python оставили бы `prometheus_client` или внедрили OTel SDK? Аргументы.

## Ожидаемый результат

| Проверка | Критерий |
|----------|----------|
| Overlay | otel-collector + jaeger running |
| Prometheus | job otel-collector UP |
| Grafana | Панель на otelcol_* |
| Рефлексия | Текст «когда OTel» |

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| Target down | Сеть compose; имя `otel-collector:8889` |
| Порт 4317 занят | Только один overlay на хосте |
| Нет custom metric | Internal metrics достаточны для зачёта |

## Чек-лист

- [ ] OTel overlay запущен
- [ ] Scrape 8889 настроен
- [ ] Метрики collector видны в Grafana

**Дальше:** [15. ServiceMonitor](15-k8s-servicemonitor.md).
