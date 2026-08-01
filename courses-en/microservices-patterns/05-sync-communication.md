# 05. Synchronous communication: REST, gRPC, contracts

## Intro

"Let's just call the neighbor over HTTP" — without a timeout, retry policy, and contract, this turns into a **cascading failure**. Sync is appropriate for **reads** and **immediate decisions**; every call is a liability in the latency chain.

---

## When sync

| Fits | Doesn't fit |
|----------|-------------|
| Need an answer now (price, stock check) | Fan-out to 10+ services on one request |
| A simple query | Long orchestration over minutes |
| Low frequency | High-throughput fire-and-forget |

Rule: **minimize the depth** of the sync chain (≤ 2–3 hops for user-facing p99).

---

## REST between services

| Practice | Detail |
|----------|--------|
| Contract | OpenAPI + [contract tests](../fastapi/32-contract-tests.md) |
| Version | `/internal/v1/` separate from the public API |
| Errors | Problem Details ([api-design/06](../api-design/06-errors-problem-details.md)) |
| Idempotency | Idempotency-Key on mutating POST |

**Consumer-driven contracts** (Pact): the downstream sets expectations for the upstream.

---

## gRPC internal

| | REST JSON | gRPC |
|--|-----------|------|
| Schema | OpenAPI | protobuf |
| Browser | yes | no (usually) |
| Streaming | rarely | yes |
| Typing | weaker | strong codegen |

Typical: **REST publicly**, **gRPC inside the mesh**.

---

## Timeout budget

```text
Client deadline: 3000 ms
  Gateway:        500 ms overhead
  Service A:      2000 ms (including B)
    Service B:    1500 ms max
```

Each hop **reduces** the remaining budget; pass the `deadline` / `grpc-timeout`.

---

## Partial failure in aggregation

The BFF calls A and B in parallel:

| A | B | UX |
|---|---|-----|
| OK | OK | full response |
| OK | fail | degraded (without the B block) or 503 |
| fail | fail | 503 |

An explicit **degradation policy** in the ADR ([api-design/13](../api-design/13-boundaries-system-design.md)).

---

## In mock-exams

| Topic | Course |
|------|------|
| httpx parallel | [python-async/18](../python-async/18-lab-parallel-fetch.md) |
| API design | [api-design](../api-design/README.md) |
| Async timeouts | [python-async/32](../python-async/32-backpressure-semaphores.md) |

---

## Subtasks

**Time:** ~50–60 min.

### 5.1 Sync graph (15 min)

Draw the chain for "place an order" (UI → … → services). Label the sync calls. Compute the **maximum depth**.

### 5.2 Timeout budget (15 min)

Set p99 UI = 2s. Distribute the budget across hops (table: service | timeout | rationale).

### 5.3 OpenAPI fragment (15 min)

One internal endpoint `GET /internal/v1/inventory/{sku}` — request/response/errors (pseudo-YAML or bullets).

### 5.4 Degradation (10 min)

BFF: catalog OK, recommendations fail — what do you return to the client? JSON sketch.

### 5.5 Contract test plan (5 min)

Who is the consumer, who is the provider? Which test breaks CI on a breaking change?

---

## Summary

Sync is **latency debt and coupling**. A contract, a timeout budget, and degradation are mandatory; deep chains are a signal to go async or rethink boundaries.

---

## Checklist

- [ ] Sync depth ≤ 3 for the user path?
- [ ] Internal API versioned?
- [ ] Degradation described?

**Next:** [06. Asynchrony and event-driven](06-async-events.md).
