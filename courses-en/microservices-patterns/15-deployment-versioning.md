# 15. Independent deploy, versions, and feature flags

## Intro

The main promise of microservices is to **deploy Order without Catalog**. In practice, a shared library v1.2 breaks everyone — **pseudo-independence**. You need contract versioning, compatibility, and feature flags.

---

## Independent deploy checklist

| Requirement | Check |
|------------|----------|
| Separate CI pipeline | merge into order-repo → deploy only order |
| Separate DB | no shared migration |
| Backward compatible API/events | an old-version consumer keeps working |
| Contract tests green | [16-testing-strategy](16-testing-strategy.md) |

---

## Semantic versioning of a service

| Change | Version |
|-----------|--------|
| Compatible bugfix | patch |
| New optional endpoint/event field | minor |
| Breaking API/event | **major** + parallel run |

The **artifact** version ≠ the **HTTP API** version ([api-design/07](../api-design/07-versioning-compatibility.md)).

---

## Consumer-driven compatibility

```text
Payment v2 rolled out
Order (consumer v1) stays on the old contract for 2 more weeks
→ Payment v1 and v2 in parallel OR Order dual-consumes
```

**Tolerant reader:** ignore unknown JSON fields.

---

## Feature flags

| Flag | Level |
|------|---------|
| `use_new_inventory_svc` | routing in the facade |
| `enable_bnpl` | business logic in Order |

Storage: LaunchDarkly, Unleash, or DB + cache.

Don't use a flag instead of an API version for a breaking schema.

---

## Canary / blue-green per service

```text
10% traffic → Order v2.3
metrics OK → 100%
```

K8s: [kuber-intermediate HPA](../kuber-intermediate/README.md), Argo Rollouts — [gitops-intermediate](../gitops-intermediate/README.md).

---

## Shared libraries trap

| Bad | Better |
|-------|-------|
| `common-models.jar` with the domain | copy the DTO + a contract test |
| Shared DB migration tool | per-repo Alembic/Flyway |

Minimize **shared code**; duplicating a schema is cheaper than a coupled deploy.

---

## In mock-exams

| Topic | Course |
|------|------|
| GitLab deploy | [gitlab-intermediate](../gitlab-intermediate/README.md) |
| GitOps | [gitops-basic](../gitops-basic/README.md) |
| API versioning | [api-design/07](../api-design/07-versioning-compatibility.md) |

---

## Subtasks

**Time:** ~55–65 min.

### 15.1 Deploy matrix (15 min)

Table: service | own repo? | own CI? | shared deps | truly independent? (Y/N)

### 15.2 Breaking change rollout (20 min)

A plan: rename the field `total` → `amount_cents` between Payment and Order (4 steps, 2 weeks).

### 15.3 Feature flag spec (10 min)

A strangler-route flag: name, default, who can toggle, rollback.

### 15.4 Canary metrics (10 min)

3 go/no-go metrics for a canary of the Order svc.

### 15.5 Shared lib audit (10 min)

A list of shared packages in the monolith — what to extract/kill during the split.

---

## Summary

Independent deploy = **compatible contracts** + data isolation + CI. Feature flags are for behavior, versioning is for schema.

---

## Checklist

- [ ] Does a breaking change have a parallel period?
- [ ] No hidden shared DB migration?
- [ ] Canary metrics defined?

**Next:** [16. Testing strategy](16-testing-strategy.md).
