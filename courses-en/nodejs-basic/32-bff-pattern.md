# 32. BFF pattern: why a proxy in front of FastAPI

## A scenario from work

A frontend developer asks: “Why does React hit Node `:3096` when FastAPI is already on `:8090` with OpenAPI?” The architect draws a diagram: the browser must not know the internal Python service URL; CORS and JWT refresh live on the BFF; one admin screen aggregates items from FastAPI and stats from another service. Without a BFF — three origins in the browser, duplicated auth, infra URLs leaking into DevTools.

In mock-exams the BFF is the teaching bridge between [`react-basic`](../react-basic/README.md) and [`deploy/fastapi`](../../deploy/fastapi/README.md).

## What you'll learn

- Definition of Backend-for-Frontend (BFF)
- Why to hide FASTAPI_URL from the browser
- CORS, cookies, auth at the Node boundary
- Aggregating multiple backends into one response
- BFF vs “fat client” vs SSR (Next.js)
- BFF responsibility boundaries in the shop track

---

## mock-exams architecture

```text
┌─────────────┐     HTTP      ┌─────────────┐     HTTP      ┌─────────────┐
│ React SPA   │ ────────────► │  Node BFF   │ ────────────► │  FastAPI    │
│  :5173      │   /api/v1/*   │  :3096      │   internal  │  :8090      │
└─────────────┘               └─────────────┘               └─────────────┘
     │                              │
     │  sees only the BFF           │  FASTAPI_URL, API keys
     └──────────────────────────────┘  never enter the bundle
```

React **never** embeds `http://localhost:8090` in the production bundle — only `VITE_BFF_URL=http://localhost:3096`.

---

## Problem 1: CORS and credentials

The browser restricts cross-origin. Calling FastAPI directly from `:5173` requires CORS on Python and exposes the internal host.

BFF:

- One “allowed” origin for the API from the SPA's point of view (or same-origin via nginx later)
- HttpOnly cookies on the BFF domain ([react-intermediate](../react-intermediate/README.md))
- CORS configured once on Express ([25-express-body-cors.md](25-express-body-cors.md))

---

## Problem 2: Hiding infrastructure

DevTools → Network shows every URL. If you see `fastapi.internal.cluster.local` — info for an attacker and UI coupling to backend deploy.

The BFF translates:

```text
GET /api/v1/items  (public contract for the UI)
        ↓
GET http://fastapi:8090/api/v1/items  (private network)
```

When the backend changes, the UI is **not rebuilt** — only BFF routing changes.

---

## Problem 3: Aggregation

A “Dashboard” screen needs items + orders + summary. Without a BFF:

- React makes 3 parallel fetches → 3 loading states, 3 error handlers
- Or overfetching one giant endpoint on FastAPI

With a BFF ([33-proxy-aggregation.md](33-proxy-aggregation.md)):

```javascript
// GET /api/v1/dashboard
const [items, stats] = await Promise.all([
  fetch(`${FASTAPI}/api/v1/items`),
  fetch(`${FASTAPI}/api/v1/stats/summary`),
]);
return { items: await items.json(), stats: await stats.json() };
```

One round-trip browser ↔ Node; Node parallelizes upstream.

---

## Problem 4: Contract adaptation

FastAPI returns `detail` on error; the UI expects `{ error, code }`. The BFF **normalizes**:

```javascript
if (!res.ok) {
  const body = await res.json().catch(() => ({}));
  throw new AppError(body.detail ?? "Upstream error", res.status);
}
```

Same for pagination field names, date formats, hiding internal IDs.

---

## What the BFF should not do

| Not the BFF | Where |
|--------|------|
| Domain business rules (discounts, taxes) | FastAPI / domain service |
| DB persistence | FastAPI + Postgres |
| Heavy batch jobs | Celery / BullMQ |
| HTML SEO rendering | Next.js SSR |

The BFF is **thin** orchestration + auth + adapt; a “fat” BFF is an anti-pattern (duplicating Python logic in JS).

---

## BFF vs API Gateway

| | BFF (per frontend) | API Gateway |
|--|-------------------|-------------|
| Audience | a specific SPA/mobile | all clients |
| Aggregation | for UI screens | generic routing |
| Team | frontend + fullstack | platform |

In enterprise you may have both gateway and BFF; in mock-exams — one Node service for the React shop.

---

## Shop routes in the BFF

Public contract (matches FastAPI paths for simplicity):

| Method | BFF path | Upstream |
|--------|----------|----------|
| GET | `/api/v1/items` | FastAPI items list |
| GET | `/api/v1/items/:id` | FastAPI item |
| POST | `/api/v1/items` | FastAPI create |
| GET | `/health` | local only |

Lab [34-lab-bff.md](34-lab-bff.md) — full proxy.

---

## Auth stub on the BFF

JWT validation can be:

1. On the BFF — validate token, forward `Authorization` upstream
2. On FastAPI — BFF passes through

For the basic course — optional `X-API-Key` on admin routes; JWT — [`nodejs-intermediate`](../javascript-path.md).

---

## Observability

RequestId is generated on the BFF and forwarded to FastAPI ([31-lab-logging.md](31-lab-logging.md)). Support: “give me the requestId” — trace in both logs.

---

## When you can skip a BFF

- Internal tools without a browser (CLI, cron)
- Next.js Route Handlers as a BFF in the same deploy ([`nextjs-basic`](../nextjs-basic/README.md))
- Mobile app with certificate pinning and its own SDK — sometimes a direct API

For a **browser SPA + separate Python API** on the teaching stand, a BFF is justified.

---

## Related courses

- [33-proxy-aggregation.md](33-proxy-aggregation.md) — fetch, timeouts, errors.
- [34-lab-bff.md](34-lab-bff.md) — implementation.
- [35-project-structure.md](35-project-structure.md) — folders.
- [26-lab-express-shop.md](26-lab-express-shop.md) — stub before proxy.
- [`frontend-architecture`](../javascript-path.md) — SPA/BFF theory.

---

## Common mistakes

1. **FastAPI URL in `VITE_*`** — leaks into the bundle; only the BFF URL.

2. **Duplicating validation** on BFF and FastAPI without reason — two places to maintain.

3. **BFF writes to the DB directly** — bypassing the Python domain layer.

4. **No timeout on upstream** — hung workers ([33-proxy-aggregation.md](33-proxy-aggregation.md)).

5. **CORS only on FastAPI** — the browser still hits the BFF first.

6. **One BFF for 10 different UIs** — need separate BFFs or careful modularity.

---

## Summary

A BFF is the layer between React and FastAPI: hides internal URLs, centralizes CORS/auth, aggregates and adapts responses. The browser knows only `:3096`; `FASTAPI_URL` lives on the Node server. Keep the BFF thin — domain logic stays in Python. The mock-exams shop is built around this pattern through the capstone.

---

## Checklist

- Why shouldn't React call `:8090` directly from the browser?
- What is aggregation, using a dashboard as an example?
- Where is FASTAPI_URL stored — browser env or server?
- How does the BFF adapt FastAPI errors for the UI?
- What should the BFF not do in the shop track?
- Why requestId at the BFF boundary?
- When can Next.js replace a separate Node BFF?

Next lesson: [33. Proxy, aggregation, timeouts](33-proxy-aggregation.md).
