# 12. Лаба: p95 latency demo-app

## Цель

Построить **p50/p95/p99** из histogram demo-app, сравнить со **средним**, добавить recording rule для p95.

## Подготовка

```bash
cd deploy/observability
docker compose up -d --build
bash scripts/traffic.sh
```

Метрики: http://localhost:8000/metrics — найдите `demo_http_request_duration_seconds_bucket`.

## Задание 1. Квантили в Prometheus

В **Graph**:

```promql
histogram_quantile(0.50,
  sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le)
)

histogram_quantile(0.95,
  sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le)
)

histogram_quantile(0.99,
  sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le)
)
```

Запишите приблизительные значения после traffic (секунды).

## Задание 2. Среднее vs p95

```promql
sum(rate(demo_http_request_duration_seconds_sum[5m]))
/
sum(rate(demo_http_request_duration_seconds_count[5m]))
```

На одном графике с p95. Какой ряд выше? Почему на синтетическом random uniform разница небольшая?

## Задание 3. Breakdown по path

```promql
histogram_quantile(0.95,
  sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le, path)
)
```

Сколько series по `path`? Согласуется с кодом (`/` и `/health`).

## Задание 4. Recording rule

Файл `config/rules/recording-latency.yml`:

```yaml
groups:
  - name: recording_latency
    interval: 30s
    rules:
      - record: demo:http_latency:p95_5m
        expr: |
          histogram_quantile(0.95,
            sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le)
          )
```

Reload. Используйте `demo:http_latency:p95_5m` в Grafana Stat с порогом **0.25s** (красный выше).

## Задание 5. Heatmap (Grafana)

Dashboard → panel **Heatmap**:

- Query: `sum(increase(demo_http_request_duration_seconds_bucket[1m])) by (le)`
- Format: heatmap, legend по `le`.

Опишите: какие bucket'ы получают больше всего наблюдений?

## Ожидаемый результат

| Проверка | Критерий |
|----------|----------|
| p50/p95/p99 | Графики строятся |
| avg vs p95 | Сравнение в заметках |
| Recording | `demo:http_latency:p95_5m` exists |
| Heatmap | Видно распределение по `le` |

## Чек-лист

- [ ] Три квантиля посчитаны
- [ ] Recording latency применён
- [ ] Heatmap сохранён

**Дальше:** [13. OTel metrics](13-otel-metrics.md) *(опционально)*.
