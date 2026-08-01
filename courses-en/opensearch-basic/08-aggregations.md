# 08. Aggregations: terms, date_histogram, metrics

## Intro: “don’t dump a million rows into Excel”

Support asks: **how many errors per service in the last 24 hours?** Downloading all hits is pointless. **Aggregations** compute on the cluster: `terms` on `service`, nested `filter` on `level:error`, **date_histogram** by hour. Dashboards builds bar charts from the same aggs. This chapter is analytics over logs without a separate ClickHouse (though for pure OLAP reports ClickHouse is also fine).

## What you'll learn

- Query with **`"size": 0`** — aggregations only, no hits.
- **Bucket** vs **metric** aggregations.
- **terms**, **date_histogram**, **filter**, **value_count**, **avg**.
- Limits of **keyword** and **doc_values** for aggs.

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

Response: `aggregations.by_level.buckets[]` with `key`, `doc_count`. The `hits` section is empty or without documents.

## Bucket aggregations

| Agg | Purpose | Field |
|-----|------------|------|
| **terms** | top-N values | keyword |
| **date_histogram** | time intervals | date (`@timestamp`) |
| **range** | status ranges | numeric |
| **filter** | one “bucket” | any query |

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

`calendar_interval: "1d"` — calendar days (time zones — be careful).

## Metric aggregations

Inside a bucket — nested aggs:

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

| Metric | Result |
|--------|-----------|
| **count** | number of documents (in bucket) |
| **avg** / **sum** / **min** / **max** | on a numeric field |
| **cardinality** | unique values (approximate) |
| **percentiles** | p95 latency if the field exists |

## Execution order

1. Query filters documents.
2. Aggregations run **only** on the filtered set.

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

## terms accuracy

`terms` by default is **approximate** top terms (TDigest / breadth-first algorithm). Parameter `"size"` — how many buckets to return; `"shard_size"` — accuracy per shard (multi-node).

On a single-node lab — `"size": 10` is enough.

## Aggregations vs Loki metric queries

| | OpenSearch aggs | Loki `sum(rate(...))` |
|---|-----------------|------------------------|
| Source | log index | log streams |
| Strength | complex buckets + sub-aggs | cheap metrics from logs in Grafana |
| Fields | mapping keyword/number | labels + JSON parse |

Correlation: Prometheus alert → OpenSearch agg “top route with 5xx” → LogQL/Loki for the line (intermediate).

## On the stand

Examples in [`examples/search-queries.json`](examples/search-queries.json) — keys `agg_terms_by_level`, `agg_date_histogram_hourly`, `agg_terms_with_sub_metric`.

Practice — [09. Lab: aggregations](09-lab-aggregations.md).

## Common mistakes

| Mistake | Symptom | Fix |
|--------|---------|-------------|
| terms on `text` | error or warning | `.keyword` |
| Forgot `size: 0` | extra hits, slow | `size: 0` |
| date_histogram without date | exception | mapping `date` |
| Interval too fine | thousands of buckets | `1h` instead of `1s` over a week |
| cardinality on user_id | memory | sampling, separate track |

## In production

- **Transform** / **rollup** (intermediate) — pre-aggregate old logs.
- **`search.max_buckets`** limit (65535 default) — don’t build 10k terms without need.
- Dashboards **Lens** / **Visualize** generate the same JSON aggs.
- For SLA “error rate %” **metrics** in Prometheus are sometimes easier; aggs — for slices.

## Interview notes

- **Bucket** holds documents; **metric** — a number on a bucket.
- **Sub-aggregation** — analytics tree.
- **Filter aggregation** — count of documents that pass a sub-query.
- Aggs do not replace a **TSDB** for sub-second alerting.

## Summary

Aggregations are a way to **compute over logs on the server**: distribution by `level`/`service`, trends by `@timestamp`, nested metrics. Paired with bool filter, this is the basis of operational dashboards. Next lab — three agg types on `lab-search` or bulk data.

## Checklist

- Why `"size": 0` in an agg query?
- Which field for `terms` on `level`?
- How does `date_histogram` differ from `range`?
- Where to get ready JSON examples?

Next lesson: [09. Lab: aggregations](09-lab-aggregations.md).
