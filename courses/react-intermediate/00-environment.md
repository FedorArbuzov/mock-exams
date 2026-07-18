# 00. Окружение: расширение проекта, MSW, зависимости

## Введение: «react-basic закончился — что дальше?»

Пятница, demo react-basic capstone прошёл. Tech lead открывает Jira: **SHOP-301 — Admin SPA для каталога Django**. Задача на следующий спринт: отдельное приложение на Vite, JWT-авторизация, таблица products с пагинацией, моки API для разработки без поднятого backend. Вы клонируете `courses/react-intermediate/examples`, делаете `npm install`, `npm run dev` — порт **5174**, не 5173. Запросы на `/api` уходят на **:8092**, а не на FastAPI **:8090**. В консоли: «MSW disabled» — пока нормально.

react-intermediate — **продолжение** [`react-basic`](../react-basic/README.md), не переписывание с нуля. Тот же React 19, Vite, TypeScript, TanStack Query, React Router — плюс MSW, react-hook-form, Zustand, виртуализация. Backend по умолчанию — Django DRF [`deploy/django`](../../deploy/django/README.md); FastAPI [`deploy/fastapi`](../../deploy/fastapi/README.md) остаётся для сравнения контрактов из [18-cors-fastapi.md](../react-basic/18-cors-fastapi.md).

## Что вы узнаете

- Чем **react-intermediate/examples** отличается от react-basic.
- Порт **5174**, proxy `/api` → Django **:8092**.
- Новые зависимости: **MSW**, **react-hook-form**, **Zustand**, **@tanstack/react-virtual**.
- Условный запуск **MSW** через `VITE_ENABLE_MSW=true`.
- Минимальная проверка окружения перед лабами 03–13.

---

## От react-basic к react-intermediate

| | react-basic | react-intermediate |
|---|-------------|-------------------|
| Порт Vite | 5173 | **5174** |
| Backend по умолчанию | FastAPI :8090 | **Django :8092** |
| Домен | shop catalog (read) | **admin SPA** (CRUD, auth) |
| Моки API | нет | **MSW** в `src/mocks/` |
| Capstone | SPA к FastAPI | Admin к Django |

Предпосылки: hooks ([09-useState.md](../react-basic/09-useState.md)), Query ([20-tanstack-query.md](../react-basic/20-tanstack-query.md)), Router ([23-react-router.md](../react-basic/23-react-router.md)), Context ([29-context.md](../react-basic/29-context.md)), структура проекта ([35-project-structure.md](../react-basic/35-project-structure.md)).

---

## Установка и первый запуск

### Требования

- **Node.js LTS 20+** (или 22) — как в [00-environment.md](../react-basic/00-environment.md).
- Пройденный react-basic capstone [38-capstone.md](../react-basic/38-capstone.md) или эквивалентный SPA.
- Желательно [`typescript-basic`](../typescript-basic/README.md) — Zod, generics.

### Команды

```bash
cd courses/react-intermediate/examples
npm install
npm run dev
```

Откройте `http://localhost:5174`. Заголовок: «Shop Admin — react-intermediate».

| Команда | Назначение |
|---------|------------|
| `npm run dev` | dev-сервер на **5174** |
| `npm run build` | production bundle |
| `npm run preview` | просмотр `dist/` |
| `npm run typecheck` | `tsc` без emit |

### Django backend (с главы 07)

```bash
cd deploy/django
docker compose up -d --build
# API: http://localhost:8092/api/v1/
# Swagger/DRF browsable — см. README стенда
```

Пока Django не поднят — часть лаб будет падать с network error. С главы 24 MSW позволит работать **без** backend; auth-мок уже есть в handlers.

---

## Proxy на Django :8092

[`examples/vite.config.ts`](examples/vite.config.ts):

```typescript
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

С фронта: `fetch("/api/v1/products/")` → Vite перенаправляет на `http://localhost:8092/api/v1/products/`. CORS в dev не мешает — браузер видит **same-origin** запрос к `:5174`.

Сравнение с react-basic:

```text
react-basic:     /api  →  localhost:8090  (FastAPI)
react-intermediate: /api  →  localhost:8092  (Django DRF)
```

Не смешивайте порты в одном проекте — у каждого курса свой `examples/`.

---

## Новые зависимости

[`examples/package.json`](examples/package.json):

