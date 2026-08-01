# 04. Mapping and analyzers: text vs keyword

## Intro: “why the level filter doesn’t work”

An engineer indexes log `{"level": "ERROR"}` and searches with a `term` query `level: ERROR` — **0 hits**. Field `level` turned out to be **`text`**: the analyzer lowercased it to `error`, tokenized it, and exact match failed. Nearby, field `service` was made **`keyword`** — filter `service: api` works. This chapter is **mapping** (field schema) and **analyzers** for logs on OpenSearch.

## What you'll learn

- **Dynamic mapping** vs explicit mapping at index creation.
- Types **`text`**, **`keyword`**, **`date`**, **`long`**, **`boolean`** for logs.
- Chain **character filter → tokenizer → token filter**.
- Subfields **`fields.keyword`** and the `.keyword` suffix in Query DSL.

## Mapping — index schema

**Mapping** defines how JSON fields are indexed and searched.

| Mode | Behavior |
|-------|-----------|
| Dynamic (default) | new fields are guessed on the first document |
| Explicit | you set types before ingest — **recommended for logs** |

Example explicit mapping for logs:

```json
PUT /logs-template-demo
{
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "level": {
        "type": "text",
        "fields": {
          "keyword": { "type": "keyword", "ignore_above": 256 }
        }
      },
      "service": { "type": "keyword" },
      "message": { "type": "text" },
      "status": { "type": "integer" },
      "bytes": { "type": "long" }
    }
  }
}
```

## text vs keyword

| Type | Indexing | Queries | Example field |
|-----|------------|---------|---------------|
| **text** | analyzer, inverted index by tokens | `match`, `match_phrase` | `message` |
| **keyword** | whole value as one | `term`, `terms`, aggregations | `service`, `level.keyword` |

**text** — full text: “payment failed” is found by `match: payment`.  
**keyword** — exact match: `term: api` for `service`.

For dual-role fields (`level`) use **multi-fields**: main `text` + `keyword` subfield.

## Analyzers

**Analyzer** applies to `text` fields at index time and (often) at search time.

The standard **standard** analyzer for English: lowercasing, split on whitespace.

```bash
curl -s -X POST "http://localhost:9200/_analyze" \
  -H 'Content-Type: application/json' -d '{
  "analyzer": "standard",
  "text": "GET /orders 500 ERROR"
}'
```

**What you'll see:** tokens `get`, `orders`, `500`, `error`.

| Analyzer | When |
|----------|-------|
| `standard` | general text, log messages |
| `keyword` | no splitting (like keyword type) |
| `whitespace` | minimal normalization |
| custom | nginx/apache grok pipelines (intermediate) |

**Search analyzer** can differ from **index analyzer** (e.g. synonyms only at search).

## Dates and numbers

- **`@timestamp`**: type `date`; accepts ISO-8601. Needed for **date_histogram** and sorting in Dashboards.
- **`status`**, **`bytes`**: numeric types — **range** filters, metrics in aggregations.
- Do not index as `text` what you need **range** on (`status: 500`).

## Dynamic mapping — risks

First document with `"status": "500"` (string) locks **text**. Next with `"status": 500` (number) — **mapping conflict**. For logs:

1. Create the index with mapping **before** bulk.
2. Or use an **index template** for `logs-*` (intermediate).

## _source and stored fields

By default the full **`_source`** is stored — what comes back in a hit. You can disable `_source` to save space (rare in training labs). **doc_values** for keyword/date — basis of sorts and aggregations.

## On the stand: analyze API

```bash
curl -s -X POST "http://localhost:9200/_analyze" \
  -H 'Content-Type: application/json' -d '{
  "tokenizer": "keyword",
  "text": "ERROR"
}'
```

Compare with `standard` on the same text — different token counts.

Practice — [05. Lab mapping](05-lab-mapping.md).

## Common mistakes

| Mistake | Symptom | Fix |
|--------|---------|-------------|
| `term` on a `text` field | 0 hits | `level.keyword` or keyword mapping |
| `match` on `keyword` | wrong behavior | `term` for exact |
| Huge `message` as keyword | reject / huge index | `text` only |
| Mixed types in one field | ingest error | reindex, explicit mapping |
| Ignoring `@timestamp` | no time picker | `type: date` |

## In production

- **Index templates** + **Composable templates** for consistent `logs-*`.
- **ECS** (Elastic Common Schema) — consistent field names.
- **Normalizers** for keyword (lowercase without tokenization).
- **`ignore_above`** on keyword — guard against giant strings.
- Do not log secrets; mapping will not fix a PII leak.

## Interview notes

- **Inverted index** is built after the analyzer for text.
- **keyword** is not analyzed (or uses a normalizer).
- **`.keyword`** is often a subfield, not a separate field in the document JSON.
- **Mapping update** is limited; changing type = new index + reindex.

## Summary

Mapping ties a log’s JSON to **how** a field is searched: **text** for `message`, **keyword** for filters and aggregations, **date** for time. Analyzers explain why `term` and `match` are not interchangeable. The next lab drills `_analyze` and explicit mapping.

## Checklist

- When to use `text`, when `keyword`?
- Why the `fields.keyword` subfield?
- How does `term` differ from `match`?
- What type is `@timestamp` in a typical log mapping?

Next lesson: [05. Lab: mapping](05-lab-mapping.md).
