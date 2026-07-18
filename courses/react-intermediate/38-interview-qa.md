# 38. Interview Q&A: топ-40 вопросов React Middle+

## Введение: зачем эта глава

После **react-basic** вы отвечаете на hooks и Query. На Middle+ собеседовании добавляют **auth flow**, error boundaries, MSW, admin patterns, performance trade-offs, client security и production SPA. Эта глава — **развёрнутые ответы** к [interview-cheatsheet.md](interview-cheatsheet.md).

**Как работать:**

1. Прочитайте вопрос, **закройте** ответ, ответьте вслух 1–2 минуты.
2. Сравните с разбором: важно **почему**, не только **что**.
3. Провал — вернитесь к уроку из «Где в курсе».

---

## Блок 1. Архитектура и API-слой

### 1. Чем react-intermediate отличается от react-basic по scope?

**Ответ.** react-basic — catalog SPA к FastAPI `:8090`: hooks, Query basics, Router, Context cart. react-intermediate — **admin SPA** к Django DRF `:8092`: JWT auth + refresh, typed API client с interceptors, error boundaries, MSW, admin table (pagination/filters), RHF+Zod forms, optimistic mutations, code splitting, production build. Акцент на **production patterns**, не на синтаксис JSX.

**Где в курсе:** [01-landscape.md](01-landscape.md), [README.md](README.md).

---

### 2. Зачем отдельный API-слой (`api/client.ts`), если есть TanStack Query?

**Ответ.** Query управляет **cache и lifecycle** server state; `api/client` — **transport**: base URL, headers (Authorization), JSON parse, `ApiError` с status/body, retry не здесь. Одна функция `api<T>()` переиспользуется в queryFn, mutations, prefetch, MSW parity. Без слоя — дублирование fetch, headers, error mapping в каждом hook.

**Где в курсе:** [04-api-client.md](04-api-client.md).

---

### 3. Как типизировать paginated ответ DRF?

**Ответ.** Generic `Paginated<T>`: `{ count, next, previous, results: T[] }`. Query key включает filter params. `next`/`previous` — URLs или client строит `page` param. Не смешивать paginated list с detail type.

**Где в курсе:** [05-pagination-filters.md](05-pagination-filters.md), [29-admin-table.md](29-admin-table.md).

---

### 4. Server state vs client state vs UI state — где что хранить?

**Ответ.** **Server state** (products, categories) — TanStack Query, source of truth API. **Session/auth** — AuthProvider или secure storage pattern. **UI ephemeral** (sidebar, selection, modals) — local state или Zustand. **URL-shareable** (filters, page) — `useSearchParams`. Не дублировать products в Context/Zustand.

**Где в курсе:** [06-query-advanced.md](06-query-advanced.md), [33-zustand-ui.md](33-zustand-ui.md).

---

### 5. Feature-based structure — что кладёте в `features/products`?

**Ответ.** Domain slice: components (`ProductRow`, `ProductForm`), hooks (`useProductTableParams`), schemas (Zod), иногда `api/products.ts` если только feature использует. Shared `components/ui`, `api/client`, `pages/` — thin route wrappers. Граница: feature не import sibling feature internals — через public index или shared layer.

**Где в курсе:** [02-architecture.md](02-architecture.md).

---

## Блок 2. JWT и аутентификация

### 6. Access vs refresh token — роли?

**Ответ.** **Access** — короткоживущий, в Authorization header для API. **Refresh** — длиннее, только для получения новой пары tokens; не на каждый request. Компромисс access — ограниченное окно; refresh хранят осторожнее, rotate на server при использовании.

**Где в курсе:** [08-jwt-basics.md](08-jwt-basics.md).

---

### 7. Где хранить JWT на клиенте — trade-offs?

**Ответ.** **Memory** — XSS не persist после tab close, но lost on refresh. **localStorage** — переживает refresh, но читается JS при XSS. **httpOnly cookie** — не доступен JS, нужен CSRF strategy. SPA с Bearer часто memory + refresh endpoint; главная защита — **нет XSS** (CSP, sanitize).

**Где в курсе:** [09-token-storage.md](09-token-storage.md), [35-security-client.md](35-security-client.md).

---

### 8. Как синхронизировать auth с TanStack Query?

**Ответ.** На login — set token, `queryClient.invalidateQueries()` или prefetch user. На logout — `queryClient.clear()`, remove token, redirect login. Protected queries: `enabled: isAuthenticated` или 401 interceptor → refresh → retry. Не оставлять stale user data после logout.

