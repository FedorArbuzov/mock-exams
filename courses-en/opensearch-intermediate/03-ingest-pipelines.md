# 03. Ingest pipelines: Grok and Set

## Where the transformation lives

A document can be enriched **in the application**, **in an agent** (Fluent Bit, Filebeat), **in a Kafka Connect SMT**, or **in an OpenSearch ingest pipeline**. The pipeline runs on the **coordinator** during `index`, `bulk`, `update` — before the write to Lucene.

```mermaid
flowchart LR
  APP[Producer / bulk] --> ING[Ingest node]
  ING --> IDX[Index shard]
```

On the single-node stack [`deploy/opensearch`](../../deploy/opensearch/README.md) one node combines roles; in a cluster you dedicate ingest nodes under heavy Grok load.

## Pipeline structure

```json
{
  "description": "...",
  "processors": [ ... ],
  "on_failure": [ ... ]
}
```

| Element | Purpose |
|---------|------------|
| `processors` | An ordered chain of steps |
| `on_failure` | What to do when a step fails (tag, set, drop) |
| `description` | Documentation for operators |

Registration: `PUT _ingest/pipeline/<name>`. Application: `?pipeline=<name>` on bulk/index or a **default pipeline** in the index template.

## Processor: Grok

**Grok** parses **a single text field** using logstash-style patterns (based on regular expressions with named groups).

The reference on the stack — [`deploy/opensearch/examples/ingest-pipeline-nginx.json`](../../deploy/opensearch/examples/ingest-pipeline-nginx.json):

```json
{
  "grok": {
    "field": "message",
    "patterns": ["%{WORD:method} %{URIPATHPARAM:path} %{NUMBER:status:int}"]
  }
}
```

The string `GET /health 200` in the `message` field produces the fields `method`, `path`, `status` (with type coercion `:int`).

Built-in patterns (`WORD`, `URIPATHPARAM`, `NUMBER`, …) cover typical logs; for your own format you add **custom patterns** to the cluster state (rare at the first stage — it is simpler to normalize the log to JSON in the application).

**Grok limitations:**

- CPU-heavy at high QPS; heavy regex is a bottleneck.
- A single wrong pattern is a failed processor; you need `on_failure` or a fallback pipeline.
- The order of multiple `patterns` in the array is "first match wins".

## Processor: Set

**Set** writes a value into a field (a constant, from another field, from metadata):

```json
{
  "set": {
    "field": "parsed",
    "value": true
  }
}
```

In the nginx-pipeline example, the `parsed: true` flag is handy in Discover: "how many lines the pipeline parsed". Other options:

- `override: false` — do not overwrite an existing value;
- `copy_from` — copy from another field;
- `if` — a condition (Painless in ingest; see the OpenSearch documentation for syntax).

## Neighboring processors (overview)

| Processor | When |
|-----------|--------|
| `json` | `message` is already a JSON string |
| `date` | Parse a timestamp from text |
| `remove` / `rename` | Remove noise, PII |
| `lowercase` | Normalize a keyword |
| `fail` | Deliberately reject a document (quarantine) |

For application JSON logs, `json` + `date` is often enough, without Grok — see the comparison with the Promtail pipeline in [observability-intermediate/05-promtail-pipelines](../observability-intermediate/05-promtail-pipelines.md).

## Pipeline from Kafka

A typical scheme from [kafka-basic/12-patterns](../kafka-basic/12-patterns.md):

```text
services → topic logs.raw → consumer group "indexer" → bulk → OpenSearch
```

A **Kafka Connect** OpenSearch sink can specify an ingest pipeline in the connector config; transformations before Kafka are **SMTs** ([kafka-intermediate/15-kafka-connect](../kafka-intermediate/15-kafka-connect.md)). Duplicating Grok in both Connect and OpenSearch is an anti-pattern: choose **one** place for normalization.

## Checking the ingest result

In Dev Tools or `curl`:

- `GET /_ingest/pipeline/nginx-parse` — the definition;
- `POST /_ingest/pipeline/nginx-parse/_simulate` — a dry run without writing;
- in the document after index — the `_ingest` field with a `timestamp` and a list of processors (unless disabled).

## Errors and debugging

| Symptom | Cause |
|---------|---------|
| `illegal_argument_exception` Grok | The pattern did not match `message` |
| Field missing from mapping | The template did not contain the field; dynamic mapping added it differently |
| Pipeline not invoked | Forgot `?pipeline=` or the default in the template |

## Checklist

- [ ] You explain the difference between enrichment in an **agent** vs an **ingest pipeline**.
- [ ] You read the Grok + Set example in `ingest-pipeline-nginx.json`.
- [ ] You know why `on_failure` matters in production.

**Next:** [04. Lab: ingest pipeline](04-lab-ingest-pipeline.md).
