# 37. Лаба: observability для FastAPI

## Цель лабы

Подключить API [`deploy/fastapi`](../../deploy/fastapi/README.md) к стеку [`deploy/observability`](../../deploy/observability/README.md): scrape `/metrics`, дашборд RED в Grafana, структурные логи (опционально Loki overlay). Сгенерировать трафик и построить PromQL из [observability-basic/03-lab-promql](../observability-basic/03-lab-promql.md).

Теория: [36-observability](36-observability.md).

---

## Предварительно

```bash
cd deploy/observability
docker compose up -d --build
bash scripts/smoke.sh

cd ../fastapi
docker compose up -d --build
curl -s http://localhost:8090/metrics | head -20
```

Рекомендуется **4+ ГБ RAM** для Docker.

| URL | Сервис |
|-----|--------|
| http://localhost:9090 | Prometheus |
| http://localhost:3000 | Grafana (`admin` / `admin`) |
| http://localhost:8090/metrics | FastAPI |

---

## Задание 1. Scrape job для FastAPI

Добавьте в `deploy/observability/config/prometheus.yml` (или локальный override):

```yaml
  - job_name: fastapi-course
    static_configs:
      - targets: ["host.docker.internal:8090"]
    metrics_path: /metrics
```

На Linux без `host.docker.internal` — IP хоста (`ip route`) или объедините compose-сети.

```bash
curl -X POST http://localhost:9090/-/reload
# Targets → fastapi-course UP
```

**Проверка:** Prometheus → Status → Targets → **UP**.

---

## Задание 2. Instrumentator на стенде

В `deploy/fastapi/stack/api/requirements.txt`:

```text
prometheus-fastapi-instrumentator>=7.0
```

В `main.py` (сохраните существующий `/metrics` или замените):

```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator(
    should_group_status_codes=True,
    excluded_handlers=["/metrics", "/health"],
).instrument(app).expose(app)
```

```bash
cd deploy/fastapi
docker compose up -d --build
curl -s http://localhost:8090/metrics | grep http_request
```

---

## Задание 3. RED в Prometheus

Выполните в UI Prometheus (http://localhost:9090):

**Rate:**

```promql
sum(rate(http_requests_total{job="fastapi-course"}[5m]))
```

**Errors (5xx):**

```promql
sum(rate(http_requests_total{job="fastapi-course",status=~"5.."}[5m]))
/
sum(rate(http_requests_total{job="fastapi-course"}[5m]))
```

**p95 latency:**

```promql
histogram_quantile(
  0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket{job="fastapi-course"}[5m]))
)
```

Сгенерируйте трафик:

```bash
for i in $(seq 1 100); do
  curl -s -o /dev/null http://localhost:8090/api/v1/items
  curl -s -o /dev/null http://localhost:8090/api/v1/items/999
done
```

---

## Задание 4. Grafana dashboard

1. Grafana → Dashboards → New.
2. Панели: RPS, error rate %, p95 latency.
3. Variable `job` = `fastapi-course`.

Сохраните JSON локально или скриншот для отчёта. Сверьтесь с demo-app дашбордами observability-basic.

---

## Задание 5. Кастомные метрики кэша

Если реализован [29-lab-redis](29-lab-redis.md), добавьте:

```python
CACHE_HITS = Counter("cache_hits_total", "Cache hits", ["endpoint"])
CACHE_MISSES = Counter("cache_misses_total", "Cache misses", ["endpoint"])
```

Панель hit ratio:

```promql
sum(rate(cache_hits_total[5m]))
/
(sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))
```

---

## Задание 6. Structured logging

```bash
pip install structlog  # в requirements
```

JSON-лог на каждый request (middleware из [36-observability](36-observability.md)). Проверка:

```bash
docker compose logs api | tail -5
```

Должны быть поля `request_id`, `status`, `path`.

---

## Задание 7. Loki overlay (опционально)

```bash
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.logs.yml up -d
```

Grafana → Explore → Loki → `{container="mock-fastapi-api"}` (label зависит от promtail config).

См. [observability-intermediate/06-lab-promtail](../observability-intermediate/06-lab-promtail.md).

---

## Задание 8. Алерт (tabletop)

Опишите в 5 строках rule `FastAPIHighLatency` при p95 > 500ms 10 минут. Куда уйдёт notification в стенде? (Alertmanager :9093)

---

## Критерии сдачи

| Критерий | Обязательно |
|----------|-------------|
| Target fastapi UP | да |
| 3 PromQL RED работают | да |
| Grafana 3 панели | да |
| Трафик + ненулевой RPS | да |
| structlog или обоснование отказа | да |

---

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| Target DOWN | firewall, `host.docker.internal`, порт 8090 |
| No data | имена метрик — `http_requests_total` vs `fastapi_http_*` |
| p95 NaN | мало данных — больше curl, подождите 5m window |

---

## Связь с CI

Pipeline публикует метрики после deploy — pattern [gitlab-basic/08-artifacts-cache](../gitlab-basic/08-artifacts-cache.md). В K8s: ServiceMonitor ([kuber-advanced/14-observability](../kuber-advanced/14-observability.md)).

---

## Резюме

Лаба замыкает путь **код → /metrics → Prometheus → Grafana**. RED-запросы — ежедневный инструмент on-call. Дальше — распределённые трейсы [38-opentelemetry](38-opentelemetry.md).

## Чек-лист

- Как reload Prometheus config?
- Почему 404 увеличивает Errors в RED?
- Где смотреть логи контейнера API?
- Что добавить в on-call runbook?

Следующий урок: [38-opentelemetry](38-opentelemetry.md).