**Где в курсе:** [10-auth-context.md](10-auth-context.md).

---

### 9. Protected route — как реализовать?

**Ответ.** Layout route wrapper: if `!isAuthenticated` → `<Navigate to="/login" state={{ from: location }} />`. После login redirect на `from`. Optional role check — UX hide + server 403. Loading auth bootstrap — spinner, не flash redirect.

**Где в курсе:** [11-protected-routes.md](11-protected-routes.md).

---

### 10. Refresh flow при 401 — outline?

**Ответ.** Response interceptor: 401 → if not already refreshing, POST refresh → new access → retry queued requests. Concurrent 401s — **single flight** queue. Refresh fails → logout cascade. Race: mutex/ref flag `isRefreshing`. Не infinite loop refresh on refresh endpoint failure.

**Где в курсе:** [12-refresh-flow.md](12-refresh-flow.md).

---

## Блок 3. Error boundaries и UX ошибок

### 11. Error Boundary — что ловит и что нет?

**Ответ.** Ловит **render** errors в children (throw в render/lifecycle class boundary). **Не ловит:** event handlers (try/catch), async в useEffect, SSR same boundaries, errors в самом boundary. Async API errors — Query `isError`, не boundary.

**Где в курсе:** [14-error-boundaries.md](14-error-boundaries.md).

---

### 12. Где ставить boundaries в admin SPA?

**Ответ.** **Root** — last resort fallback. **Route level** — изолировать `/products` vs `/settings` чтобы один crash не убил всё app. **Не** на каждый component. Комбинация: boundary для render + Query error UI для fetch + toast для mutation.

**Где в курсе:** [15-boundaries-router.md](15-boundaries-router.md).

---

### 13. `useRouteError` vs Error Boundary?

**Ответ.** React Router **route errorElement** / `useRouteError` — errors в loaders/actions, render route module. Class Error Boundary — React tree render throws. Admin SPA: router errors для data loading routes; boundary для component bugs. Reset keys: `key={location.pathname}` remount boundary after navigation.

**Где в курсе:** [15-boundaries-router.md](15-boundaries-router.md), [17-lab-errors.md](17-lab-errors.md).

---

### 14. Global error UX — toast vs inline vs modal?

**Ответ.** **Inline** — form field errors, table fetch failure с retry. **Toast** — mutation success/failure non-blocking. **Modal** — irreversible confirm (delete). Не toast-only для blocking errors (user может не заметить). Offline banner — persistent `role="status"`.

**Где в курсе:** [16-global-error-ux.md](16-global-error-ux.md).

---

## Блок 4. Performance

### 15. Когда `React.memo` оправдан?

**Ответ.** Когда Profiler показывает **дорогие** child re-renders от parent state unrelated to child, и props можно стабилизировать. Admin `ProductRow` × 50 при sidebar toggle — candidate. Не на каждый component — cost сравнения props. Сначала state colocation, потом memo.

**Где в курсе:** [19-memo-patterns.md](19-memo-patterns.md), [37-profiler.md](37-profiler.md).

---

### 16. Virtualization vs pagination?

**Ответ.** **Pagination** — server-side slices, меньше data, проще a11y, default для admin DRF. **Virtualization** — DOM только visible rows, нужен при long single-page lists (logs). Сначала pagination; virtualization если UX требует scroll 1000+ без pages.

**Где в курсе:** [20-virtualization.md](20-virtualization.md), [29-admin-table.md](29-admin-table.md).

---

### 17. Code splitting — что lazy-load в admin?

**Ответ.** Routes: edit form, settings, reports — `React.lazy` + `Suspense`. Preload on hover link ([32-prefetch-patterns.md](32-prefetch-patterns.md)). Не split каждый button. Balance: initial bundle (login, table) vs chunk on demand.

**Где в курсе:** [21-code-splitting.md](21-code-splitting.md).

---

### 18. `useSuspenseQuery` vs classic `useQuery`?

**Ответ.** Suspense — declarative fallback boundary, no manual `isPending` branch; needs Suspense tree. Classic — explicit loading in component. Prefetch + Suspense — detail opens without spinner. Error still ErrorBoundary or errorElement. React 19 + Query v5 support suspense queries.

**Где в курсе:** [22-suspense-data.md](22-suspense-data.md).

---

