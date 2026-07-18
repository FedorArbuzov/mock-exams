# 11. Гистограммы и квантили в Prometheus

## Типы метрик (кратко)

| Тип | Пример | Для квантилей |
|-----|--------|----------------|
| Counter | `requests_total` | Нет |
| Gauge | `queue_depth` | Нет (только avg/max в instant) |
| Histogram | `latency_seconds_bucket` | **Да** |
| Summary | `latency_seconds` с `quantile` | Да (client-side) |

На demo-app:

```text
demo_http_request_duration_seconds_bucket{path, le}
demo_http_request_duration_seconds_sum
demo_http_request_duration_seconds_count
```

Buckets заданы в коде: `0.005 … 1.0` секунд (`deploy/observability/demo/app.py`).

## Как устроен histogram

Каждое наблюдение `observe(0.12)` увеличивает счётчики во **всех** bucket'ах, где `le >= 0.12`.

```text
le="0.1"   → не увеличится
le="0.25"  → +1
le="0.5"   → +1
le="+Inf"  → +1
```

`_sum` — сумма значений, `_count` — число наблюдений.

## histogram_quantile

Оценка квантиля **по агрегированным** bucket'ам (не точная per-request статистика):

```promql
histogram_quantile(
  0.95,
  sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le)
)
```

| Ошибка | Последствие |
|--------|-------------|
| Забыли `by (le)` | Неверный квантиль |
| `rate` по `_bucket` без sum | Разорванные ряды |
| Слишком грубые buckets | Плохая точность p99 |

## Recording для latency SLO

```yaml
- record: demo:http_latency:p95_5m
  expr: |
    histogram_quantile(0.95,
      sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le)
    )
```

SLO: «95% запросов быстрее 200ms» → алерт `demo:http_latency:p95_5m > 0.2`.

## Histogram vs Summary

| | Histogram | Summary |
|---|-----------|---------|
| Квантиль | На стороне Prometheus | На стороне клиента |
| Агрегация по pod | Да (если одинаковые buckets) | **Нет** (нельзя avg quantiles) |
| Рекомендация | HTTP latency, размеры | Редко в новых системах |

## Кардинальность

`histogram` с labels `user_id` × `path` × `status` — взрыв series. Для SLI latency достаточно `le` + один label `service` или `handler`.

## avg vs p95

```promql
rate(demo_http_request_duration_seconds_sum[5m])
/
rate(demo_http_request_duration_seconds_count[5m])
```

Среднее **чувствительно** к выбросам иначе, чем p95: при редких таймаутах avg может выглядеть «нормально», p95 — нет.

## Grafana

Heatmap panel по `increase(bucket[1m])` — визуализация распределения. Stat panel — `histogram_quantile(0.99, ...)`.

## Kafka latency

Producer `request-latency-max` и consumer commit latency — часто histogram или gauge в JMX; для SLO потока — p95 обработки сообщения ([17-monitoring](../kafka-intermediate/17-monitoring.md)).

## Чек-лист

- [ ] Объяснили роль label `le`.
- [ ] Пишете `histogram_quantile` с `sum(...) by (le)`.
- [ ] Знаете, почему Summary плохо агрегируется.

**Дальше:** [12. Лаба: histogram](12-lab-histogram.md).
