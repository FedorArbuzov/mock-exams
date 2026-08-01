# 05. Promtail: pipelines and log enrichment

## Promtail’s role

**Promtail** is a log collection agent (analogous to Fluent Bit/Vector for Loki). On the stand it:

1. Discovers containers via **Docker service discovery** (`docker_sd_configs`).
2. Reads container stdout/stderr.
3. Runs lines through **pipeline stages**.
4. Sends batches to Loki (`clients.url: http://loki:3100/loki/api/v1/push`).

Without a pipeline, Loki gets “raw” lines; labels come only from relabel (container name, stream).

## Config structure

```yaml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml   # read cursor — don’t lose place on restart

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    docker_sd_configs: [...]
    relabel_configs: [...]      # labels before pipeline
    pipeline_stages: [...]      # parse the line
```

Current minimum — `deploy/observability/config/promtail.yml` (relabel only, no `pipeline_stages`).

## Pipeline stages (main ones)

| Stage | Purpose |
|-------|------------|
| `docker` | Unpack Docker log driver JSON wrapper |
| `json` | Parse JSON into extracted fields |
| `logfmt` | Parse `key=value` |
| `regex` | Extract fields with a regex |
| `labels` | Promote fields to **indexed labels** (watch cardinality!) |
| `timestamp` | Parse time from the line |
| `drop` | Drop noise |
| `output` | Final line text |

Order matters: unpack first, then parse, then labels.

## Example: app JSON log

Suppose demo-app writes:

```json
{"level":"info","msg":"request","status":200,"path":"/health"}
```

Pipeline:

```yaml
pipeline_stages:
  - json:
      expressions:
        level: level
        status: status
        path: path
  - labels:
      level:
      status:
  - drop:
      expression: ".*health.*"
      drop_counter_reason: health_noise
```

Then in LogQL:

```logql
{container="mock-demo-app", level="error"}
sum(rate({container="mock-demo-app", status="500"}[5m]))
```

**Important:** every unique `path` as a label — cardinality explosion. Promote **low** cardinality to labels: `level`, `status_class` (`2xx`/`5xx`), not the full URL.

## relabel_configs vs pipeline

| | relabel | pipeline |
|---|---------|----------|
| When | On target metadata (before reading the file) | On every log line |
| Typically | `container`, `namespace` | `level`, `trace_id` |
| Analog | Prometheus relabel | Content processing |

## Positions and reliability

`positions.yaml` stores the offset. Deleting the Loki/Promtail volume can cause **replay** or **skip** — fine for the training stand; in production — a persistent volume for positions.

## Label safety

Rule: **do not index** high-cardinality fields (`user_id`, `request_id` as a label). Use a line filter:

```logql
{container="app"} |= "request_id=abc-123"
```

Or structured metadata (newer Loki versions) — beyond intermediate.

## Kafka and Connect

Kafka logs are often plain text (multiline stack traces). Stages:

- `multiline` — glue the traceback;
- `regex` — extract `ERROR`;
- `labels: {component="kafka"}`.

Lag metrics still come from Prometheus ([17-monitoring](../kafka-intermediate/17-monitoring.md)); logs are **incident context**.

## Checklist

- [ ] Distinguish relabel from pipeline stages.
- [ ] Understand cardinality risk in the `labels` stage.
- [ ] Know why `positions` and `drop` exist.

**Next:** [06. Lab: Promtail](06-lab-promtail.md).