### 19. Prefetch — когда и как?

**Ответ.** **Intent-based:** hover/focus link to detail, adjacent page+1. `queryClient.prefetchQuery` same key/fn as useQuery. Не prefetch all rows on mount. `staleTime` определяет нужен ли refetch после prefetch.

**Где в курсе:** [32-prefetch-patterns.md](32-prefetch-patterns.md).

---

## Блок 5. MSW и тестирование API

### 20. Зачем MSW в dev, если есть Django :8092?

**Ответ.** **Offline dev**, deterministic scenarios (401, 500, slow), parallel frontend без docker, CI tests без backend, onboarding. Toggle `VITE_USE_MSW`. Handlers mirror DRF contract. Не replace integration tests entirely — smoke against real API периодически.

**Где в курсе:** [24-msw-intro.md](24-msw-intro.md).

---

### 21. MSW handler design — best practices?

**Ответ.** Match real URLs and trailing slashes. Use `delay()` для loading states. Scenarios: login invalid, duplicate SKU 400. `onUnhandledRequest: 'bypass'` в dev к real API для mixed mode. Shared mock data mutating для CRUD labs.

**Где в курсе:** [25-msw-handlers.md](25-msw-handlers.md), [27-lab-msw.md](27-lab-msw.md).

---

### 22. MSW + Query together?

**Ответ.** Same `fetch`/client — MSW intercepts browser network. Query не знает mock vs real. Test: render with worker, assert UI states. Switch env flag не меняет application code paths except bootstrap worker.

**Где в курсе:** [26-msw-query.md](26-msw-query.md).

---

## Блок 6. Forms и admin UI

### 23. react-hook-form vs controlled useState forms?

**Ответ.** RHF — uncontrolled refs, меньше re-renders на больших admin forms. Controlled — OK малые forms. RHF + Zod — schema = validation + types. `register` native inputs; `Controller` custom widgets. Server DRF errors → `setError`.

**Где в курсе:** [28-forms-rhf.md](28-forms-rhf.md).

---

### 24. Zod resolver — зачем, если DRF тоже валидирует?

**Ответ.** Client validation — instant feedback, меньше round-trips, better UX. Server — authoritative (unique SKU, permissions). Zod не заменяет server; duplicate rules acceptable for critical fields. `z.coerce` для number inputs.

**Где в курсе:** [28-forms-rhf.md](28-forms-rhf.md).

---

### 25. Admin table state — URL vs Zustand?

**Ответ.** **URL** для page, search, sort, filters — shareable, back button works. **Zustand/local** для row selection, column visibility prefs. Query cache для server rows. Смена filter → reset page to 1.

**Где в курсе:** [29-admin-table.md](29-admin-table.md), [33-zustand-ui.md](33-zustand-ui.md).

---

### 26. Optimistic update — steps in TanStack Query?

**Ответ.** `onMutate`: cancelQueries, snapshot cache, setQueryData. `onError`: rollback snapshot, toast. `onSettled`: invalidate. Update **all** affected keys (list + detail). Не для irreversible/payment flows.

**Где в курсе:** [30-optimistic-advanced.md](30-optimistic-advanced.md).

---

## Блок 7. Безопасность и production

### 27. XSS в React — всё ли safe по умолчанию?

**Ответ.** Text in JSX escaped. Risk: `dangerouslySetInnerHTML`, bad `href`, third-party scripts. Treat API `description` as untrusted. CSP mitigates injection. JWT in localStorage + XSS = steal token.

**Где в курсе:** [35-security-client.md](35-security-client.md).

---

### 28. Почему secrets нельзя в `VITE_*`?

**Ответ.** Vite embeds `VITE_*` in client bundle at build time — visible in `dist/assets/*.js`. Only public config (API URL). Secrets on server only.

**Где в курсе:** [35-security-client.md](35-security-client.md), [36-production-build.md](36-production-build.md).

---

### 29. CSP для SPA — ключевые directives?

**Ответ.** `default-src 'self'`, `script-src 'self'`, `connect-src` whitelist API, `frame-ancestors 'none'`. Blocks injected scripts. Dev may need relaxations; prod tighten. Complement XSS prevention.

**Где в курсе:** [35-security-client.md](35-security-client.md).

---

### 30. Production deploy Vite SPA — типичные грабли?

**Ответ.** Wrong `base`/`basename`, opening file://, API still localhost, no SPA fallback in nginx (`try_files → index.html`), caching index.html too long, MSW left on. Env per mode staging/prod.

