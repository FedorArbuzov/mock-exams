# 24. MSW: why mock the API in dev and tests

## A scenario from work

A new developer clones the admin SPA — Django `:8092` isn't running. `npm run dev` → login fails, products is empty, QA is blocked. Senior dev: "Set up MSW — mock the API in the browser, one `npm run dev` and you're done." In parallel, [javascript-testing](../javascript-path.md) uses the same handlers for Vitest, without a backend.

After the auth labs ([13-lab-auth.md](13-lab-auth.md)) and Django products ([07-lab-django-products.md](07-lab-django-products.md)), MSW gives you a real/mock **switch** and error scenarios ([25-msw-handlers.md](25-msw-handlers.md)).

[`examples/`](examples/package.json) already has MSW v2 installed, plus starter files [`handlers.ts`](examples/src/mocks/handlers.ts) and [`browser.ts`](examples/src/mocks/browser.ts).

## What you'll learn

- Mock Service Worker architecture: Service Worker vs node
- Why MSW beats a hardcoded `if (DEV)`
- MSW v2 setup in a Vite SPA
- The `public/` worker directory
- Dev vs test vs production
- How it ties into the Django DRF contract ([04-api-client.md](04-api-client.md))

---

## The problem without MSW

```tsx
// Anti-pattern
const products = import.meta.env.DEV ? MOCK_PRODUCTS : await fetch(...);
```

The contract gets duplicated, prod code paths never get tested, and CORS/env setup diverges from [react-basic: fetch](../react-basic/17-fetch-react.md).

MSW intercepts the **real** `fetch` in the browser — the app has no idea it's talking to a mock.

---

## How MSW v2 works

```text
React app → fetch("/api/v1/products/")
                │
                ▼
         Service Worker (mockServiceWorker.js)
                │
      match handler? ──yes──► HttpResponse.json(...)
                │
               no
                │
                ▼
         real network (Django :8092)
```

**Browser:** `setupWorker` from `msw/browser`.
**Tests (Node):** `setupServer` from `msw/node` — covered later, in javascript-testing.

Handlers are declarative: `http.get`, `http.post`, `HttpResponse`, `delay`.

---

## Structure in examples

```text
examples/
  public/
    mockServiceWorker.js   # npx msw init public
  src/
    mocks/
      handlers.ts          # route handlers
      browser.ts           # setupWorker
    main.tsx               # conditional start
```

[`handlers.ts`](examples/src/mocks/handlers.ts) already contains:

- `GET /api/v1/products/` — paginated DRF shape
- `POST /api/v1/auth/login/` — mock JWT

---

## Initializing the worker

```bash
cd courses/react-intermediate/examples
npx msw init public --save
```

`package.json`:

```json
"msw": {
  "workerDirectory": ["public"]
}
```

---

## browser.ts

```tsx
// src/mocks/browser.ts
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
```

---

## Starting it in main.tsx

```tsx
// src/main.tsx
async function enableMocking() {
  if (!import.meta.env.DEV) {
    return;
  }

  const useMock = import.meta.env.VITE_USE_MSW !== "false";

  if (!useMock) {
    return;
  }

  const { worker } = await import("./mocks/browser");
  await worker.start({
    onUnhandledRequest: "warn",
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
});
```

**`onUnhandledRequest: "warn"`** — shows forgotten endpoints in the console. `"bypass"` — passes through to the real API (mixed mode).

---

## Env switch

`.env.development`:

```env
VITE_USE_MSW=true
VITE_API_BASE=
```

`.env.development.local` (gitignored):

```env
VITE_USE_MSW=false
```

With `false`, fetch goes through the Vite proxy → Django `:8092` ([00-environment.md](00-environment.md)).

`vite.config.ts` proxy:

```ts
server: {
  port: 5174,
  proxy: {
    "/api": {
      target: "http://localhost:8092",
      changeOrigin: true,
    },
  },
},
```

---

## MSW vs json-server vs Mirage

| | MSW | Dedicated mock server |
|---|-----|----------------------|
| Same fetch code | yes | yes |
| Offline dev | yes | needs a running process |
| Tests reuse handlers | yes | harder |
| Service Worker caveats | yes | no |

MSW is the industry standard for React ([javascript-testing](../javascript-path.md)).

---

## Service Worker caveats

1. **HTTPS / localhost only** — fine for Vite dev.
2. **First load** — worker registration is async; `enableMocking().then(render)` is required.
3. **Stale cached worker** — hard refresh or unregister it in the DevTools Application tab.
4. **Not for production** — guard it with `import.meta.env.DEV` or an explicit flag.

---

## DRF contract

Handlers need to mirror the real API ([05-pagination-filters.md](05-pagination-filters.md)):

```tsx
HttpResponse.json({
  count: 2,
  next: null,
  previous: null,
  results: [...],
});
```

Otherwise the typed client ([04-api-client.md](04-api-client.md)) and the Zod parse break in mock mode.

---

## Auth mock and refresh

The login handler returns access/refresh — enough for [10-auth-context.md](10-auth-context.md). You'll add the refresh endpoint in [27-lab-msw.md](27-lab-msw.md).

Don't put "real" secrets in handlers — only demo credentials like `admin@shop.local`.

---

## Dev workflow

```text
1. npm run dev (MSW on) → UI works without Django
2. Build the feature → update handlers
3. Integration check → VITE_USE_MSW=false + docker django
4. CI tests → setupServer(handlers)
```

---

## Common mistakes

**Rendering before `worker.start()`.** Race condition: the first fetch bypasses the mock.

**Handler path doesn't match the fetch URL.** `/api/v1/products` vs `/api/v1/products/` — trailing slash, same as Django.

**MSW ends up in the production bundle.** Use a dynamic import plus a DEV guard.

**Forgot `msw init public`.** Worker 404s.

**Mock data is too happy-path.** Add errors, as in [25-msw-handlers.md](25-msw-handlers.md).

**"Fixing" CORS through MSW alone.** You still need the real API before release ([react-basic: CORS](../react-basic/18-cors-fastapi.md) — the Django equivalent).

---

## Checklist

- [ ] SW intercepts fetch, app code unchanged
- [ ] `enableMocking().then(render)` ordering
- [ ] `VITE_USE_MSW` toggle
- [ ] DRF pagination shape in handlers
- [ ] MSW excluded from the prod bundle

---

## Next

Next lesson: [25. Handlers, scenarios, delays and errors](25-msw-handlers.md).