| Пакет | Зачем в курсе |
|-------|---------------|
| `msw` | Mock Service Worker — перехват fetch в dev/тестах |
| `react-hook-form` + `@hookform/resolvers` + `zod` | формы admin CRUD |
| `zustand` | лёгкий UI state (фильтры таблицы, sidebar) |
| `@tanstack/react-virtual` | длинные списки products |
| `@tanstack/react-query` ^5 | уже знаком из react-basic |

React Router 7, React 19 — те же major, что в react-basic после обновления.

---

## MSW: структура и включение

```text
examples/
  public/
    mockServiceWorker.js    # генерируется npx msw init
  src/
    mocks/
      browser.ts            # worker для браузера
      handlers.ts           # HTTP handlers
```

[`handlers.ts`](examples/src/mocks/handlers.ts) уже содержит:

- `GET /api/v1/products/` — paginated mock catalog;
- `POST /api/v1/auth/login/` — `admin@shop.local` / `admin`.

[`main.tsx`](examples/src/main.tsx):

```tsx
async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MSW !== "true") {
    return;
  }
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(/* ... */);
});
```

**Включить MSW:**

```bash
# Windows PowerShell
$env:VITE_ENABLE_MSW="true"; npm run dev

# Linux/macOS
VITE_ENABLE_MSW=true npm run dev
```

Или создайте `.env.local`:

```env
VITE_ENABLE_MSW=true
```

`onUnhandledRequest: "bypass"` — запросы без handler идут на real API (Django). Удобно постепенно добавлять моки.

### Проверка MSW

1. Запустите с `VITE_ENABLE_MSW=true`.
2. DevTools → Console: `[MSW] Mocking enabled`.
3. Network → запрос products — `(from service worker)`.

---

## Точка входа и провайдеры

Стартовый `main.tsx` уже оборачивает приложение:

```tsx
<QueryClientProvider client={queryClient}>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</QueryClientProvider>
```

`QueryClient` с `staleTime: 30_000` — как в [20-tanstack-query.md](../react-basic/20-tanstack-query.md). AuthProvider добавите в [10-auth-context.md](10-auth-context.md).

Alias `@` → `src/` — в `vite.config.ts` и `tsconfig.json` (как react-basic).

---

## Переключение real API vs mock

| Режим | Django :8092 | MSW |
|-------|--------------|-----|
| Только Django | `docker compose up` | выключен |
| Только mock | не нужен | `VITE_ENABLE_MSW=true` |
| Гибрид | поднят | MSW + `bypass` для незамоканных |

На code review часто спрашивают: «Почему не хардкодить JSON в компонентах?» MSW держит **контракт API** на уровне HTTP — ближе к интеграции, чем `if (DEV) return fakeData`.

---

## Связь с курсами

| Урок / стенд | Связь |
|--------------|-------|
| [react-basic/00](../react-basic/00-environment.md) | Vite, HMR, DevTools |
| [react-basic/38](../react-basic/38-capstone.md) | shop SPA — предпосылка |
| [`deploy/django`](../../deploy/django/README.md) | DRF :8092 |
| [`deploy/fastapi`](../../deploy/fastapi/README.md) | сравнение REST :8090 |
| [24-msw-intro.md](24-msw-intro.md) | углубление MSW (фаза 6) |

---

## Типичные ошибки

1. **Открыли 5173** — react-intermediate слушает **5174**. Другой процесс или стары закладка.

2. **Proxy на 8090** — скопировали `vite.config.ts` из react-basic. Products 404 — Django на **8092**.

3. **MSW не стартует** — забыли `mockServiceWorker.js` в `public/`. Выполните `npx msw init public --save` в `examples/`.

4. **`.env` не подхватился** — нужен префикс `VITE_` и перезапуск dev-сервера.

5. **Два QueryClient** — не создавайте второй в feature; один в `main.tsx`.

6. **Node 18** — в `package.json` engines `>=20`; странные ошибки Vite 6.

---

## Чек-лист

- [ ] `npm run dev` на **localhost:5174**
- [ ] Понимаете proxy `/api` → **:8092**
- [ ] Знаете, как включить MSW (`VITE_ENABLE_MSW=true`)
- [ ] Видите mock login `admin@shop.local` / `admin` в handlers
- [ ] Отличили react-intermediate от react-basic по порту и backend
- [ ] Готовы к feature-структуре admin SPA ([02-architecture.md](02-architecture.md))

## Далее

Следующий урок: [01. Ландшафт Middle+: server state, auth, production SPA](01-landscape.md).