**Где в курсе:** [36-production-build.md](36-production-build.md).

---

## Блок 8. a11y, Zustand, tooling

### 31. Keyboard accessibility admin table?

**Ответ.** Real `<table>`, `<button>` for sort, focus visible, skip link, modal focus trap + Escape, don't rely hover-only actions. `aria-sort`, pagination `nav aria-label`. Route change focus management on main.

**Где в курсе:** [34-accessibility.md](34-accessibility.md).

---

### 32. Zustand vs Context — когда Zustand?

**Ответ.** Fine-grained subscriptions без provider, UI prefs, selection sets. Context для auth/theme OK with memo value. Avoid Zustand for server lists. Selectors prevent whole-store re-render.

**Где в курсе:** [33-zustand-ui.md](33-zustand-ui.md).

---

### 33. React Profiler — workflow?

**Ответ.** Record interaction → ranked/flamegraph → why render → fix root (state placement, stable callbacks) → re-measure. Don't memo blindly. Query devtools for spurious refetch.

**Где в курсе:** [37-profiler.md](37-profiler.md), [18-rerender-model.md](18-rerender-model.md).

---

### 34. `keepPreviousData` / placeholderData — UX?

**Ответ.** При смене page/filter показываем previous data while fetching — no flash empty. Subtle `isFetching` indicator. queryKey must include params.

**Где в курсе:** [06-query-advanced.md](06-query-advanced.md), [29-admin-table.md](29-admin-table.md).

---

## Блок 9. System design и senior-ish

### 35. Спроектируйте admin SPA для Django catalog API

**Ответ (outline).** Vite+React+TS feature folders. Typed `api/client` Bearer interceptor + refresh queue. AuthProvider, protected routes. TanStack Query: paginated products, categories; URL table state. RHF+Zod CRUD. Error boundaries route-level. MSW for dev. Optimistic toggle optional. nginx static + API proxy. a11y forms/table. Capstone criteria [39-capstone.md](39-capstone.md).

**Где в курсе:** [39-capstone.md](39-capstone.md).

---

### 36. Как обработать logout при expired refresh?

**Ответ.** Refresh POST fails 401 → clear tokens, `queryClient.clear()`, redirect `/login?session=expired`, optional toast. Clear sensitive UI immediately. Queued requests reject, не hang.

**Где в курсе:** [12-refresh-flow.md](12-refresh-flow.md).

---

### 37. CORS в dev vs same-origin prod?

**Ответ.** Dev: Vite `:5174` → Django `:8092` cross-origin, Django CORS headers. Prod: nginx proxy `/api/` same origin — no CORS. Client uses relative `/api/` or env URL.

**Где в курсе:** [04-api-client.md](04-api-client.md), [36-production-build.md](36-production-build.md).

---

### 38. DRF trailing slash — почему matters?

**Ответ.** Django `APPEND_SLASH` — POST `/products` may 301 redirect losing body. Client consistent `/api/v1/products/`. MSW handlers match same paths.

**Где в курсе:** [07-lab-django-products.md](07-lab-django-products.md), [31-lab-crud.md](31-lab-crud.md).

---

### 39. Testing strategy react-intermediate project?

**Ответ.** Unit: Zod schema, utils mapApiErrors. MSW integration: login, CRUD flow (Testing Library). E2E Playwright optional against `:8092`. MSW default in CI for speed; periodic smoke real API. Profiler manual perf.

**Где в курсе:** [27-lab-msw.md](27-lab-msw.md), javascript-testing path.

---

### 40. Что улучшить после capstone для portfolio?

**Ответ.** Production nginx deploy screenshot, Lighthouse a11y score, Vitest coverage badge, README architecture diagram, demo video login→CRUD. Optional: optimistic UI, role-based routes, Datadog RUM. Honest «known limits» section.

**Где в курсе:** [39-capstone.md](39-capstone.md).

---

## После главы

1. Пройдите [interview-cheatsheet.md](interview-cheatsheet.md) **без подглядывания**.
2. [39-capstone.md](39-capstone.md) — финальный проект 8–10 ч.
3. Дальше: [javascript-testing](../javascript-path.md), [nextjs-basic](../javascript-path.md).

---

[← 37-profiler](37-profiler.md) · [39-capstone →](39-capstone.md) · [interview-cheatsheet](interview-cheatsheet.md)
