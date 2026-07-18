# 05. Cardinality, cost и «метрики съели бюджет»

## Введение: один релиз — счёт ×10

Команда добавила label `user_id` в HTTP counter «для дебага». Через неделю Prometheus **не стартует**, cardinality explosion, disk full. На собеседовании senior должен объяснить **почему** и как проектировать метрики.

## Cardinality в Prometheus

**Cardinality** — число уникальных **time series** = уникальных комбинаций metric name + labels.

```text
http_requests_total{method="GET", path="/api", status="200"}
```

Добавили `user_id` с 1M пользователей → до **1M series** на одну метрику.

| Безопасные labels | Опасные labels |
|-------------------|----------------|
| `service`, `method`, `status` class | `user_id`, `order_id`, `trace_id` |
| `le` в histogram (фикс. buckets) | `url` полный path с id |
| `namespace`, `pod` (ограничено HPA) | unbounded `error_message` |

## Оценка «на салфетке»

```text
series ≈ (#metrics) × ∏ (#values per label)
```

Пример: 50 endpoints × 5 methods × 10 status = 2500 series — OK.  
× 100 000 user_id — **не OK**.

PromQL для поиска «тяжёлых» метрик (Prometheus 2.x):

```promql
topk(10, count by (__name__)({__name__=~".+"}))
```

Или через `prometheus_tsdb_symbol_table_size` / tooling `promtool tsdb analyze` на snapshot.

## Histogram vs Summary

| Тип | Cardinality | Заметка |
|-----|-------------|---------|
| **Histogram** `_bucket`, `_sum`, `_count` | buckets × labels | Стандарт, агрегируемый `histogram_quantile` |
| **Summary** quantiles | quantiles × labels | Не агрегируется между репликами |

Предпочитайте **histogram** с фиксированными buckets.

## Cost: self-hosted vs managed

| Фактор | Prometheus VM | Amazon AMP / Grafana Cloud | CloudWatch |
|--------|-----------------|----------------------------|------------|
| Billing driver | Disk, RAM, CPU | Ingested samples | Custom metrics, API calls |
| Cardinality | Ваш риск | Лимиты + overage | Per-metric-name + dimensions |
| Retention | `retention=` | tiered | по умолчанию 15 мес metrics |

CloudWatch: **metric filter** из логов дешевле, чем писать каждый event как custom metric без агрегации — см. [aws-intermediate/19](../aws-intermediate/19-cloudwatch.md).

## Traces и logs cardinality

- **Traces:** high-cardinality в **attributes** (SQL text, email) — дорого в Jaeger/Tempo.
- **Logs:** structured JSON OK; **unique message per request** — Loki index blow-up.

Правило: **high cardinality → logs/traces с sampling**, не labels.

## Redis exporter caveat

`redis_exporter` с `check-keys` на миллионы ключей — катастрофа. Для Redis используйте агрегаты из [`INFO`](../redis-intermediate/15-monitoring.md), не per-key series в Prometheus.

## Governance

| Практика | Эффект |
|----------|--------|
| Naming convention (`<service>_<unit>_<total>`) | Reviewable |
| `metric_relabel_configs` drop | Защита на ingest |
| Recording rules | Сжатие для dashboards |
| PR checklist: «новые labels?» | Ловит `user_id` |

## На собеседовании

1. **Почему нельзя `trace_id` в labels?** Unbounded series; trace_id belongs in logs/exemplars.
2. **Как алертить без labels user?** Aggregate `status`, `route` template `/users/:id`.
3. **RED vs USE?** RED для services; USE для resources ([07](07-troubleshooting-runbooks.md)).

## Резюме

- Labels — **контракт** с TSDB; каждый новый label — потенциальный взрыв.
- Histogram + bounded labels; PII/high-card → attributes/logs, не metrics.
- CloudWatch и managed Prometheus биллят **ingest** — cardinality = деньги.

Следующий урок: [06-lab-cardinality.md](06-lab-cardinality.md).
