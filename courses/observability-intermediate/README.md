# Observability — intermediate

Промежуточный курс по **наблюдаемости** на стеке Prometheus / Grafana / Alertmanager с расширением **логами** (Loki, Promtail) и введением в **SLO**, **маршрутизацию алертов**, **гистограммы**, **OpenTelemetry** и связку с **Kubernetes ServiceMonitor**.

Формат — «книжные» главы на русском: теория → лабораторная работа на локальном стенде.

## Для кого

- Прошли [observability-basic](../observability-basic/README.md) (или эквивалент: PromQL, scrape, базовые алерты).
- Умеете читать метрики приложения и понимаете разницу **метрики / логи / трейсы**.
- Готовы работать с Docker Compose **4+ ГБ RAM**.

## Стенд

Все лабы опираются на репозиторий:

| Режим | Команда |
|-------|---------|
| База (метрики) | `cd deploy/observability && docker compose up -d --build` |
| + логи | `docker compose -f docker-compose.yml -f docker-compose.logs.yml up -d` |
| + OTel (опц.) | `docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d` |

Подробности: [deploy/observability/README.md](../../deploy/observability/README.md).

| Сервис | URL / порт |
|--------|------------|
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 (`admin` / `admin`) |
| Alertmanager | http://localhost:9093 |
| demo-app | http://localhost:8000 (`/metrics`) |
| Loki (overlay) | http://localhost:3100 |
| Jaeger (overlay OTel) | http://localhost:16686 |

Smoke и нагрузка:

```bash
bash deploy/observability/scripts/smoke.sh
bash deploy/observability/scripts/traffic.sh
```

## Связанные курсы

- **Kafka:** мониторинг lag и broker-метрик — [kafka-intermediate/17-monitoring.md](../kafka-intermediate/17-monitoring.md); лаба по lag — [18-lab-lag-drill.md](../kafka-intermediate/18-lab-lag-drill.md).
- **Kubernetes:** kube-prometheus-stack и ServiceMonitor — [kuber-advanced/14-observability.md](../kuber-advanced/14-observability.md).

## Программа

| № | Теория | Лаба |
|---|--------|------|
| 01 | [Recording rules](01-recording-rules.md) | [02](02-lab-recording.md) |
| 03 | [Loki и LogQL](03-loki-logql.md) | [04](04-lab-loki.md) |
| 05 | [Promtail pipelines](05-promtail-pipelines.md) | [06](06-lab-promtail.md) |
| 07 | [SLO, SLI, SLA](07-slo-sli-sla.md) | [08](08-lab-error-budget.md) |
| 09 | [Alertmanager routing](09-alertmanager-routing.md) | [10](10-lab-routing.md) |
| 11 | [Гистограммы и квантили](11-histograms-quantiles.md) | [12](12-lab-histogram.md) |
| 13 | [OTel metrics](13-otel-metrics.md) | [14](14-lab-otel-collector.md) *(опц. overlay)* |
| 15 | [ServiceMonitor в k8s](15-k8s-servicemonitor.md) | — |
| 16 | [Финальный проект](16-final-project.md) | — |

Примеры для копирования: [examples/logql-queries.txt](examples/logql-queries.txt), [examples/slo-recording-rules.yml](examples/slo-recording-rules.yml).

## Оценка времени

| Блок | Часы |
|------|------|
| Метрики (01–02, 11–12) | 3–4 |
| Логи (03–06) | 4–5 |
| SLO и алерты (07–10) | 4–5 |
| OTel (13–14, опц.) | 2–3 |
| K8s теория + финал (15–16) | 3–4 |
| **Итого** | **~16–21 ч** |

## Чек-лист выпускника

- [ ] Пишете **recording rules** и объясняете, зачем они нужны дашбордам и алертам.
- [ ] Строите запросы **LogQL** в Grafana Explore и связываете лог с метрикой по `trace_id` / labels.
- [ ] Настраиваете **Promtail pipeline** (parse, labels, drop).
- [ ] Формулируете **SLI/SLO**, считаете **error budget**, пишете recording rules под availability.
- [ ] Настраиваете **маршрутизацию Alertmanager** (severity, inhibit, group).
- [ ] Читаете **histogram** и считаете p95 через `histogram_quantile`.
- [ ] *(Опц.)* Принимаете метрики через **OTel Collector** и scrape с `:8889`.
- [ ] Понимаете **ServiceMonitor** в кластере с prometheus-operator.

## Дальше

- [observability-advanced](../observability-advanced/README.md) — трейсы, корреляция, продвинутый Alertmanager, k8s на полном стеке.
