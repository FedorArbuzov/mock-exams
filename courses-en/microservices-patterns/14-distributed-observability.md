# 14. Observability in a distributed system

## Intro

An "ERROR null" log in one of 20 pods with no **trace id** — a day of debugging. Microservices **require** correlation, distributed tracing, and metrics **per dependency**, not just per process.

---

## The three pillars (microservices edition)

| Pillar | Microservices focus |
|-------|---------------------|
| **Logs** | structured JSON + `trace_id`, `span_id`, `service.name` |
| **Metrics** | RED per service + client metrics per downstream |
| **Traces** | end-to-end latency breakdown |

[observability-basic](../observability-basic/README.md) → [advanced](../observability-advanced/README.md).

---

## Correlation ID

```http
X-Request-Id: req_abc   (client or edge generates)
traceparent: W3C trace context
```

Propagate through **all** sync calls and in gRPC **metadata**; in consumer events — in the payload or Kafka headers.

Implementation: [fastapi/36–38](../fastapi/36-observability.md).

---

## Distributed tracing

```text
[Gateway span]
   ├─ [Order svc span]
   │     └─ [Payment client span]
   └─ [Inventory client span]
```

| Question | The trace answers |
|--------|----------------|
| Where do 2s out of 3s go? | a long Payment span |
| How much fan-out? | the number of child spans |

Sampling: 100% of errors, 1–10% of successes in prod.

---

## Dependency metrics

```promql
histogram_quantile(0.99,
  sum by (le, downstream) (rate(http_client_request_duration_seconds_bucket[5m]))
)
```

Alert: **client** p99 to Inventory > 500ms.

---

## Logs ≠ tracing

Don't duplicate every span in a log. **Log** business events and errors with a `trace_id` to jump into Jaeger/Tempo.

---

## Service map

An automatic "who calls whom" map — drift detection (an unexpected call to Legacy appeared).

---

## Cross-service SLO

| SLI | Boundary |
|-----|---------|
| User checkout success | edge / BFF |
| Payment capture | Payment svc owner |

One svc's error budget affects the chain — [sre/03](../sre/03-sli-slo.md).

---

## In mock-exams

| Topic | Course |
|------|------|
| OTel FastAPI | [fastapi/38](../fastapi/38-opentelemetry.md) |
| Prometheus K8s | [kuber-advanced/14](../kuber-advanced/14-observability.md) |
| Loki logs | [observability-intermediate](../observability-intermediate/README.md) |

---

## Subtasks

**Time:** ~60–70 min.

### 14.1 Log fields (15 min)

A list of mandatory structured-log fields for any svc (≥10 fields).

### 14.2 Trace walkthrough (15 min)

Draw 5 spans for Place Order. Where do you set span attributes (`order.id`)?

### 14.3 Dashboard (15 min)

A list of 6 Grafana panels for the "health" of the checkout microservice feature.

### 14.4 Alert rules (10 min)

3 alerts: symptom-based (user) + cause-based (dependency).

### 14.5 Sampling policy (10 min)

Prod: % of success traces, % of errors, head-based vs tail-based — your choice.

---

## Summary

Without a trace id, microservices are **undebuggable**. Client-side metrics catch others' failures before your own 500.

---

## Checklist

- [ ] trace_id end-to-end?
- [ ] Client metrics per downstream?
- [ ] SLO at the user journey boundary?

**Next:** [15. Independent deploy and versions](15-deployment-versioning.md).
