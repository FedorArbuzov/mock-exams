# 27. Лаба: mock auth и products

## Сценарий

Ticket **DEV-330**: «Clone-and-run admin: MSW auth + products, без Docker». Финал фазы MSW ([24-msw-intro.md](24-msw-intro.md)–[26-msw-query.md](26-msw-query.md)): полные handlers в [`examples/src/mocks/`](examples/src/mocks/), login flow ([13-lab-auth.md](13-lab-auth.md)), products list с Query, scenario panel для QA errors.

**Время:** ~60–70 минут. Django **не обязателен** при `VITE_USE_MSW=true`.

---

## Подготовка

```bash
cd courses/react-intermediate/examples
npm install
npx msw init public --save   # если worker ещё нет
npm run dev
```

`.env.development`:

```env
VITE_USE_MSW=true
```

---

## Задание 1. Структура mocks

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

Экспорт `handlers` из `index.ts` — aggregate ([25-msw-handlers.md](25-msw-handlers.md)).

**Критерий:** `worker.start()` без unhandled warnings на login + products.

---

## Задание 2. Auth handlers

Implement:

| Method | Path | Behavior |
|--------|------|----------|
| POST | `/api/v1/auth/login/` | `admin@shop.local` + `admin` → tokens + user |
| POST | `/api/v1/auth/login/` | wrong password → 401 `{ detail }` |
| POST | `/api/v1/auth/refresh/` | valid refresh → new access |
| POST | `/api/v1/auth/refresh/` | invalid → 401 |
| GET | `/api/v1/auth/me/` | Bearer mock access → user (optional) |

Scenario **`auth-401`**: refresh always 401 → проверка logout cascade ([12-refresh-flow.md](12-refresh-flow.md)).

Delay login `400ms` для realistic UI.

**Критерий:** login form работает без Django; token в memory/storage по вашему AuthProvider ([09-token-storage.md](09-token-storage.md)).

---

## Задание 3. Products handlers

DRF pagination ([05-pagination-filters.md](05-pagination-filters.md)):

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/api/v1/products/` | `{ count, next, previous, results }` |
| GET | `/api/v1/products/:id/` | 404 if missing |
| POST | `/api/v1/products/` | 201 create, 400 validation |
| PATCH | `/api/v1/products/:id/` | update |
| DELETE | `/api/v1/products/:id/` | 204 |

Query params: `page`, `search` (filter title/sku).

Seed ≥10 products в `db.ts`; функция `reset()` для tests.

Scenarios:

- **`products-500`** — GET list → 500
- **`products-slow`** — GET list → `delay(5000)`

**Критерий:** `useProducts` hook без mock imports; только `api()`.

---

## Задание 4. main.tsx bootstrap

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

**Критерий:** first fetch не race (app after `worker.start`).

---

## Задание 5. Products UI + Query

`ProductsListPage`:

- `useQuery` или `useSuspenseQuery` ([22-suspense-data.md](22-suspense-data.md))
- loading skeleton / ErrorPanel on 500 scenario ([16-global-error-ux.md](16-global-error-ux.md))
- optional: virtual table from [23-lab-performance.md](23-lab-performance.md)

Protected route `/products` — [11-protected-routes.md](11-protected-routes.md).

**Критерий:** MSW mode full flow login → products list.

---

## Задание 6. Dev scenario panel

Компонент `MockScenarioPanel` (dev only):

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

**Критерий:** switch to `products-500` → ErrorPanel + retry; `auth-401` → redirect login after refresh attempt.

---

## Задание 7. Toggle real API

Document in comment/README snippet:

```env
# .env.development.local
VITE_USE_MSW=false
```

Vite proxy → `:8092`. Toggle → `queryClient.clear()` + reload ([26-msw-query.md](26-msw-query.md)).

**Критерий:** same `useProducts` works against Django when stand up.

---

## Задание 8. Banner

```tsx
{import.meta.env.VITE_USE_MSW !== "false" && (
  <p className="dev-banner" role="status">
    Режим MSW — API mocked
  </p>
)}
```

---

## Самопроверка

1. Fresh clone → `npm i && npm run dev` → login → products (no Docker).
2. Create product POST → list updates after invalidate.
3. Scenario 500 → error UX → happy → recovery.
4. Scenario slow → loading ≥5s.
5. `VITE_USE_MSW=false` + Django → real data (optional).
6. `npm run build` — no MSW in bundle size (check dist lacks mock db strings).

---

## Эталон credentials

| Field | Value |
|-------|-------|
| Email | `admin@shop.local` |
| Password | `admin` |

Только для dev mock — [35-security-client.md](35-security-client.md).

---

## Сдача

PR: скрин login + products MSW, scenario 500, file tree `mocks/`. README note в `examples/` — optional one paragraph.

---

## Типичные ошибки

**Handlers trailing slash** — Django vs fetch mismatch.

**Render before worker.start.**

**AuthProvider expects fields mock не отдаёт** — compare [08-jwt-basics.md](08-jwt-basics.md).

**Scenario change без invalidate** — stale UI.

**Commit `public/mockServiceWorker.js`** — нужен для team clone.

**MSW in production** — guard DEV.

---

## Чек-лист

- [ ] auth + products handlers complete
- [ ] in-memory CRUD + reset
- [ ] scenario panel for QA
- [ ] Query hooks decoupled from mocks
- [ ] Real API toggle documented

---

## Далее

Фаза 7 — формы и admin UI. Следующий урок: [28. react-hook-form + Zod resolver](28-forms-rhf.md).
