# 11. System design: observability platform

## Введение

Задача staff/senior: **«Спроектируйте observability для 200 микросервисов в AWS + EKS, бюджет ограничен, on-call 24/7»**. Оценивают **стандарты**, **cost**, **on-call ergonomics**, не «поставим Prometheus».

## Framework ответа (45 мин)

1. **Requirements** (5 мин) — SLO, compliance, regions, teams.
2. **Estimates** (5 мин) — RPS, samples/sec, retention.
3. **Architecture** (15 мин) — diagram ingest/storage/query.
4. **Deep dives** (15 мин) — cardinality, security, multi-tenancy.
5. **Risks** (5 мин) — blind spots, vendor lock, «monitoring down».

---

## Clarifying questions

- **SLO:** availability/latency per critical path?
- **Regulatory:** PII in logs/traces? retention EU-only?
- **Teams:** 20 squads — shared platform или federated?
- **Existing:** CloudWatch only или greenfield?
- **Budget:** managed (AMP/Grafana Cloud) vs self-hosted?

---

## Back-of-envelope

| Параметр | Пример |
|----------|--------|
| Services | 200 |
| Avg 500 req/s each (not all peak) | 100k RPS order of magnitude |
| Metrics series per svc (controlled) | ~500 → 100k series |
| Scrape interval 30s | ~3k samples/s metrics (rough) |
| Trace sampling 1% @ 100k RPS | 1k traces/s peak |

**Правило:** cardinality guardrails важнее точного RPS на доске.

---

## Reference architecture (hybrid AWS)

```mermaid
flowchart TB
  subgraph eks [EKS]
    App[Apps + OTel SDK]
    Agent[OTel DaemonSet]
    Prom[Prometheus HA]
    AM[Alertmanager]
  end
  subgraph aws [AWS]
    CW[CloudWatch Logs/M metrics]
    XR[X-Ray optional]
    SNS[SNS PagerDuty]
  end
  App --> Agent
  Agent --> Col[OTel Collector]
  Col --> Tempo[Tempo/Jaeger]
  Col --> Prom
  Prom --> AM
  AM --> SNS
  App --> CW
```

| Signal | EKS | AWS managed |
|--------|-----|-------------|
| Infra + k8s | kube-prometheus-stack [03](03-kube-prometheus.md) | — |
| App metrics | Prometheus + ServiceMonitor | Custom CW if must |
| Logs | Loki / Fluent Bit → S3 | CloudWatch Logs [19](../aws-intermediate/19-cloudwatch.md) |
| Traces | OTel → Tempo/Jaeger | X-Ray for Lambda |

---

## Standards (platform team)

| Стандарт | Содержание |
|----------|------------|
| **OTel** | Mandatory SDK, `service.name`, resource attrs |
| **Logs** | JSON: `timestamp`, `level`, `trace_id`, `service` |
| **Metrics** | Naming: `http_server_duration_seconds` histogram |
| **Labels** | Denylist: `user_id`, `email`, full URL |
| **Dashboards** | Golden signals per service template |

---

## Alerting philosophy

- **SLO-based** alerts > static thresholds
- **Burn rate** 2-window (Google SRE book)
- **Runbooks** linked in annotation `runbook_url`
- **Inhibition** node/network before pod noise

Пример CloudWatch path для Lambda: [20-lab-cloudwatch](../aws-intermediate/20-lab-cloudwatch.md).

---

## Datastore: Redis layer

Cache не в вакууме:

| Signal | Tool |
|--------|------|
| Latency / hot key | Trace span + `INFO commandstats` |
| Memory | `used_memory`, alerts on `maxmemory` |
| Slow commands | SLOWLOG — [redis-intermediate/15](../redis-intermediate/15-monitoring.md) |

Не экспортировать каждый ключ в Prometheus.

---

## Cost controls

| Knob | Effect |
|------|--------|
| Trace sampling | Largest trace bill |
| Metrics retention 15d hot | TSDB size |
| Recording rules | Cheaper dashboards |
| Log index labels only | Loki/CW cost |
| Drop labels at collector | Protect cardinality |

[05-cardinality-cost](05-cardinality-cost.md).

---

## Security

- PII scrubbing in Collector processor
- RBAC Grafana folders per team
- mTLS ingest OTLP
- Secrets не в span attributes

---

## Failure modes

| Risk | Mitigation |
|------|------------|
| Monitoring outage | External synthetics, multi-replica |
| Cardinality explosion | CI lint + relabel |
| Trace gap | Propagation tests in CI |
| Alert storm | Inhibition + SEV definitions |

---

## На собеседовании — anti-patterns

- «Один Prometheus без HA на 200 сервисов»
- «100% traces forever»
- «Каждая команда свой Jaeger без standards»
- «Только CloudWatch без app RED metrics»

## Резюме

- Platform: **standards + shared backends + guardrails**.
- Hybrid AWS: EKS Prometheus + CloudWatch for control plane/Lambda.
- Cost и cardinality — часть design, не afterthought.

Следующий урок: [12-lab-system-design.md](12-lab-system-design.md).
