# Runbook: <INCIDENT_TITLE>

| Поле | Значение |
|------|----------|
| **Severity** | SEV-1 / SEV-2 / SEV-3 |
| **Service** | `<service-name>` |
| **Owner** | `<team>` |
| **Last reviewed** | YYYY-MM-DD |

## Symptoms

- Alert: `<alertname>` / dashboard panel: `<panel>`
- User impact: `<latency errors availability>`

## Quick checks (5 min)

| # | Действие | Ожидание |
|---|----------|----------|
| 1 | `kubectl get pods -n <ns>` | Running, restarts не растут |
| 2 | PromQL: `<expr>` | Baseline vs now |
| 3 | Logs: `<query in Loki/CloudWatch>` | Spike ERROR |
| 4 | Trace: Jaeger/X-Ray service `<name>` | Error spans / latency |

## Diagnosis

### Metrics (RED)

```promql
# Rate
sum(rate(http_requests_total{service="<svc>"}[5m])) by (status)
# Errors
sum(rate(http_requests_total{service="<svc>",status=~"5.."}[5m]))
 / sum(rate(http_requests_total{service="<svc>"}[5m]))
# Duration
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

### Logs

```text
{service="<svc>"} |= "ERROR" | json | line_format "{{.message}}"
```

### Traces

- Jaeger: service `<svc>`, operation `GET /api/...`, min duration > 1s
- Compare trace_id из лога (если включён trace context)

## Mitigation

| Сценарий | Действие | Rollback |
|----------|----------|----------|
| Bad deploy | `kubectl rollout undo deployment/<name>` | Re-deploy fix |
| Saturation | Scale HPA / limits | Revert scale |
| Dependency down | Circuit breaker / feature flag | Restore dependency |

## Escalation

- **15 min** без улучшения → platform/SRE
- **30 min** SEV-1 → incident commander

## Post-incident

- [ ] Timeline в тикете
- [ ] Action items (cardinality, missing alert, runbook gap)
- [ ] Update this runbook
