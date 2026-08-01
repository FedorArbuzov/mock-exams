# 02. Bounded context and domain decomposition

## Intro

A "User service" with fields from CRM, billing, and logistics is **not a service** — it's a shared kernel with no boundaries. A **bounded context** (DDD) is the language and model within which terms are unambiguous; a service boundary should follow the context, not the DB tables.

---

## Ubiquitous language

| In the "Order" context | In the "Delivery" context |
|---------------------|------------------------|
| Order = cart + payment | Shipment = a parcel in the warehouse |
| status `paid` | status `in_transit` |

The same term — **different models** in different contexts. That's fine; the danger is **one table** for everyone.

---

## Context map (relationship types)

```text
[Sales] ──customer/supplier──► [Billing]
[Catalog] ──conformist──► [Search]   (Search copies the Catalog model)
[Orders] ──anti-corruption layer──► [Legacy ERP]
```

| Relationship | Meaning |
|-------|-------|
| **Partnership** | two teams, a shared contract |
| **Customer-Supplier** | upstream defines the downstream API |
| **Conformist** | downstream accepts the upstream model |
| **Anti-Corruption Layer (ACL)** | translates a foreign model into your own |
| **Shared kernel** | shared code/schema (minimize) |

---

## How to find boundaries

| Heuristic | Question |
|-----------|--------|
| Change together | What changes most often in a single PR? |
| Different SLAs | What needs 99.99% vs 99%? |
| Different experts | Who owns the domain knowledge? |
| Write vs read | Where is read extreme? (→ CQRS later) |

Do **not** cut along technical layers: `UserService`, `NotificationService` without a domain is an **anemic** decomposition.

---

## Example: e-commerce

```text
Contexts:
  Catalog     — SKU, price, availability (read-heavy)
  Cart        — session, promos (short-lived)
  Order       — order lifecycle
  Payment     — authorization, capture, refund
  Fulfillment — warehouse, shipment
  Notification— email/push (supporting)
```

The **Notification** service is supporting; it doesn't own "the order."

---

## ACL at the boundary

```text
Legacy ERP JSON  →  [ACL mapper]  →  OrderCreated (internal event)
```

Without an ACL, the domain model gets **contaminated** with ERP fields.

---

## In mock-exams

| Topic | Course |
|------|------|
| Django apps as bounded contexts | [django/05](../django/05-apps-structure.md) |
| FastAPI layers | [fastapi/08](../fastapi/08-project-structure.md) |
| Domain in the capstone | [fastapi/42](../fastapi/42-capstone.md) |

---

## Subtasks

**Time:** ~50–60 min.

### 2.1 Event storming (lite) (20 min)

For your chosen product, write down **15–20 domain events** in the past tense: `OrderPlaced`, `PaymentFailed`, …

Group the events into **4–6 clusters** — candidate bounded contexts.

### 2.2 Context map (15 min)

Draw 4+ contexts and label the relationships (customer-supplier, ACL, …). Mermaid or ASCII.

### 2.3 Glossary of terms (10 min)

For two contexts, describe **one word with two meanings** (like "Order" above).

### 2.4 Service boundary (10 min)

Pick **one** context to extract first. Justify it: low coupling, high change frequency, or scale.

### 2.5 ACL (5 min)

If there's legacy/integration — describe what the ACL does (input/output, no code).

---

## Summary

A service = a **boundary of meaning**, not a table boundary. A context map and an ACL are cheaper than reworking a "shared users DB."

---

## Checklist

- [ ] Did event storming yield 4+ clusters?
- [ ] No "Utils" service?
- [ ] ACL specified for legacy?

**Next:** [03. Conway and team topology](03-conway-teams.md).
