# 01. Recording rules: предвычисленные метрики

## Зачем это нужно

В production дашборды и алерты часто опираются на одни и те же тяжёлые выражения PromQL:

```promql
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))
```

Каждый раз при открытии Grafana Prometheus заново считает агрегаты по всем series. При тысячах `pod` × `status` × `path` запрос становится дорогим, а при всплеске кардинальности — ещё и нестабильным.

**Recording rules** — правила в Prometheus, которые **периодически** записывают результат выражения как **новую time series** с фиксированным именем. Дашборд читает уже готовую метрику `job:error_ratio:rate5m` — быстрее и предсказуемее.

## Как это работает

1. В `rule_files` подключаются YAML-файлы с группами правил (на стенде: `deploy/observability/config/rules/*.yml`).
2. Каждая группа имеет `interval` (по умолчанию = `global.evaluation_interval`, у нас **15s**).
3. Правило типа `record` вычисляет `expr` и сохраняет series с именем из поля `record`.
4. Правило типа `alert` — то же вычисление, но при срабатывании условия шлёт в Alertmanager (это вы уже видели в basic на `demo-alerts.yml`).

```yaml
groups:
  - name: api_rates
    interval: 30s
    rules:
      - record: job:demo_http_requests:rate5m
        expr: sum(rate(demo_http_requests_total[5m])) by (job)
```

После применения в Prometheus → **Status → Rules** появится группа `api_rates`, а в Graph — новая метрика.

## Именование (конвенция)

Рекомендуемый шаблон имени (не жёсткий стандарт, но привычный в сообществе):

```text
level:metric:operations
```

Примеры:

| Имя | Смысл |
|-----|--------|
| `instance:node_cpu:rate5m` | rate по instance |
| `slo:api_availability:ratio5m` | SLI availability за 5m |
| `job:demo_errors:ratio5m` | доля ошибок по job |

Префикс `slo:` в нашем курсе используется для метрик, связанных с error budget (см. [07-slo-sli-sla.md](07-slo-sli-sla.md) и [examples/slo-recording-rules.yml](examples/slo-recording-rules.yml)).

## Recording vs alerting rules

| | Recording | Alerting |
|---|-----------|----------|
| Поле | `record:` | `alert:` |
| Результат | Новая метрика в TSDB | Событие в Alertmanager |
| `for:` | Нет | Да (антидребезг) |
| Типичное использование | Дашборды, промежуточные SLI | Пейджинг, тикеты |

Цепочка: **сырые метрики → recording (SLI) → alerting (SLO нарушен)**. Алерт на сырой `rate()` по 10 000 series — плохая идея; алерт на `slo:demo_availability:ratio5m < 0.995` — осмысленная.

## Практика на стенде

Базовый compose уже монтирует каталог правил:

```text
deploy/observability/config/rules/demo-alerts.yml   # alerting
```

Для recording вы добавите, например, `recording-demo.yml` (в лабе [02-lab-recording.md](02-lab-recording.md)).

Демо-приложение экспортирует:

- `demo_http_requests_total{method, path, status}`
- `demo_http_request_duration_seconds_bucket` (histogram)

Удобные recording для дашборда «RPS и ошибки»:

```yaml
- record: demo:http_requests:rate5m
  expr: sum(rate(demo_http_requests_total[5m])) by (status)

- record: demo:http_errors:rate5m
  expr: sum(rate(demo_http_requests_total{status=~"5.."}[5m]))
```

## Reload конфигурации

В `docker-compose.yml` для Prometheus включён `--web.enable-lifecycle`. После правки rules:

```bash
curl -X POST http://localhost:9090/-/reload
```

Или перезапуск контейнера. Проверка: **Prometheus → Status → Rules** — группа **green**, **Last evaluation** свежая.

## Типичные ошибки

| Ошибка | Симптом | Решение |
|--------|---------|---------|
| Деление на ноль | `NaN` в recording | `or vector(0)`, `> 0` в знаменателе, `clamp_min` |
| Слишком короткое окно `[1m]` при `scrape_interval: 15s` | Шум, пропуски | Минимум `[2m]`, лучше `[5m]` для rate |
| Высокая кардинальность в `by (...)` | Взрыв series | Агрегировать только нужные labels |
| Дублирующиеся имена `record` | Конфликт правил | Уникальные имена в пределах кластера |

## Связь с другими главами

- **Гистограммы:** recording для `histogram_quantile` — в [11-histograms-quantiles.md](11-histograms-quantiles.md).
- **SLO:** цепочка recording для availability — [07-slo-sli-sla.md](07-slo-sli-sla.md).
- **Kafka:** lag и broker-метрики тоже выгодно предвычислять — [kafka-intermediate/17-monitoring.md](../kafka-intermediate/17-monitoring.md).

## Чек-лист

- [ ] Объяснили, чем `record` отличается от `alert`.
- [ ] Знаете, где в UI Prometheus смотреть состояние rules.
- [ ] Понимаете, зачем выносить `rate()` и доли ошибок в отдельные имена.

**Дальше:** [02. Лаба: recording rules](02-lab-recording.md).
