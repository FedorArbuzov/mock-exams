# 15. Boundaries + Router + Query error reset

## Сценарий с работы

После [14-error-boundaries.md](14-error-boundaries.md) вы обернули `<Outlet />` в boundary — краш таблицы products больше не белит весь экран. Но QA находит новый баг: пользователь видит fallback «Ошибка карточки», переходит через sidebar на `/dashboard` — **fallback остаётся**. Boundary **не сбросился**: state `{ error }` живёт, пока не вызовут `reset` или не размонтируют boundary.

Параллельно React Router 7 ([react-basic: nested routes](../react-basic/24-nested-routes.md)) умеет **`errorElement`** — отдельный UI для ошибок **loader/action** и необработанных render-ошибок **внутри route tree**. Tech lead: «Согласуйте Router errors, boundary reset и Query cache — одна навигация должна очищать все три слоя».

## Что вы узнаете

- `errorElement` и `useRouteError` в React Router 7
- Сброс error boundary при смене route (`key`, `resetKeys`, remount)
- `QueryErrorResetBoundary` из TanStack Query v5
- Композиция: Router → Query reset → ErrorBoundary → `<Outlet />`
- Различие route error vs render crash vs Query failure

---

## Три слоя ошибок в admin SPA

```text
Навигация /products → /settings
        │
        ├── React Router: новый match, loader errors → errorElement
        ├── QueryErrorResetBoundary: сброс error state queries при reset
        └── react-error-boundary: reset render crash state
```

| Слой | Триггер | UI |
|------|---------|-----|
| Router `errorElement` | throw в loader, render в route | `RouteErrorFallback` |
| Error boundary | sync throw в child render | `ProductFallback` |
| Query `isError` | failed `queryFn` | inline alert + refetch |

Не смешивайте тексты: «Страница недоступна» (route) vs «Не удалось загрузить каталог» (Query) vs «Баг отображения» (boundary).

---

## React Router 7: `errorElement`

В [11-protected-routes.md](11-protected-routes.md) вы уже описали дерево routes. Добавляем обработчик на layout admin:

```tsx
// src/app/router.tsx
import {
  createBrowserRouter,
  RouterProvider,
  isRouteErrorResponse,
  useRouteError,
  Link,
} from "react-router-dom";

function RouteErrorFallback() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div role="alert">
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data?.message ?? "Ошибка маршрута"}</p>
        <Link to="/">На главную</Link>
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div role="alert">
        <h1>Неожиданная ошибка</h1>
        <p>{error.message}</p>
        <Link to="/">На главную</Link>
      </div>
    );
  }

  return <div role="alert">Неизвестная ошибка</div>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <AdminLayout />,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: "products",
        element: <ProductsLayout />,
        children: [
          { index: true, element: <ProductsListPage /> },
          { path: ":productId", element: <ProductDetailPage /> },
        ],
      },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "/login", element: <LoginPage /> },
]);
```

**`errorElement`** на родителе ловит ошибки **дочерних** routes, если они не перехвачены ближе. Для SPA без loaders чаще срабатывает при **throw в render** дочернего route component — пересечение с classic boundary.

Loader example (если позже добавите data routers):

```tsx
async function productLoader({ params }: { params: { productId: string } }) {
  const res = await fetch(`/api/v1/products/${params.productId}/`);
  if (!res.ok) {
    throw new Response("Not found", { status: 404 });
  }
  return res.json();
}
```

---

## Сброс boundary при навигации

### Паттерн 1: `key={location.pathname}`

```tsx
import { useLocation, Outlet } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";

function AdminContent() {
  const location = useLocation();

  return (
    <ErrorBoundary
      key={location.pathname}
      FallbackComponent={SectionErrorFallback}
    >
      <Outlet />
    </ErrorBoundary>
  );
}
```

Смена path **размонтирует** boundary → state сбрасывается. Просто, но теряется state дочерних компонентов при **любом** изменении path (включая query string, если key включает `search`).

### Паттерн 2: `resetKeys` из react-error-boundary

```tsx
<ErrorBoundary
  FallbackComponent={SectionErrorFallback}
  resetKeys={[location.pathname]}
>
  <Outlet />
</ErrorBoundary>
```

