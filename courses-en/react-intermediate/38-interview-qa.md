# 38. Interview Q&A: top 40 React Middle+ questions

## Intro: why this chapter

After **react-basic** you can answer questions on hooks and Query. A Middle+ interview adds **auth flow**, error boundaries, MSW, admin patterns, performance trade-offs, client security, and production SPA. This chapter is the **detailed answers** to [interview-cheatsheet.md](interview-cheatsheet.md).

**How to work through it:**

1. Read the question, **cover** the answer, and answer out loud for 1–2 minutes.
2. Compare with the explanation: **why** matters, not just **what**.
3. If you fail one, go back to the lesson listed in "Where in the course".

---

## Block 1. Architecture and the API layer

### 1. How does react-intermediate differ from react-basic in scope?

**Answer.** react-basic is a catalog SPA against FastAPI `:8090`: hooks, Query basics, Router, Context cart. react-intermediate is an **admin SPA** against Django DRF `:8092`: JWT auth + refresh, a typed API client with interceptors, error boundaries, MSW, an admin table (pagination/filters), RHF+Zod forms, optimistic mutations, code splitting, production build. The focus is on **production patterns**, not JSX syntax.

**Where in the course:** [01-landscape.md](01-landscape.md), [README.md](README.md).

---

### 2. Why a separate API layer (`api/client.ts`) if you have TanStack Query?

**Answer.** Query manages the **cache and lifecycle** of server state; `api/client` is the **transport**: base URL, headers (Authorization), JSON parse, `ApiError` with status/body — retry isn't here. A single `api<T>()` function is reused in queryFn, mutations, prefetch, and MSW parity. Without the layer you get duplicated fetch, headers, and error mapping in every hook.

**Where in the course:** [04-api-client.md](04-api-client.md).

---

### 3. How do you type a paginated DRF response?

**Answer.** A generic `Paginated<T>`: `{ count, next, previous, results: T[] }`. The query key includes the filter params. `next`/`previous` are URLs, or the client builds a `page` param. Don't mix the paginated list with the detail type.

**Where in the course:** [05-pagination-filters.md](05-pagination-filters.md), [29-admin-table.md](29-admin-table.md).

---

### 4. Server state vs client state vs UI state — where does each live?

**Answer.** **Server state** (products, categories) — TanStack Query, the API is the source of truth. **Session/auth** — AuthProvider or a secure storage pattern. **Ephemeral UI** (sidebar, selection, modals) — local state or Zustand. **URL-shareable** (filters, page) — `useSearchParams`. Don't duplicate products into Context/Zustand.

**Where in the course:** [06-query-advanced.md](06-query-advanced.md), [33-zustand-ui.md](33-zustand-ui.md).

---

### 5. Feature-based structure — what goes in `features/products`?

**Answer.** A domain slice: components (`ProductRow`, `ProductForm`), hooks (`useProductTableParams`), schemas (Zod), sometimes `api/products.ts` if only the feature uses it. Shared `components/ui`, `api/client`, `pages/` — thin route wrappers. The boundary: a feature doesn't import a sibling feature's internals — go through a public index or the shared layer.

**Where in the course:** [02-architecture.md](02-architecture.md).

---

## Block 2. JWT and authentication

### 6. Access vs refresh token — their roles?

**Answer.** **Access** — short-lived, in the Authorization header for the API. **Refresh** — longer-lived, only for getting a new token pair; not on every request. The trade-off: access has a limited window; refresh is stored more carefully and rotated on the server when used.

**Where in the course:** [08-jwt-basics.md](08-jwt-basics.md).

---

### 7. Where to store the JWT on the client — trade-offs?

**Answer.** **Memory** — an XSS token doesn't persist after the tab closes, but it's lost on refresh. **localStorage** — survives a refresh, but is readable by JS during XSS. **httpOnly cookie** — not accessible to JS, needs a CSRF strategy. A SPA with Bearer often uses memory + a refresh endpoint; the main defense is **no XSS** (CSP, sanitize).

**Where in the course:** [09-token-storage.md](09-token-storage.md), [35-security-client.md](35-security-client.md).

---

### 8. How do you sync auth with TanStack Query?

**Answer.** On login — set the token, `queryClient.invalidateQueries()` or prefetch the user. On logout — `queryClient.clear()`, remove the token, redirect to login. Protected queries: `enabled: isAuthenticated` or a 401 interceptor → refresh → retry. Don't leave stale user data after logout.

