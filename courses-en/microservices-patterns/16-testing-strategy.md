# 16. Microservices testing strategy

## Intro

E2E across 20 services is slow and fragile. The test pyramid **shifts** toward contract and integration; E2E is for **critical** user journeys only.

---

## Test pyramid (microservices)

```text
        ┌─────────┐
        │ E2E few │  5–15 scenarios
        ├─────────┤
        │Contract │  consumer-provider
        ├─────────┤
        │ Integr. │  svc + real DB/broker testcontainer
        ├─────────┤
        │  Unit   │  domain logic
        └─────────┘
```

---

## Unit tests

Domain logic **without** the network: saga transitions, pricing rules, state machine.

[python-testing](../python-testing/README.md).

---

## Integration tests

| Component | Environment |
|-----------|-------|
| Order svc | Postgres testcontainer |
| + outbox relay | embedded or test Kafka |
| + Redis | testcontainers |

[python-testing/22 testcontainers](../python-testing/22-testcontainers.md).

---

## Contract tests

The consumer (Order) publishes its expectations of the Provider (Inventory):

```text
Given GET /sku/42
Expect 200 { "available": 10 }
```

Pact, OpenAPI diff ([fastapi/32](../fastapi/32-contract-tests.md)).

**Breaks CI** on a breaking change without agreement.

---

## Component tests (service in isolation)

You bring up Order + a mock Inventory (WireMock, pytest-httpx) — faster than E2E.

---

## E2E

| Do | Don't |
|--------|-----------|
| Happy path checkout | 500 filter combinations |
| Auth + payment sandbox | testing another svc's internals |

Environment: staging `mockctl` + [deploy/fastapi](../../deploy/fastapi/README.md), [deploy/celery](../../deploy/celery/README.md).

---

## Testing async / events

| Approach | Description |
|--------|----------|
| In-memory broker | unit saga |
| Testcontainer Kafka | integration outbox |
| Assert on the outbox table | without a broker |

---

## In mock-exams

| Topic | Course |
|------|------|
| pytest | [python-testing](../python-testing/README.md) |
| API tests | [fastapi/30–31](../fastapi/30-testing.md) |
| Contract | [fastapi/32](../fastapi/32-contract-tests.md) |
| Interview | [python-testing cheatsheet](../python-testing/interview-cheatsheet.md) |

---

## Subtasks

**Time:** ~60–70 min.

### 16.1 Pyramid for the product (15 min)

Estimate the % of effort for unit/integration/contract/e2e for your system (sums to 100%).

### 16.2 Contract pair (20 min)

Pick a consumer-provider pair. Write 3 contract examples (request/response).

### 16.3 Integration scope (15 min)

For the Order svc: what goes in the testcontainer (DB, Redis, Kafka)? What's mocked?

### 16.4 E2E list (10 min)

5 E2E scenarios max — critical journeys only.

### 16.5 Flaky test policy (10 min)

Rule: flaky test → quarantine for N days → fix or delete.

---

## Summary

Contract tests are the **insurance** for independent deploy. E2E is expensive — save it for journeys, not for coverage vanity.

---

## Checklist

- [ ] A contract for every sync dependency?
- [ ] An outbox/integration test in place?
- [ ] E2E < 20 scenarios?

**Next:** [17. Anti-patterns](17-anti-patterns.md).
