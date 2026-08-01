# 01. Middle+ landscape: server state, auth, production SPA

## A scenario from work

Kick-off for react-intermediate. The product owner says: "We need a **catalog admin panel** — the same products as in Django, but with UX like Notion: filters, bulk edit, no page reloads." The backend lead says: "DRF already returns paginated JSON on :8092, JWT via simplejwt." Coming from react-basic, you're used to the **public** shop SPA on FastAPI :8090 — a read-only catalog, cart in Context, no login.

A Middle+ SPA is a different class of problem: **authenticated** routes, **token refresh**, error boundaries in prod, code splitting, admin tables with thousands of rows. At grooming, a junior suggests "just put the JWT in localStorage and call it done" — security review blocks it. This lesson is the map of the territory before [02-architecture.md](02-architecture.md) and the auth block, lessons 08–13.

## What you'll learn

- How an **admin SPA** differs from react-basic's shop SPA.
- Three layers of state: **server**, **URL**, and **UI/client**.
- Why the client needs a **JWT** and what the frontend doesn't solve.
- Production concerns: errors, perf, security, mocks.
- How Django :8092, FastAPI :8090, and MSW relate.

---

## Evolution: react-basic → react-intermediate

```text
react-basic (shop)
  ├── public catalog
  ├── fetch / TanStack Query → FastAPI :8090
  ├── Router, Context (cart, theme)
  └── capstone: CRUD items, no auth

react-intermediate (admin)
  ├── login + protected routes
  ├── Query → Django DRF :8092 (+ MSW)
  ├── typed API client + interceptors
  ├── error boundaries, perf, code splitting
  └── capstone: full Catalog Admin SPA
```

| Aspect | react-basic | react-intermediate |
|--------|-------------|-------------------|
| Auth | none | JWT access + refresh |
| API | FastAPI items | Django products, categories |
| Forms | controlled inputs | react-hook-form + Zod |
| Render errors | white screen | error boundaries |
| Dev without an API | needs :8090 | MSW + optionally :8092 |
| Roles | — | admin / staff (DRF permissions) |

---

## Server state vs client state vs URL state

From [20-tanstack-query.md](../react-basic/20-tanstack-query.md): **server state** lives on the backend, the client just **caches** it via Query. In the admin SPA, server state means products, categories, orders; **Django is the source of truth**.

**Client state** is whatever isn't in the API: sidebar open, a modal, a draft form before submit. Tools: `useState`, Context ([29-context.md](../react-basic/29-context.md)), and later Zustand ([33-zustand-ui.md](33-zustand-ui.md)).

**URL state** is shareable UI: page, filter, sort ([26-url-state.md](../react-basic/26-url-state.md)). In an admin table, `?page=2&category=peripherals&ordering=-price` should open the exact same view for a coworker.

```text
┌─────────────────────────────────────────┐
│  Browser URL (?page, ?q, ?category)     │
├─────────────────────────────────────────┤
│  React UI (tables, forms, layout)       │
├─────────────────────────────────────────┤
│  TanStack Query cache (products, user)  │
├─────────────────────────────────────────┤
│  Auth layer (access token in memory)    │
├─────────────────────────────────────────┤
│  HTTP → /api → Django :8092 or MSW      │
└─────────────────────────────────────────┘
```

**Anti-pattern:** duplicating the entire products list into Zustand "permanently" — Query already keeps it in sync with the API.

---

## JWT in the SPA architecture

Django DRF issues an **access** token (short-lived, ~5–15 min) and a **refresh** token (longer-lived). Access goes into `Authorization: Bearer …` on every request. The SPA does **not** store the password after login — only tokens plus a user snapshot.

```text
Login form  →  POST /api/v1/auth/login/
           ←  { access, refresh, user }

GET /products/  →  Header: Authorization: Bearer <access>
               ←  200 + JSON

Access expired  →  POST /api/v1/auth/refresh/  { refresh }
               ←  { access }

Refresh invalid  →  401  →  logout, redirect /login
```

Storage details — [09-token-storage.md](09-token-storage.md); refresh queue — [12-refresh-flow.md](12-refresh-flow.md). Mock login: `admin@shop.local` / `admin` in [`handlers.ts`](examples/src/mocks/handlers.ts).

**The client doesn't "protect" the API** — it only handles UX. Django checks permissions. XSS plus a token in localStorage is a real risk ([35-security-client.md](35-security-client.md)).

---

## Django DRF vs FastAPI: what changes on the frontend

Both are REST JSON. Contract differences you'll run into:

| | FastAPI :8090 (react-basic) | Django DRF :8092 |
|---|----------------------------|------------------|
| List response | often a plain `Item[]` array | **paginated** `{ count, next, previous, results }` |
| Trailing slash | optional | often **required**, `/products/` |
| Auth | none in basic | JWT via simplejwt |
| Errors | `{ detail }` | `{ detail }` or field errors |
| Admin domain | items | products, categories |