**Where in the course:** [10-auth-context.md](10-auth-context.md).

---

### 9. Protected route — how do you implement it?

**Answer.** A layout route wrapper: if `!isAuthenticated` → `<Navigate to="/login" state={{ from: location }} />`. After login, redirect to `from`. Optional role check — hide in the UX + server 403. During auth bootstrap loading — a spinner, not a flash redirect.

**Where in the course:** [11-protected-routes.md](11-protected-routes.md).

---

### 10. Refresh flow on a 401 — outline?

**Answer.** Response interceptor: 401 → if not already refreshing, POST refresh → new access → retry queued requests. Concurrent 401s — a **single-flight** queue. Refresh fails → logout cascade. Race: a mutex/ref flag `isRefreshing`. Don't infinite-loop refresh on a refresh-endpoint failure.

**Where in the course:** [12-refresh-flow.md](12-refresh-flow.md).

---

## Block 3. Error boundaries and error UX

### 11. Error Boundary — what does it catch and what not?

**Answer.** It catches **render** errors in children (a throw in render/lifecycle under a class boundary). **It doesn't catch:** event handlers (use try/catch), async in useEffect, SSR under the same boundaries, or errors in the boundary itself. Async API errors — Query `isError`, not a boundary.

**Where in the course:** [14-error-boundaries.md](14-error-boundaries.md).

---

### 12. Where do you place boundaries in an admin SPA?

**Answer.** **Root** — a last-resort fallback. **Route level** — isolate `/products` vs `/settings` so one crash doesn't take down the whole app. **Not** on every component. A combination: a boundary for render + Query error UI for fetch + a toast for mutations.

**Where in the course:** [15-boundaries-router.md](15-boundaries-router.md).

---

### 13. `useRouteError` vs Error Boundary?

**Answer.** React Router's **route errorElement** / `useRouteError` — errors in loaders/actions, rendering the route module. A class Error Boundary — throws during a React tree render. Admin SPA: router errors for data-loading routes; a boundary for component bugs. Reset keys: `key={location.pathname}` remounts the boundary after navigation.

**Where in the course:** [15-boundaries-router.md](15-boundaries-router.md), [17-lab-errors.md](17-lab-errors.md).

---

### 14. Global error UX — toast vs inline vs modal?

**Answer.** **Inline** — form field errors, a table fetch failure with retry. **Toast** — non-blocking mutation success/failure. **Modal** — an irreversible confirm (delete). Don't use toast-only for blocking errors (the user may not notice). Offline banner — a persistent `role="status"`.

**Where in the course:** [16-global-error-ux.md](16-global-error-ux.md).

---

## Block 4. Performance

### 15. When is `React.memo` justified?

**Answer.** When the Profiler shows **expensive** child re-renders caused by parent state unrelated to the child, and the props can be stabilized. An admin `ProductRow` × 50 on a sidebar toggle — a candidate. Not on every component — comparing props has a cost. State colocation first, then memo.

**Where in the course:** [19-memo-patterns.md](19-memo-patterns.md), [37-profiler.md](37-profiler.md).

---

### 16. Virtualization vs pagination?

**Answer.** **Pagination** — server-side slices, less data, simpler a11y, the default for a DRF admin. **Virtualization** — DOM for visible rows only, needed for long single-page lists (logs). Pagination first; virtualization if the UX requires scrolling 1000+ without pages.

**Where in the course:** [20-virtualization.md](20-virtualization.md), [29-admin-table.md](29-admin-table.md).

---

### 17. Code splitting — what do you lazy-load in an admin?

**Answer.** Routes: edit form, settings, reports — `React.lazy` + `Suspense`. Preload on link hover ([32-prefetch-patterns.md](32-prefetch-patterns.md)). Don't split every button. Balance: initial bundle (login, table) vs a chunk on demand.

**Where in the course:** [21-code-splitting.md](21-code-splitting.md).

---

### 18. `useSuspenseQuery` vs classic `useQuery`?

**Answer.** Suspense — a declarative fallback boundary, no manual `isPending` branch; needs a Suspense tree. Classic — explicit loading in the component. Prefetch + Suspense — the detail opens without a spinner. Errors still go to an ErrorBoundary or errorElement. React 19 + Query v5 support suspense queries.

**Where in the course:** [22-suspense-data.md](22-suspense-data.md).

---

### 19. Prefetch — when and how?

