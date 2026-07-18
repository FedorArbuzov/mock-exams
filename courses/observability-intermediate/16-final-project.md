# 16. Финальный проект: observability для demo-сервиса

## Цель

Собрать **минимальный production-like** контур наблюдаемости вокруг `deploy/observability` demo-app: метрики (recording + SLO), логи (Loki), алерты (routing), дашборд и короткий runbook. Опционально — OTel overlay.

Оценка: **4–6 часов** самостоятельной работы.

## Требования

### 1. Инфраструктура

```bash
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.logs.yml up -d --build
bash scripts/smoke.sh
```

Опционально: `-f docker-compose.otel.yml`.

### 2. Метрики и SLO

- Recording rules: RPS, error ratio, **p95 latency** (см. [02](02-lab-recording.md), [08](08-lab-error-budget.md), [12](12-lab-histogram.md)).
- Файл rules на базе [examples/slo-recording-rules.yml](examples/slo-recording-rules.yml).
- Документ `docs/slo-demo-app.md`:
  - SLI (availability + latency),
  - SLO target и окно,
  - error budget policy (2–3 предложения).

### 3. Алерты

Минимум **три** alerting rules:

| Алерт | Условие (идея) | severity |
|-------|----------------|----------|
| Target down | `up{job="demo-app"}==0` | critical |
| High error rate | 5xx ratio > порога | warning |
| SLO burn / latency | availability или p95 | warning или critical |

Alertmanager: **два** receiver (например `critical` / `warning`), **один** inhibit rule ([10-lab-routing.md](10-lab-routing.md)).

### 4. Логи

- Promtail pipeline: `docker` stage + извлечение хотя бы одного поля в label **низкой** кардинальности ([06-lab-promtail.md](06-lab-promtail.md)).
- Файл [examples/logql-queries.txt](examples/logql-queries.txt) дополните **5 своими** запросами с комментарием «зачем».
- Панель **Logs** на дашборде с корреляцией по времени с метрикой ошибок.

### 5. Дашборд Grafana

Один dashboard `Demo Platform` с рядами:

1. Availability (SLO recording).
2. RPS и error ratio.
3. p95 latency (heatmap или stat).
4. Logs panel (Loki).
5. *(Опц.)* OTel collector health.

Экспорт JSON положите в `deploy/observability/config/grafana/provisioning/dashboards/json/demo-platform.json` **или** приложите в отчёт `dashboard-demo-platform.json`.

### 6. Runbook (1 страница)

`docs/runbook-demo-high-errors.md`:

1. Симптом (какой алерт).
2. Проверки (PromQL + LogQL + `docker compose ps`).
3. Действия (restart, traffic, escalate).
4. Ссылка на Kafka lag runbook, если у вас параллельно поднят Kafka — [18-lab-lag-drill.md](../kafka-intermediate/18-lab-lag-drill.md).

### 7. *Опционально* Kubernetes

Если проходите [kuber-advanced](../kuber-advanced/README.md): ServiceMonitor на учебное приложение + один PrometheusRule с recording `slo:*` — опишите в отчёте скрин Targets.

## Сдача (чек-лист)

- [ ] `docker compose ps` — все нужные сервисы healthy
- [ ] Prometheus Rules — все группы green
- [ ] Alertmanager — тестовый firing + resolve задокументирован
- [ ] Grafana dashboard — 4+ панели
- [ ] `docs/slo-demo-app.md` + `docs/runbook-demo-high-errors.md`
- [ ] Расширенный `examples/logql-queries.txt` (5 запросов)
- [ ] Краткий отчёт `REPORT.md`: что сделали, что бы улучшили в production

## Критерии качества

| Уровень | Признаки |
|---------|----------|
| Базовый | Метрики + один алерт + Loki Explore |
| Intermediate | SLO recording, routing, dashboard, runbook |
| Сильный | Inhibit, p95 SLO, pipeline labels обоснованы, связка с Kafka/k8s в отчёте |

## Очистка

```bash
docker compose -f docker-compose.yml -f docker-compose.logs.yml down -v
```

## Дальше

- [observability-advanced](../observability-advanced/README.md) — трейсы, корреляция триады, продвинутый burn-rate.
- [kuber-advanced/14-observability.md](../kuber-advanced/14-observability.md) — полный стек в кластере.
- [kafka-intermediate/17-monitoring.md](../kafka-intermediate/17-monitoring.md) — мониторинг потоков.

Поздравляем с завершением **observability-intermediate**.