Мягче: дети не remount целиком, сбрасывается только error state boundary.

### Паттерн 3: `useNavigate` + reset в fallback

```tsx
function SectionErrorFallback({ resetErrorBoundary }: FallbackProps) {
  const navigate = useNavigate();

  return (
    <div role="alert">
      <p>Раздел временно недоступен</p>
      <button
        type="button"
        onClick={() => {
          resetErrorBoundary();
          navigate("/products");
        }}
      >
        Вернуться к каталогу
      </button>
    </div>
  );
}
```

---

## QueryErrorResetBoundary

TanStack Query v5 экспортирует **`QueryErrorResetBoundary`**: при `reset()` сбрасывает error state queries, чтобы `useQuery` снова попытался fetch после исправления boundary/route.

```tsx
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { useLocation, Outlet } from "react-router-dom";

function AdminShell() {
  const location = useLocation();

  return (
    <QueryErrorResetBoundary>
      {({ reset: resetQueries }) => (
        <ErrorBoundary
          resetKeys={[location.pathname]}
          onReset={resetQueries}
          FallbackComponent={SectionErrorFallback}
        >
          <Outlet />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

**`onReset={resetQueries}`** — пользователь жмёт «Попробовать снова» в fallback: boundary чистит render error **и** Query снимает `isError`, запускает refetch. Без этого кнопка reset покажет снова stale error UI из кэша Query.

Связка с [06-query-advanced.md](06-query-advanced.md): после reset имеет смысл `queryClient.invalidateQueries({ queryKey: ["products"] })` если данные точно битые.

---

## Protected routes и ошибки auth

Из [12-refresh-flow.md](12-refresh-flow.md): при failed refresh пользователь уходит на `/login`. Error boundary **не** должен перехватывать redirect — `Navigate` не throw. Если `ProtectedRoute` throw при отсутствии role:

```tsx
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }

  return children;
}
```

403 попадёт в **`errorElement`** layout — покажите «Недостаточно прав», не generic boundary message.

---

## Композиция провайдеров в `main.tsx`

Порядок снаружи внутрь (как в [react-basic: Query provider](../react-basic/20-tanstack-query.md)):

```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
```

`QueryErrorResetBoundary` — **внутри** `QueryClientProvider`, обычно в `AdminLayout` вокруг `<Outlet />`, не в корне (чтобы login page не делила reset с admin).

Корневой boundary — **вокруг** `RouterProvider` или как `errorElement` на root route — на ваш выбор; главное — один явный fatal fallback.

---

## Suspense и boundaries (preview)

[21-code-splitting.md](21-code-splitting.md) и [22-suspense-data.md](22-suspense-data.md) добавят `<Suspense fallback={...}>`. Suspense **не заменяет** error boundary: rejected promise в `useSuspenseQuery` требует **ErrorBoundary** sibling или `errorElement`. Держите:

```tsx
<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary onReset={reset} FallbackComponent={...}>
      <Suspense fallback={<TableSkeleton />}>
        <ProductsTableSuspense />
      </Suspense>
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

---

## Типичные ошибки

**«errorElement ловит ошибки onClick».** Нет — только loader/action/render в route subtree.

**«key={pathname} на всём AdminLayout».** Сбрасывает sidebar state, раскрытые accordion — key только на content area.

**«Reset boundary без reset Query».** Кнопка «Повторить» снова показывает Query error panel под исправленным render.

**«Дублирую один и тот же JSX в boundary и errorElement».** Вынесите `GenericErrorPanel` в `src/shared/ui/`, но **разные** заголовки/действия по контексту.

**«Navigate в render без auth ловится boundary».** `Navigate` — не throw; проверяйте условия до опасного render.

---

## Чек-лист

- [ ] Чем `useRouteError` отличается от error в boundary fallback props
- [ ] Зачем `QueryErrorResetBoundary` + `onReset`
- [ ] Когда `resetKeys` vs `key={pathname}` на boundary
- [ ] Где в дереве провайдеров висит reset boundary
- [ ] Как 403 из `RequireAdmin` показывается через Router

---

## Далее

Следующий урок: [16. Global error UX: toasts, retry, offline](16-global-error-ux.md) — единый опыт для API, сети и неожиданных сбоев.