**Answer.** **Intent-based:** hover/focus a link to the detail, the adjacent page+1. `queryClient.prefetchQuery` with the same key/fn as useQuery. Don't prefetch all rows on mount. `staleTime` determines whether a refetch is needed after the prefetch.

**Where in the course:** [32-prefetch-patterns.md](32-prefetch-patterns.md).

---

## Block 5. MSW and API testing

### 20. Why MSW in dev if you have Django :8092?

**Answer.** **Offline dev**, deterministic scenarios (401, 500, slow), parallel frontend work without docker, CI tests without a backend, onboarding. Toggle `VITE_USE_MSW`. Handlers mirror the DRF contract. Don't replace integration tests entirely — smoke against the real API periodically.

**Where in the course:** [24-msw-intro.md](24-msw-intro.md).

---

### 21. MSW handler design — best practices?

**Answer.** Match real URLs and trailing slashes. Use `delay()` for loading states. Scenarios: invalid login, duplicate SKU 400. `onUnhandledRequest: 'bypass'` in dev against the real API for mixed mode. Shared mock data that mutates for CRUD labs.

**Where in the course:** [25-msw-handlers.md](25-msw-handlers.md), [27-lab-msw.md](27-lab-msw.md).

---

### 22. MSW + Query together?

**Answer.** Same `fetch`/client — MSW intercepts the browser network. Query doesn't know mock vs real. Test: render with the worker, assert UI states. Switching the env flag doesn't change application code paths except bootstrapping the worker.

**Where in the course:** [26-msw-query.md](26-msw-query.md).

---

## Block 6. Forms and admin UI

### 23. react-hook-form vs controlled useState forms?

**Answer.** RHF — uncontrolled refs, fewer re-renders on large admin forms. Controlled — OK for small forms. RHF + Zod — the schema = validation + types. `register` for native inputs; `Controller` for custom widgets. Server DRF errors → `setError`.

**Where in the course:** [28-forms-rhf.md](28-forms-rhf.md).

---

### 24. Zod resolver — why, if DRF also validates?

**Answer.** Client validation — instant feedback, fewer round-trips, better UX. The server is authoritative (unique SKU, permissions). Zod doesn't replace the server; duplicate rules are acceptable for critical fields. `z.coerce` for number inputs.

**Where in the course:** [28-forms-rhf.md](28-forms-rhf.md).

---

### 25. Admin table state — URL vs Zustand?

**Answer.** **URL** for page, search, sort, filters — shareable, the back button works. **Zustand/local** for row selection, column visibility prefs. Query cache for server rows. A filter change → reset page to 1.

**Where in the course:** [29-admin-table.md](29-admin-table.md), [33-zustand-ui.md](33-zustand-ui.md).

---

### 26. Optimistic update — steps in TanStack Query?

**Answer.** `onMutate`: cancelQueries, snapshot the cache, setQueryData. `onError`: roll back the snapshot, toast. `onSettled`: invalidate. Update **all** affected keys (list + detail). Not for irreversible/payment flows.

**Where in the course:** [30-optimistic-advanced.md](30-optimistic-advanced.md).

---

## Block 7. Security and production

### 27. XSS in React — is everything safe by default?

**Answer.** Text in JSX is escaped. Risks: `dangerouslySetInnerHTML`, a bad `href`, third-party scripts. Treat the API `description` as untrusted. CSP mitigates injection. JWT in localStorage + XSS = a stolen token.

**Where in the course:** [35-security-client.md](35-security-client.md).

---

### 28. Why can't secrets go in `VITE_*`?

**Answer.** Vite embeds `VITE_*` in the client bundle at build time — visible in `dist/assets/*.js`. Only public config (API URL). Secrets on the server only.

**Where in the course:** [35-security-client.md](35-security-client.md), [36-production-build.md](36-production-build.md).

---

### 29. CSP for a SPA — the key directives?

**Answer.** `default-src 'self'`, `script-src 'self'`, `connect-src` whitelist for the API, `frame-ancestors 'none'`. Blocks injected scripts. Dev may need relaxations; prod tightens. Complements XSS prevention.

**Where in the course:** [35-security-client.md](35-security-client.md).

---

### 30. Production deploy of a Vite SPA — common gotchas?

**Answer.** Wrong `base`/`basename`, opening file://, API still on localhost, no SPA fallback in nginx (`try_files → index.html`), caching index.html too long, MSW left on. Env per mode staging/prod.