Pagination and filters — [05-pagination-filters.md](05-pagination-filters.md). Typed client — [04-api-client.md](04-api-client.md).

---

## Production SPA: what gets added once "it works locally"

1. **Error boundaries** — one widget crashing shouldn't take down the whole app ([14-error-boundaries.md](14-error-boundaries.md)).
2. **Code splitting** — admin routes load lazily ([21-code-splitting.md](21-code-splitting.md)).
3. **Perf** — virtualizing long tables ([20-virtualization.md](20-virtualization.md)); memo without going overboard ([19-memo-patterns.md](19-memo-patterns.md)).
4. **Global error UX** — toasts, retry, offline ([16-global-error-ux.md](16-global-error-ux.md)).
5. **MSW** — dev and tests without flaky network calls ([24-msw-intro.md](24-msw-intro.md)).
6. **Build + env** — `VITE_*`, nginx preview ([36-production-build.md](36-production-build.md)).

react-basic laid the groundwork with Query and Router; intermediate is about the SPA's **operational maturity**.

---

## Feature-based admin: preview

The structure from [35-project-structure.md](../react-basic/35-project-structure.md) scales up like this:

```text
src/
  app/           # providers, routes
  features/
    auth/        # login, useAuth
    products/    # table, filters, hooks
  api/           # client, types
  components/ui/ # Button, Spinner — shared
```

Full breakdown — [02-architecture.md](02-architecture.md). Scaffold lab — [03-lab-scaffold.md](03-lab-scaffold.md).

---

## MSW across the development lifecycle

```text
Day 1–3:   VITE_ENABLE_MSW=true  →  UI without Django
Day 4+:    Django :8092 up       →  integration
CI:        MSW in Vitest          →  javascript-testing
```

Handlers mirror the **shape** of DRF responses — fewer surprises when switching over to the real API ([07-lab-django-products.md](07-lab-django-products.md)).

---

## Mental model for code review

Questions a Middle+ dev should be able to answer:

- Where do products live after fetching — Query cache or useState?
- What happens on a 401 for a protected route?
- Why does `queryKey` include page and filters?
- Does an error boundary catch an error thrown inside `useQuery`?
- Where is the access token stored, and why?

The answers are spread across lessons 04–17.

---

## A typical day building the admin SPA

```text
09:00  git pull, npm run dev (:5174), VITE_ENABLE_MSW=true — UI with no Django
10:00  Ticket: filter by category → URL + queryKey ([05-pagination-filters.md](05-pagination-filters.md))
12:00  Backend pod :8092 up → switch to the real API ([07-lab-django-products.md](07-lab-django-products.md))
14:00  Code review on the auth PR → tokenStore, ProtectedRoute ([09-token-storage.md](09-token-storage.md)–[11-protected-routes.md](11-protected-routes.md))
16:00  QA: refresh after 15 min idle → refresh queue ([12-refresh-flow.md](12-refresh-flow.md))
```

That's the course's **end-to-end** flow: data layer first, then auth, then resilience (boundaries, perf). You don't have to follow the sprints in lockstep, but the order of lessons 00–13 reflects real dependencies.

---

## How this connects to other courses

| Resource | Connection |
|--------|-------|
| [react-basic/README](../react-basic/README.md) | hooks, Query, Router |
| [api-design](../api-design/README.md) | REST, status codes, pagination |
| [`deploy/django`](../../deploy/django/README.md) | admin domain backend |
| [`deploy/fastapi`](../../deploy/fastapi/README.md) | client comparison |
| [javascript-path.md](../javascript-path.md) | where react-intermediate fits in the track |

---

## Common mistakes

1. **"Auth on the frontend means security"** — it's UX only; the backend must enforce JWT and permissions.

2. **Copying react-basic's examples into intermediate** — different port, proxy, API domain.

3. **Putting everything in Context** — fine for cart/theme; the catalog belongs in Query.

4. **Ignoring DRF's trailing slash** — 301/404 on `/products` vs `/products/`.

5. **Confusing MSW with the backend** — mocks don't replace integration tests against :8092.

6. **Memoizing the whole tree right away** — without profiling first ([18-rerender-model.md](18-rerender-model.md)).

---

## Checklist

- [ ] You can explain the difference between the shop SPA and the admin SPA
- [ ] You separate server / URL / client state
- [ ] You understand the role of access and refresh JWTs (at a high level)
- [ ] You know why DRF paginates instead of returning a plain array
- [ ] You can see where MSW, boundaries, and code splitting fit in the course
- [ ] You're ready for [02-architecture.md](02-architecture.md)

## Next

Next lesson: [02. Architecture: features, layers, module boundaries](02-architecture.md).
