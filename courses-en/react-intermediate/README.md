# React — Intermediate

An in-depth Middle+ level **React** course: JWT auth with refresh, error boundaries, performance, code splitting, **MSW** for API mocking, admin tables, and CRUD against Django DRF [`deploy/django`](../../deploy/django/README.md) `:8092`. **40 lessons** + capstone + interview cheatsheet.

> Start of the JS path: [`javascript-path.md`](../javascript-path.md). **Required** — [`react-basic`](../react-basic/README.md) (capstone [38-capstone](../react-basic/38-capstone.md) or an equivalent SPA). Recommended: [`typescript-basic`](../typescript-basic/README.md).

**Prerequisites:** Node.js **LTS** (20 or 22), solid React basics (hooks, Query, Router, Context), TypeScript (generics, Zod).

**Locally:** Vite + React in [`examples/`](examples/package.json). Django backend — from chapter 07, MSW — from chapter 24 (can be earlier for the auth labs).

```bash
cd courses/react-intermediate/examples
npm install
npm run dev          # http://localhost:5174
# in another terminal — Django stand :8092 (see deploy/django)
```

## How to read the chapters

Each lesson is a **full textbook chapter**, not a cheat sheet. The author leads from a **real-world scenario** (a ticket, an incident, a code review) to concepts, code, and common mistakes — as in [react-basic](../react-basic/README.md) and [javascript-basic](../javascript-basic/README.md).

1. **Theory** — "Real-world scenario" → explanation → examples → "Common mistakes" → "Checklist". Reinforce the checklist **in your own words** before the lab.
2. **Lab** — hands-on in [`examples/`](examples/package.json): edits in `src/`, success criteria. The lab **continues the storyline** of the theory.
3. After block 38 — [`interview-cheatsheet.md`](interview-cheatsheet.md) **without peeking** at the chapters.
4. [39-capstone.md](39-capstone.md) — **8–10 hours**, Admin SPA against Django `:8092`.

**Time:** **~50–70 minutes** per "theory + lab" pair. The whole course — **~18–22 hours**; capstone separately.

## Curriculum (40 lessons)

### Phase 1. Bridge from react-basic (00–03)

| # | Lesson |
|---|------|
| 00 | [Environment: extending the project, MSW, dependencies](00-environment.md) |
| 01 | [Middle+ landscape: server state, auth, production SPA](01-landscape.md) |
| 02 | [Architecture: features, layers, module boundaries](02-architecture.md) |
| 03 | [Lab: Admin SPA skeleton](03-lab-scaffold.md) |

### Phase 2. API layer and Django (04–07)

| 04 | [Typed API client: interceptors, ApiError](04-api-client.md) |
| 05 | [Pagination, filters, the DRF contract](05-pagination-filters.md) |
| 06 | [TanStack Query: infinite, prefetch, keepPreviousData](06-query-advanced.md) |
| 07 | [Lab: products with Django :8092](07-lab-django-products.md) |

### Phase 3. Authentication (08–13)

| 08 | [JWT: access, refresh, claims, lifetime](08-jwt-basics.md) |
| 09 | [Token storage: memory, localStorage, cookies](09-token-storage.md) |
| 10 | [AuthProvider, useAuth, syncing with Query](10-auth-context.md) |
| 11 | [Protected routes, roles, redirect after login](11-protected-routes.md) |
| 12 | [Refresh flow: queue, race, logout cascade](12-refresh-flow.md) |
| 13 | [Lab: login and a guarded section](13-lab-auth.md) |

### Phase 4. Error handling (14–17)

| 14 | [Error boundaries: what they catch and what they don't](14-error-boundaries.md) |
| 15 | [Boundaries + Router + Query error reset](15-boundaries-router.md) |
| 16 | [Global error UX: toasts, retry, offline](16-global-error-ux.md) |
| 17 | [Lab: fallback UI and route errors](17-lab-errors.md) |

### Phase 5. Performance (18–23)

| 18 | [Re-render: mental model and React DevTools](18-rerender-model.md) |
| 19 | [`memo`, `useMemo`, `useCallback` without fanaticism](19-memo-patterns.md) |
| 20 | [Virtualizing long lists](20-virtualization.md) |
| 21 | [Code splitting: `lazy`, `Suspense`, preload](21-code-splitting.md) |
| 22 | [Suspense for data: `useSuspenseQuery`](22-suspense-data.md) |
| 23 | [Lab: optimizing the catalog](23-lab-performance.md) |

### Phase 6. MSW and API isolation (24–27)

| 24 | [MSW: why mock the API in dev and tests](24-msw-intro.md) |
| 25 | [Handlers, scenarios, delays and errors](25-msw-handlers.md) |
| 26 | [MSW + Query + switching real/mock](26-msw-query.md) |
| 27 | [Lab: mock auth and products](27-lab-msw.md) |

### Phase 7. Forms and admin UI (28–31)

| 28 | [react-hook-form + Zod resolver](28-forms-rhf.md) |
| 29 | [Admin table: sort, filter, bulk actions](29-admin-table.md) |
| 30 | [Optimistic UI and rollback in mutations](30-optimistic-advanced.md) |
| 31 | [Lab: CRUD product](31-lab-crud.md) |

### Phase 8. Advanced patterns (32–34)

| 32 | [Prefetch, stale-while-revalidate, background sync](32-prefetch-patterns.md) |
| 33 | [Zustand for UI state (overview)](33-zustand-ui.md) |
| 34 | [Accessibility in admin: focus, aria, keyboard](34-accessibility.md) |

### Phase 9. Security and build (35–36)

| 35 | [XSS, CSP, secrets on the client](35-security-client.md) |
| 36 | [Production build, env, preview nginx](36-production-build.md) |

### Phase 10. Finale (37–39)

| 37 | [Profiler, why-did-you-render, metrics](37-profiler.md) |
| 38 | [Interview Q&A (top 40)](38-interview-qa.md) |
| 39 | [Capstone: Django Catalog Admin SPA](39-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## What you should end up with

- You design a **feature-based** structure for an admin SPA with a typed API layer.
- You implement **JWT auth**: login, refresh, protected routes, logout cascade.
- You catch **render errors** with error boundaries; you don't confuse them with async/event errors.
- You optimize **perf** deliberately: virtualization, code splitting, no premature memo.
- You mock the **Django API** through MSW for dev and future tests.
- You build an **admin table** with pagination, filters, and CRUD through react-hook-form.
- You integrate with **Django DRF :8092** (products, categories).
- You understand **client-side security** and the Vite production build.

## Related courses

| Course | Relation |
|------|-------|
| [`react-basic`](../react-basic/README.md) | hooks, Query, Router — prerequisite |
| [`typescript-basic`](../typescript-basic/README.md) | Zod, generics, strict |
| [`django`](../../deploy/django/README.md) | DRF API `:8092`, admin domain |
| [`fastapi`](../../deploy/fastapi/README.md) | API comparison, CORS |
| [`api-design`](../api-design/README.md) | REST, pagination, statuses |
| [`javascript-testing`](../javascript-path.md) | MSW, Testing Library, Playwright |
| [`nodejs-intermediate`](../javascript-path.md) | JWT on a BFF, refresh endpoint |

## Examples

| Path | Purpose |
|------|------------|
| [`examples/package.json`](examples/package.json) | Vite, React 19, MSW, RHF, Zustand |
| [`examples/src/`](examples/src/) | starter code for the labs |
| [`examples/solutions/`](examples/solutions/) | reference solutions (after your own attempt) |
