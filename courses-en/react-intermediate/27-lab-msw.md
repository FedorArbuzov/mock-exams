# 27. Lab: mock auth and products

## Scenario

Ticket **DEV-330**: "Clone-and-run admin: MSW auth + products, no Docker". The finale of the MSW phase ([24-msw-intro.md](24-msw-intro.md)–[26-msw-query.md](26-msw-query.md)): complete handlers in [`examples/src/mocks/`](examples/src/mocks/), login flow ([13-lab-auth.md](13-lab-auth.md)), products list with Query, a scenario panel for QA errors.

**Time:** ~60–70 minutes. Django is **not required** when `VITE_USE_MSW=true`.

---

## Setup

```bash
cd courses/react-intermediate/examples
npm install
npx msw init public --save   # if the worker doesn't exist yet
npm run dev
```

`.env.development`:

```env
VITE_USE_MSW=true
```

---

## Task 1. mocks structure

```text
src/mocks/
  db.ts                 # in-memory products + reset
  scenario.ts           # happy | products-500 | products-slow | auth-401
  handlers/
    auth.ts
    products.ts
    index.ts
  browser.ts
```

Export `handlers` from `index.ts` — aggregate ([25-msw-handlers.md](25-msw-handlers.md)).

**Success criterion:** `worker.start()` with no unhandled warnings on login + products.

---

## Task 2. Auth handlers

Implement:

| Method | Path | Behavior |
|--------|------|----------|
| POST | `/api/v1/auth/login/` | `admin@shop.local` + `admin` → tokens + user |
| POST | `/api/v1/auth/login/` | wrong password → 401 `{ detail }` |
| POST | `/api/v1/auth/refresh/` | valid refresh → new access |
| POST | `/api/v1/auth/refresh/` | invalid → 401 |
| GET | `/api/v1/auth/me/` | Bearer mock access → user (optional) |

Scenario **`auth-401`**: refresh always 401 → verify the logout cascade ([12-refresh-flow.md](12-refresh-flow.md)).

Delay login `400ms` for a realistic UI.

**Success criterion:** the login form works without Django; the token lives in memory/storage per your AuthProvider ([09-token-storage.md](09-token-storage.md)).

---

## Task 3. Products handlers

DRF pagination ([05-pagination-filters.md](05-pagination-filters.md)):

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/api/v1/products/` | `{ count, next, previous, results }` |
| GET | `/api/v1/products/:id/` | 404 if missing |
| POST | `/api/v1/products/` | 201 create, 400 validation |
| PATCH | `/api/v1/products/:id/` | update |
| DELETE | `/api/v1/products/:id/` | 204 |

Query params: `page`, `search` (filter title/sku).

Seed ≥10 products in `db.ts`; a `reset()` function for tests.

Scenarios:

- **`products-500`** — GET list → 500
- **`products-slow`** — GET list → `delay(5000)`

**Success criterion:** the `useProducts` hook has no mock imports; only `api()`.

---

## Task 4. main.tsx bootstrap

```tsx
async function enableMocking() {
  if (!import.meta.env.DEV) return;
  if (import.meta.env.VITE_USE_MSW === "false") return;

  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "warn" });
}

enableMocking().then(() => {
  // render app with QueryClientProvider, AuthProvider, Router
});
```

**Success criterion:** the first fetch doesn't race (the app renders after `worker.start`).

---

## Task 5. Products UI + Query

`ProductsListPage`:

- `useQuery` or `useSuspenseQuery` ([22-suspense-data.md](22-suspense-data.md))
- loading skeleton / ErrorPanel on the 500 scenario ([16-global-error-ux.md](16-global-error-ux.md))
- optional: virtual table from [23-lab-performance.md](23-lab-performance.md)

Protected route `/products` — [11-protected-routes.md](11-protected-routes.md).

**Success criterion:** in MSW mode the full flow works login → products list.

---

## Task 6. Dev scenario panel

The `MockScenarioPanel` component (dev only):

```tsx
export function MockScenarioPanel() {
  if (!import.meta.env.DEV) return null;

  return (
    <details className="mock-panel">
      <summary>MSW scenario</summary>
      <select
        defaultValue={getMockScenario()}
        onChange={(e) => {
          setMockScenario(e.target.value as MockScenario);
          queryClient.invalidateQueries();
        }}
      >
        <option value="happy">Happy</option>
        <option value="products-500">Products 500</option>
        <option value="products-slow">Slow catalog</option>
        <option value="auth-401">Refresh 401</option>
      </select>
    </details>
  );
}
```

**Success criterion:** switch to `products-500` → ErrorPanel + retry; `auth-401` → redirect to login after a refresh attempt.

---

## Task 7. Toggle real API

Document in a comment/README snippet:

```env
# .env.development.local
VITE_USE_MSW=false
```

Vite proxy → `:8092`. Toggle → `queryClient.clear()` + reload ([26-msw-query.md](26-msw-query.md)).

**Success criterion:** the same `useProducts` works against Django when it's up.

---

## Task 8. Banner

```tsx
{import.meta.env.VITE_USE_MSW !== "false" && (
  <p className="dev-banner" role="status">
    MSW mode — API mocked
  </p>
)}
```

---

## Self-check

1. Fresh clone → `npm i && npm run dev` → login → products (no Docker).
2. Create product POST → list updates after invalidate.
3. Scenario 500 → error UX → happy → recovery.
4. Scenario slow → loading ≥5s.
5. `VITE_USE_MSW=false` + Django → real data (optional).
6. `npm run build` — no MSW in bundle size (check dist lacks mock db strings).

---

## Reference credentials

| Field | Value |
|-------|-------|
| Email | `admin@shop.local` |
| Password | `admin` |

For dev mock only — [35-security-client.md](35-security-client.md).

---

## Submission

PR: a screenshot of login + products MSW, the 500 scenario, the `mocks/` file tree. A README note in `examples/` — optional, one paragraph.

---

## Common mistakes

**Handlers trailing slash** — Django vs fetch mismatch.

**Render before worker.start.**

**AuthProvider expects fields the mock doesn't return** — compare [08-jwt-basics.md](08-jwt-basics.md).

**Scenario change without invalidate** — stale UI.

**Commit `public/mockServiceWorker.js`** — needed for team clone.

**MSW in production** — guard DEV.

---

## Checklist

- [ ] auth + products handlers complete
- [ ] in-memory CRUD + reset
- [ ] scenario panel for QA
- [ ] Query hooks decoupled from mocks
- [ ] Real API toggle documented

---

## Next

Phase 7 — forms and admin UI. Next lesson: [28. react-hook-form + Zod resolver](28-forms-rhf.md).
