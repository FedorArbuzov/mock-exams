# 08. Агрегации: terms, date_histogram, metrics

## Введение: «не выгружать миллион строк в Excel»

Support спрашивает: **сколько ошибок по каждому service за последние 24 часа?** Скачивать все hits — бессмысленно. **Aggregations** считают на кластере: `terms` по `service`, вложенный `filter` по `level:error`, **date_histogram** по часам. Dashboards строит столбчатые графики из тех же aggs. Эта глава — аналитика по логам без отдельного ClickHouse (хотя для чистых OLAP отчётов ClickHouse тоже уместен).

## Что вы узнаете

- Запрос с **`"size": 0`** — только агрегации, без hits.
- **Bucket** vs **metric** aggregations.
- **terms**, **date_histogram**, **filter**, **value_count**, **avg**.
- Ограничения **keyword** и **doc_values** для aggs.

## size: 0

```json
GET /lab-search/_search
{
  "size": 0,
  "aggs": {
    "by_level": {
      "terms": { "field": "level.keyword", "size": 10 }
    }
  }
}
```

Ответ: `aggregations.by_level.buckets[]` с `key`, `doc_count`. Секция `hits` пустая или без documents.

## Bucket aggregations

| Agg | Назначение | Поле |
|-----|------------|------|
| **terms** | топ-N значений | keyword |
| **date_histogram** | интервалы времени | date (`@timestamp`) |
| **range** | диапазоны status | numeric |
| **filter** | одна «корзина» | любой query |

**date_histogram**:

```json
"logs_per_hour": {
  "date_histogram": {
    "field": "@timestamp",
    "fixed_interval": "1h",
    "min_doc_count": 0
  }
}
```

`calendar_interval: "1d"` — календарные сутки (часовые пояса — осторожно).

## Metric aggregations

Внутри bucket — вложенные aggs:

```json
"by_service": {
  "terms": { "field": "service", "size": 20 },
  "aggs": {
    "avg_status": { "avg": { "field": "status" } },
    "error_lines": {
      "filter": { "term": { "level.keyword": "error" } }
    }
  }
}
```

| Metric | Результат |
|--------|-----------|
| **count** | число документов (в bucket) |
| **avg** / **sum** / **min** / **max** | по числовому полю |
| **cardinality** | уникальные значения (приближённо) |
| **percentiles** | p95 latency если поле есть |

## Порядок выполнения

1. Query отфильтровывает документы.
2. Aggregations считаются **только** на отфильтрованном множестве.

```json
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "range": { "@timestamp": { "gte": "now-24h" } } }
      ]
    }
  },
  "aggs": { ... }
}
```

## Точность terms

`terms` по умолчанию **approximate** top terms (алгоритм TDigest / breadth-first). Параметр `"size"` — сколько bucket вернуть; `"shard_size"` — точность на шардах (multi-node).

На single-node лабе — достаточно `"size": 10`.

## Aggregations vs Loki metric queries

| | OpenSearch aggs | Loki `sum(rate(...))` |
|---|-----------------|------------------------|
| Источник | индекс логов | log streams |
| Сильная сторона | сложные bucket + sub-aggs | дешёвые метрики из логов в Grafana |
| Поля | mapping keyword/number | labels + JSON parse |

Корреляция: алерт Prometheus → OpenSearch agg «топ route с 5xx» → LogQL/Loki для строки (intermediate).

## На стенде

Примеры в [`examples/search-queries.json`](examples/search-queries.json) — ключи `agg_terms_by_level`, `agg_date_histogram_hourly`, `agg_terms_with_sub_metric`.

Практика — [09. Лаба: агрегации](09-lab-aggregations.md).

## Типичные ошибки

| Ошибка | Симптом | Исправление |
|--------|---------|-------------|
| terms на `text` | ошибка или warning | `.keyword` |
| Забыли `size: 0` | лишние hits, медленно | `size: 0` |
| date_histogram без date | exception | mapping `date` |
| Слишком мелкий interval | тысячи buckets | `1h` вместо `1s` на неделе |
| cardinality на user_id | память | sampling, отдельный трек |

## В продакшене

- **Transform** / **rollup** (intermediate) — предагрегация старых логов.
- Лимит **`search.max_buckets`** (65535 default) — не строить 10k terms без нужды.
- Dashboards **Lens** / **Visualize** генерируют тот же JSON aggs.
- Для SLA «error rate %» иногда проще **metrics** в Prometheus, aggs — для разрезов.

## Заметки для собеседования

- **Bucket** содержит документы; **metric** — число на bucket.
- **Sub-aggregation** — дерево аналитики.
- **Filter aggregation** — счётчик документов, прошедших sub-query.
- Aggs не заменяют **TSDB** для sub-second alerting.

## Резюме

Aggregations — способ **считать по логам на сервере**: распределение по `level`/`service`, динамика по `@timestamp`, вложенные метрики. В паре с bool filter это основа operational дашбордов. Следующая лаба — три типа aggs на `lab-search` или данных из bulk.

## Чек-лист

- Зачем `"size": 0` в agg-запросе?
- Какое поле для `terms` по `level`?
- Чем `date_histogram` отличается от `range`?
- Где взять готовые JSON-примеры?

Следующий урок: [09. Лаба: агрегации](09-lab-aggregations.md).
