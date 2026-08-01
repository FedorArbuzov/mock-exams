# 06. Lab: Promtail pipeline

## Goal

Add **pipeline_stages** for Docker logs: unpack Docker JSON, extract `level` from the line (regex), filter noise, verify new labels in Loki.

## Setup

Stack with logs:

```bash
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.logs.yml up -d
```

## Task 1. Basic pipeline for Docker JSON

In `config/promtail.yml`, under job `docker`, add after `relabel_configs`:

```yaml
    pipeline_stages:
      - docker: {}
```

Restart:

```bash
docker compose -f docker-compose.yml -f docker-compose.logs.yml restart promtail
```

Check promtail logs — no parse errors.

## Task 2. Regex for log level

Many images write `level=info` or `INFO`. Add a stage:

```yaml
      - regex:
          expression: '(?P<level>(INFO|WARN|ERROR|DEBUG|level=\w+))'
      - labels:
          level:
```

*Note:* for fields like `level=info` you may need a second regex or `logfmt` — tune to the real `mock-prometheus` / `mock-grafana` log.

Check in Grafana:

```logql
{container="mock-prometheus", level=~"ERROR|error"}
```

## Task 3. Drop noisy health checks

If the stream has repeating health lines (depends on the image):

```yaml
      - drop:
          expression: ".*/health.*"
          drop_counter_reason: health
```

Metric in Promtail metrics (`http://localhost:9080/metrics` — port not published; check via `docker compose exec promtail wget -qO- localhost:9080/metrics | grep drop`):

- counter `promtail_dropped_entries_total` with reason `health`.

## Task 4. Documenting cardinality

In `notes-promtail.md` (in the course directory or `/tmp`) answer:

1. Which **three** fields are safe to promote to labels in production?
2. Which field **must not** (example with `user_id`)?
3. What changes in Loki if you promote `request_id` to a label?

## Task 5. *Optional* — multiline

For Java/Kafka stack traces add (reference only; Kafka stand not required):

```yaml
      - multiline:
          firstline: '^\d{4}-\d{2}-\d{2}'
          max_wait_time: 3s
```

## Expected result

| Check | Criterion |
|----------|----------|
| docker stage | Logs readable in Explore |
| label `level` | Appears on at least one container |
| drop | Drop counter grows when health appears in logs |
| notes | Answers to 3 cardinality questions |

## Troubleshooting

| Symptom | Action |
|---------|----------|
| empty level label | Regex did not match — inspect the raw line in Explore |
| Promtail restart loop | YAML indentation; `docker compose logs promtail` |
| After labels “No data” | Selector too strict — drop level from the query |

## Checklist

- [ ] `pipeline_stages` added
- [ ] LogQL with new label works
- [ ] Cardinality notes written

**Next:** [07. SLO, SLI, SLA](07-slo-sli-sla.md).
