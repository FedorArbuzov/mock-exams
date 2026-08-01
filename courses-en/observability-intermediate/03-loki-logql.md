# 03. Loki and LogQL

## Data model: not “logs like Elasticsearch”

**Loki** stores log streams, indexing primarily **labels** (like Prometheus labels for metrics). The line body is **not** full-text indexed by default: content filtering happens **after** stream selection, by scanning chunks.

Pros:

- Cheaper to store large volumes.
- Natural tie-in with Grafana and metrics (same labels: `cluster`, `namespace`, `pod`).

Cons:

- “Find any word across the whole cluster for a month” without a narrow selector is slow; you need sensible labels and a Promtail pipeline.

On the stand Loki listens on **3100** (`docker-compose.logs.yml`), Grafana datasource: `http://loki:3100`.

## Stream

A set of label → value uniquely defines a stream, for example:

```text
{container="mock-demo-app", stream="stdout"}
```

In Grafana Explore, label filters are the **log stream selector**.

## LogQL: two modes

### 1. Log queries (lines)

```logql
{container="mock-demo-app"} |= "error"
```

- `{...}` — label selector.
- `|=`, `!=`, `|~`, `!~` — line filters (`|~` is regex).

Filter chain:

```logql
{container="mock-demo-app"} |= "GET" != "/health"
```

### 2. Metric queries (aggregates over logs)

Like PromQL, but the source is logs:

```logql
sum(rate({container="mock-demo-app"}[5m]))
```

Functions: `rate`, `count_over_time`, `bytes_over_time`, `sum`, `avg`, `topk`, …

Examples — in [examples/logql-queries.txt](examples/logql-queries.txt).

## Labels on the stand

**Promtail** with `docker_sd_configs` reads the Docker socket and attaches labels from container metadata (`config/promtail.yml`):

- `container` — container name (`mock-demo-app`, …)
- `stream` — `stdout` / `stderr`

Without the logs overlay, Grafana has a Loki datasource but no data — you need:

```bash
docker compose -f docker-compose.yml -f docker-compose.logs.yml up -d
```

## Correlating metrics and logs

Typical investigation scenario:

1. Alert `DemoHighErrorRate` in Prometheus.
2. In Grafana: **Explore** → Prometheus, inspect the spike in `demo:http_errors:rate5m`.
3. **Split** or a new tab → Loki:

   ```logql
   {container="mock-demo-app"} |~ "error|5[0-9]{2}"
   ```

4. Narrow the time window to the minute of the spike.

If the app writes **structured JSON** with `trace_id`, the Promtail pipeline extracts a label — and you can jump to a trace (advanced / OTel).

## Retention and limits

`config/loki.yml`: filesystem storage, `retention_period: 168h` (7 days). Enough for the training stand; in production — object storage (S3), compactor, ingestion limits.

## Loki vs ELK / OpenSearch

| | Loki | ELK |
|---|------|-----|
| Index | Labels | Full text |
| Query | LogQL | DSL |
| Cost | Lower with good labels | Higher when “everything is indexed” |
| Tie-in with Prometheus | Native | Via integrations |

Full-text search and ISM for “heavy” logs — separate course [opensearch-basic](../opensearch-basic/README.md) → [intermediate](../opensearch-intermediate/README.md) ([`deploy/opensearch`](../../deploy/opensearch/README.md)).

## Related to Kafka

You watch consumer lag in metrics ([kafka-intermediate/17-monitoring.md](../kafka-intermediate/17-monitoring.md)); broker/connector logs help with **why** lag grew — same selector principles in Loki (`{container="kafka"}` after configuring Promtail).

## Checklist

- [ ] Understand the difference between log query and metric query in LogQL.
- [ ] Know which labels Promtail provides on the Docker stand.
- [ ] Can narrow time and tie a metric spike to a log stream.

**Next:** [04. Lab: Loki](04-lab-loki.md).
