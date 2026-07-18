# 06. Лаба: cardinality на demo-app

## Цель

Увидеть рост **time series** от плохих labels, сравнить с безопасной схемой, выполнить PromQL «top metrics» на [`deploy/observability`](../../deploy/observability/README.md).

## Предварительно

- [05-cardinality-cost](05-cardinality-cost.md)
- Базовый стек: `docker compose up -d --build`

---

## Задание 1. Baseline

```bash
cd deploy/observability
bash scripts/traffic.sh
```

Prometheus → **Status → TSDB Status** (или query):

```promql
prometheus_tsdb_head_series
```

Запишите число **A**.

---

## Задание 2. Tabletop — плохой дизайн

Сервис `checkout` пишет:

```text
checkout_clicks_total{user_id="...", sku="...", campaign="..."}
```

| Параметр | Значение |
|----------|----------|
| DAU | 500 000 |
| SKU active | 20 000 |
| campaigns | 50 |

**Вопрос:** порядок величины series? Предложите **безопасную** альтернативу.

<details>
<summary>Подсказка</summary>

500k × 20k × 50 — миллиарды — нереально. Альтернатива: `checkout_clicks_total{campaign="..."}` без user_id; per-user analytics → event log / warehouse.
</details>

---

## Задание 3. demo-app labels (наблюдение)

Откройте [`deploy/observability/demo/app.py`](../../deploy/observability/demo/app.py):

```python
REQUESTS = Counter("demo_http_requests_total", "...", ["method", "path", "status"])
```

Сгенерируйте 404:

```bash
for i in $(seq 1 50); do curl -sf "http://localhost:8000/missing" >/dev/null 2>&1 || true; done
```

PromQL:

```promql
count(demo_http_requests_total)
```

Сколько уникальных series? Почему `path` здесь ещё терпим?

---

## Задание 4. «Плохой» path label (мысленный эксперимент)

Если бы `path` включал `/users/12345` для каждого id — что произошло бы с `prometheus_tsdb_head_series`?

Напишите **metric_relabel_configs** drop для label `path` (черновик):

```yaml
metric_relabel_configs:
  - source_labels: [path]
    regex: '/users/.*'
    target_label: path
    replacement: '/users/:id'
```

---

## Задание 5. CloudWatch tabletop

Из [aws-intermediate/19](../aws-intermediate/19-cloudwatch.md):

1. Чем **metric filter** на ERROR в логах отличается от custom metric на каждый log line?
2. Когда выберете **SQS ApproximateNumberOfMessagesVisible** вместо filter?

Запишите по 2 предложения.

---

## Задание 6. Redis

Почему `redis_key_size{key="..."}` — антипаттерн? Куда смотреть вместо per-key metrics? ([redis-intermediate/15](../redis-intermediate/15-monitoring.md))

---

## Критерии успеха

- [ ] Зафиксирован baseline `prometheus_tsdb_head_series` (A)
- [ ] Tabletop: оценка cardinality + исправление
- [ ] `count(demo_http_requests_total)` объяснён
- [ ] Ответы по CloudWatch и Redis

Следующий урок: [07-troubleshooting-runbooks.md](07-troubleshooting-runbooks.md).
