# 24. MSW: зачем мокать API в dev и тестах

## Сценарий с работы

Новый разработчик клонирует admin SPA — Django `:8092` не поднят. `npm run dev` → login падает, products пусто, QA blocked. Senior: «Поднимите MSW — mock API в браузере, один `npm run dev`». Параллельно [javascript-testing](../javascript-path.md) — те же handlers для Vitest без backend.

После auth labs ([13-lab-auth.md](13-lab-auth.md)) и Django products ([07-lab-django-products.md](07-lab-django-products.md)) MSW даёт **переключатель** real/mock и сценарии ошибок ([25-msw-handlers.md](25-msw-handlers.md)).

В [`examples/`](examples/package.json) уже MSW v2 и заготовки [`handlers.ts`](examples/src/mocks/handlers.ts), [`browser.ts`](examples/src/mocks/browser.ts).

## Что вы узнаете

- Mock Service Worker architecture: Service Worker vs node
- Зачем MSW вместо «захардкоженного if (DEV)»
- MSW v2 setup в Vite SPA
- `public/` worker directory
- Dev vs test vs production
- Связь с Django DRF контрактом ([04-api-client.md](04-api-client.md))

---

## Проблема без MSW

```tsx
// Антипаттерн
const products = import.meta.env.DEV ? MOCK_PRODUCTS : await fetch(...);
```

Дублирование контракта, prod code paths не тестируются, CORS/env расходятся с [react-basic: fetch](../react-basic/17-fetch-react.md).

MSW перехватывает **настоящий** `fetch` в browser — приложение не знает про mock.

---

## Как работает MSW v2

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

**Browser:** `setupWorker` из `msw/browser`.  
**Tests (Node):** `setupServer` из `msw/node` — позже в javascript-testing.

Handlers declarative: `http.get`, `http.post`, `HttpResponse`, `delay`.

---

## Структура в examples

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

[`handlers.ts`](examples/src/mocks/handlers.ts) уже содержит:

- `GET /api/v1/products/` — paginated DRF shape
- `POST /api/v1/auth/login/` — mock JWT

---

## Инициализация worker

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

## Запуск в main.tsx

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

**`onUnhandledRequest: "warn"`** — в консоли видно забытые endpoints. `"bypass"` — пропуск на real API (mixed mode).

---

## Env переключатель

`.env.development`:

```env
VITE_USE_MSW=true
VITE_API_BASE=
```

`.env.development.local` (gitignore):

```env
VITE_USE_MSW=false
```

При `false` — fetch идёт на Vite proxy → Django `:8092` ([00-environment.md](00-environment.md)).

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
| Same fetch code | да | да |
| Offline dev | да | нужен процесс |
| Tests reuse handlers | да | сложнее |
| Service Worker caveats | да | нет |

MSW — industry standard для React ([javascript-testing](../javascript-path.md)).

---

## Service Worker caveats

1. **HTTPS / localhost only** — OK для Vite dev.
2. **First load** — worker register async; `enableMocking().then(render)` обязателен.
3. **Cache stale worker** — hard refresh / unregister in DevTools Application tab.
4. **Not in production** — guard `import.meta.env.DEV` или explicit flag.

---

## Контракт DRF

Handlers должны mirror реальный API ([05-pagination-filters.md](05-pagination-filters.md)):

```tsx
HttpResponse.json({
  count: 2,
  next: null,
  previous: null,
  results: [...],
});
```

Иначе typed client ([04-api-client.md](04-api-client.md)) и Zod parse ломаются в mock mode.

---

## Auth mock и refresh

Login handler возвращает access/refresh — достаточно для [10-auth-context.md](10-auth-context.md). Refresh endpoint добавите в [27-lab-msw.md](27-lab-msw.md).

Не храните «настоящие» secrets в handlers — только demo credentials `admin@shop.local`.

---

## Dev workflow

```text
1. npm run dev (MSW on) → UI без Django
2. Разработка feature → handlers update
3. Integration check → VITE_USE_MSW=false + docker django
4. CI tests → setupServer(handlers)
```

---

## Типичные ошибки

**Render до `worker.start()`.** Race: first fetch bypass.

**Handlers path не совпадает с fetch URL.** `/api/v1/products` vs `/api/v1/products/` — trailing slash как у Django.

**MSW в production bundle.** Dynamic import + DEV guard.

**Забыли `msw init public`.** Worker 404.

**Mock data слишком happy-path.** Добавьте errors в [25-msw-handlers.md](25-msw-handlers.md).

**CORS fix через MSW only.** Real API всё равно нужен перед release ([react-basic: CORS](../react-basic/18-cors-fastapi.md) — аналогия для Django).

---

## Чек-лист

- [ ] SW перехватывает fetch, app code unchanged
- [ ] `enableMocking().then(render)` порядок
- [ ] `VITE_USE_MSW` toggle
- [ ] DRF pagination shape в handlers
- [ ] MSW не в prod bundle

---

## Далее

Следующий урок: [25. Handlers, scenarios, задержки и ошибки](25-msw-handlers.md).
