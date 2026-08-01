# 07. API Gateway, BFF, and service mesh (overview)

## Intro

The client shouldn't know about 40 internal host:port pairs. The **Gateway** handles edge auth and routing; the **BFF** aggregates for the UI; the **mesh** handles mTLS and traffic policy **between** services.

---

## API Gateway (edge)

```text
Internet → [WAF] → [API GW] → internal services
```

| Function | Example |
|---------|--------|
| TLS termination | cert on the GW |
| AuthN | JWT validate |
| Rate limit | per API key |
| Routing | path → service |
| Request transform | header injection |

AWS: [API Gateway](../aws-intermediate/05-api-gateway.md). On-prem/K8s: Kong, Envoy Gateway, nginx.

Do **not** put business logic in the GW — only cross-cutting concerns.

---

## BFF (Backend for Frontend)

| BFF | Why |
|-----|-------|
| Mobile BFF | smaller payload, one round-trip |
| Web BFF | different aggregation |
| Partner BFF | a stable external contract |

```text
Mobile → Mobile BFF → [Catalog, Cart, Profile] (parallel)
```

The BFF **owns** aggregation; it doesn't leak raw internal errors outward.

Related: [api-design/13](../api-design/13-boundaries-system-design.md).

---

## GraphQL on the BFF (carefully)

| + | − |
|---|---|
| one request — many fields | N+1, complex caching |
| flexibility for the UI | overloads the backend |

For a public partner API, a **stable REST/OpenAPI** is more common.

---

## Service mesh (data plane)

```text
[Svc A + sidecar Envoy] ←mTLS→ [Svc B + sidecar]
         ↑                              ↑
    control plane (Istio/Linkerd)
```

| Mesh capability | Without mesh |
|------------------|----------|
| mTLS by default | app-level TLS by hand |
| retries/timeouts policy | in library code |
| traffic split canary | a separate deploy trick |

**Cost:** sidecar CPU, operational complexity. It makes sense with **dozens** of services and a mature platform team ([kuber-advanced](../kuber-advanced/README.md)).

---

## Don't duplicate layers

| Bad | Better |
|-------|-------|
| Rate limit on the GW **and** on every svc **and** in the mesh | policy: edge + critical internal |
| Auth in the BFF **and** again in every svc | JWT validate at the edge + scopes in the svc |

---

## In mock-exams

| Topic | Course |
|------|------|
| nginx reverse proxy | [nginx-basic](../nginx-basic/README.md) |
| K8s Ingress | [kuber-basic/20](../kuber-basic/20-ingress.md) |
| NetworkPolicy | [kuber-intermediate](../kuber-intermediate/README.md) |

---

## Subtasks

**Time:** ~50–60 min.

### 7.1 Edge diagram (15 min)

Draw: Client → GW → (BFF?) → 3 services. Label TLS, auth, rate limit at each layer.

### 7.2 BFF aggregation (15 min)

The "product card" screen: which 3–4 internal calls? Parallel or serial? Sketch the BFF's JSON response.

### 7.3 GW vs BFF responsibilities (10 min)

Table: function | GW | BFF | Service (yes/no, where).

### 7.4 Mesh decision (10 min)

For the product from ch.01: mesh **yes/no/later** — 5 arguments.

### 7.5 Partner API (10 min)

An external partner: a separate BFF or a direct GW route? Justify versioning ([api-design/07](../api-design/07-versioning-compatibility.md)).

---

## Summary

The GW is the **perimeter**; the BFF is the **client experience**; the mesh is **internal** security and traffic. Don't mix domain logic with infrastructure layers.

---

## Checklist

- [ ] No business logic in the GW?
- [ ] BFF degradation policy in place?
- [ ] Mesh justified by scale?

**Next:** [08. Database per service](08-database-per-service.md).