**Where in the course:** [36-production-build.md](36-production-build.md).

---

## Block 8. a11y, Zustand, tooling

### 31. Keyboard accessibility of the admin table?

**Answer.** A real `<table>`, `<button>` for sort, visible focus, a skip link, a modal focus trap + Escape, don't rely on hover-only actions. `aria-sort`, pagination `nav aria-label`. Route-change focus management on main.

**Where in the course:** [34-accessibility.md](34-accessibility.md).

---

### 32. Zustand vs Context — when Zustand?

**Answer.** Fine-grained subscriptions without a provider, UI prefs, selection sets. Context for auth/theme is OK with a memoized value. Avoid Zustand for server lists. Selectors prevent whole-store re-renders.

**Where in the course:** [33-zustand-ui.md](33-zustand-ui.md).

---

### 33. React Profiler — workflow?

**Answer.** Record an interaction → ranked/flamegraph → why did it render → fix the root (state placement, stable callbacks) → re-measure. Don't memo blindly. Query devtools for spurious refetches.

**Where in the course:** [37-profiler.md](37-profiler.md), [18-rerender-model.md](18-rerender-model.md).

---

### 34. `keepPreviousData` / placeholderData — UX?

**Answer.** On a page/filter change, show the previous data while fetching — no flash of empty. A subtle `isFetching` indicator. The queryKey must include the params.

**Where in the course:** [06-query-advanced.md](06-query-advanced.md), [29-admin-table.md](29-admin-table.md).

---

## Block 9. System design and senior-ish

### 35. Design an admin SPA for the Django catalog API

**Answer (outline).** Vite+React+TS feature folders. A typed `api/client` with a Bearer interceptor + refresh queue. AuthProvider, protected routes. TanStack Query: paginated products, categories; URL table state. RHF+Zod CRUD. Error boundaries at the route level. MSW for dev. Optimistic toggle optional. nginx static + API proxy. a11y forms/table. Capstone criteria [39-capstone.md](39-capstone.md).

**Where in the course:** [39-capstone.md](39-capstone.md).

---

### 36. How do you handle logout on an expired refresh?

**Answer.** Refresh POST fails 401 → clear tokens, `queryClient.clear()`, redirect `/login?session=expired`, optional toast. Clear sensitive UI immediately. Queued requests reject, don't hang.

**Where in the course:** [12-refresh-flow.md](12-refresh-flow.md).

---

### 37. CORS in dev vs same-origin prod?

**Answer.** Dev: Vite `:5174` → Django `:8092` cross-origin, Django CORS headers. Prod: nginx proxy `/api/` same origin — no CORS. The client uses relative `/api/` or an env URL.

**Where in the course:** [04-api-client.md](04-api-client.md), [36-production-build.md](36-production-build.md).

---

### 38. DRF trailing slash — why does it matter?

**Answer.** Django `APPEND_SLASH` — a POST to `/products` may 301 redirect and lose the body. The client is consistent: `/api/v1/products/`. MSW handlers match the same paths.

**Where in the course:** [07-lab-django-products.md](07-lab-django-products.md), [31-lab-crud.md](31-lab-crud.md).

---

### 39. Testing strategy for the react-intermediate project?

**Answer.** Unit: Zod schema, the mapApiErrors util. MSW integration: login, CRUD flow (Testing Library). E2E Playwright optional against `:8092`. MSW is the default in CI for speed; periodic smoke against the real API. Profiler for manual perf.

**Where in the course:** [27-lab-msw.md](27-lab-msw.md), the javascript-testing path.

---

### 40. What to improve after the capstone for a portfolio?

**Answer.** A production nginx deploy screenshot, a Lighthouse a11y score, a Vitest coverage badge, a README architecture diagram, a demo video login→CRUD. Optional: optimistic UI, role-based routes, Datadog RUM. An honest "known limits" section.

**Where in the course:** [39-capstone.md](39-capstone.md).

---

## After the chapter

1. Go through [interview-cheatsheet.md](interview-cheatsheet.md) **without peeking**.
2. [39-capstone.md](39-capstone.md) — the final project, 8–10 h.
3. Next: [javascript-testing](../javascript-path.md), [nextjs-basic](../javascript-path.md).

---

[← 37-profiler](37-profiler.md) · [39-capstone →](39-capstone.md) · [interview-cheatsheet](interview-cheatsheet.md)
