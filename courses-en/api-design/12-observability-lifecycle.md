# 12. Observability and lifecycle APIs

## Intro

"The API is slow" — without metrics by route, version, and tenant this becomes an argument between backend and "the network". Observability and the **lifecycle** (changelog, deprecation) are part of the API product, just like the JSON schema.

---

## Golden signals for an API

| Signal | Metric |
|--------|---------|
| Latency | histogram `http_request_duration_seconds` by route |
| Traffic | `http_requests_total` by method, route, status |
| Errors | rate of 5xx, business 4xx |
| Saturation | CPU, pool connections, queue depth |

RED method: Rate, Errors, Duration — [observability-basic](../observability-basic/README.md).

---

## Label cardinality

```promql
# Good
sum by (handler, method, status) (rate(http_requests_total[5m]))

# Dangerous — cardinality explosion
http_requests_total{user_id="..."}
```

In labels: the `route template` (`/orders/{id}`), not the raw path with a uuid.

Implementation: [fastapi/36–37](../fastapi/36-observability.md).

---

## Correlation and tracing

```http
X-Request-Id: req_7c9e6679
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

- The client may send an `X-Request-Id`; the server augments or generates it
- Return the id in the Problem `instance` — [06-errors-problem-details](06-errors-problem-details.md)
- OpenTelemetry: [fastapi/38](../fastapi/38-opentelemetry.md)

---

## Health endpoints

| Path | Purpose | Who calls it |
|------|------------|--------------|
| `/health` | liveness (the process is alive) | kubelet |
| `/ready` | DB/redis ok | kubelet, LB |
| `/health/deep` | all dependencies | monitoring (not every second) |

Don't mix a public `/health` with a leak of internal service names.

---

## API changelog

Outside OpenAPI — a human-readable **CHANGELOG.md** or docs site:

```markdown
## 2024-06-01
- Added optional `metadata` to Order (compatible).
- Deprecated GET /api/v1/legacy-search; use POST /api/v1/orders/search.
```

Tie it to `info.version` and sunset headers — [07-versioning-compatibility](07-versioning-compatibility.md).

---

## SLOs for an API

| SLI | Example SLO |
|-----|------------|
| Availability | 99.9% successful (non-5xx) |
| Latency | p99 GET /orders < 300ms |
| Correctness | 0 duplicate charges (business metric) |

Error budget → freeze breaking changes: [sre](../sre/README.md).

---

## Synthetic checks

A periodic `GET /health` + a critical `POST` with a test key in staging — you learn about a breakage before your clients do.

---

## Documentation as lifecycle

| Artifact | Updated when |
|----------|-------------------|
| OpenAPI | every PR with an API change |
| Migration guide | breaking / deprecation |
| Postman/Insomnia collection | release tag |
| SDK semver | follows the API major |

---

## In mock-exams

| Topic | Course |
|------|------|
| Prometheus metrics | [fastapi/36–37](../fastapi/36-observability.md) |
| SLO | [observability-intermediate](../observability-intermediate/README.md), [sre/03](../sre/03-sli-slo.md) |
| K8s probes | [kuber-basic probes](../kuber-basic/README.md) |

---

## Summary

Metrics by the **route template**, tracing via a request id, health for the orchestrator, a changelog for humans. An API without observability is a black box for the platform.

---

## Checklist

- [ ] RED metrics by handler?
- [ ] A request id in logs and errors?
- [ ] Is there a changelog process?

**Next:** [13. Service boundaries and system design](13-boundaries-system-design.md).
