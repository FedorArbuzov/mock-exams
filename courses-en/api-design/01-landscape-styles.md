# 01. API styles: REST, RPC, GraphQL, gRPC, events

## Intro

"Let's do REST" often means "JSON over HTTP" — with no resources, no status codes, and no thought about clients. In interviews and in production, what matters is naming the **style** and explaining the **trade-offs**, not arguing about the purity of REST Level 3.

---

## Five approaches

| Style | Transport | Strength | Weakness |
|-------|-----------|-----------------|----------------|
| **REST (resource-oriented)** | HTTP + JSON | caching, standard codes, OpenAPI | many round-trips for a data graph |
| **RPC (procedure-oriented)** | HTTP/JSON, gRPC | simple "do X" commands | gets confused with REST, worse caching |
| **GraphQL** | HTTP POST | one request — a graph of fields | complexity, N+1, CDN caching |
| **gRPC** | HTTP/2, protobuf | speed, streaming, contract | browsers, public partners |
| **Events (async)** | Kafka, SQS, webhooks | decoupling, replay | eventual consistency |

```text
Sync request/response          Async
─────────────────────          ─────
Client ──HTTP──► API           Producer ──► bus ──► consumers
         ◄──JSON──             (webhook / poll for status)
```

---

## REST — what it means in practice

A **good REST API** (in the industry sense, not academic HATEOAS):

- **Nouns** in the URL: `/orders`, `/orders/{id}/items`
- **HTTP verbs** carry meaning: GET reads, POST creates, PATCH partially updates
- **Status codes** reflect the outcome: 201 + `Location`, 409 on conflict
- **Stateless** server: context in the token/headers, not in a server-side session

**Not REST:** `POST /api/getOrder`, `GET /api/deleteUser?id=5`.

---

## RPC over HTTP

Acceptable for **internal** services and **commands**:

```http
POST /rpc/orders.cancel
{"order_id": "ord_42", "reason": "customer_request"}
```

Pros: an explicit action, easier for legacy clients. Cons: everything goes through POST, caching is useless, OpenAPI is less expressive.

**Rule:** a public product API — resource REST; an internal "do the cancellation" — RPC or gRPC.

---

## GraphQL — when it fits

| Fits | Doesn't fit |
|----------|-------------|
| A mobile app with different screens | Simple CRUD with 3 endpoints |
| A BFF in front of many microservices | Strict p99 SLAs without tuning |
| Partners want to pick fields | You need aggressive CDN caching of GET |

See [13-boundaries-system-design](13-boundaries-system-design.md) (BFF).

---

## gRPC

- **Protobuf** — a binary contract, codegen for clients
- **Streaming** — server/client/bidirectional
- Typically: **service-to-service** inside a mesh/K8s, not a replacement for public REST

In mock-exams gRPC isn't covered by a separate course; for interviews it's enough to say: "public REST/OpenAPI, gRPC inside the mesh".

---

## Events instead of or alongside an API

| Scenario | Sync API | Events |
|----------|----------|--------|
| "Create an order now" | POST /orders | — |
| "Notify 5 systems about an order" | 5 HTTP calls from the API | one `order.created` |
| "Recompute yesterday's report" | a long POST | job + webhook/poll |

More: [messaging-deep](../messaging-deep/README.md), [11-async-webhooks](11-async-webhooks.md).

---

## In mock-exams

| Style | Course |
|-------|------|
| REST + OpenAPI | [fastapi](../fastapi/README.md), [django](../django/README.md) |
| Async/events | [messaging-deep](../messaging-deep/README.md), [python-celery](../python-celery/README.md) |
| Webhooks | [fastapi/25](../fastapi/25-websockets-sse.md), [11-async-webhooks](11-async-webhooks.md) |

---

## Summary

First **who the client is** (browser, mobile, partner, another service), then the style. Public HTTP JSON — most often **resource REST + OpenAPI**. Inside the cluster — **gRPC**. State changes for many subscribers — **events**.

---

## Checklist

- [ ] Is your current API REST, RPC, or "a mix"?
- [ ] Are there operations better moved to events?
- [ ] Do you need a BFF/GraphQL between the client and the microservices?

**Next:** [02. HTTP: methods, status codes, safe and idempotent](02-http-semantics.md).
