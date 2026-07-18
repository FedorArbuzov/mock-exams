# 17. Лаба: fallback UI и route errors

## Сценарий

Ticket **ADMIN-214**: «White screen на битом product — unacceptable». После теории [14-error-boundaries.md](14-error-boundaries.md)–[16-global-error-ux.md](16-global-error-ux.md) вы внедряете в [`examples/`](examples/src/) полноценный error stack: root boundary, route `errorElement`, `QueryErrorResetBoundary`, toast для mutations и демо «сломанного» компонента для QA.

**Время:** ~55–70 минут. Django `:8092` опционален — достаточно mock product id.

---

## Подготовка

```bash
cd courses/react-intermediate/examples
npm install
npm run dev   # http://localhost:5174
```

Добавьте зависимость (если ещё нет):

```bash
npm install react-error-boundary
```

Структура после лабы:

```text
src/
  app/
    router.tsx
    AdminLayout.tsx
    RootErrorBoundary.tsx
  features/
    products/
      ProductDetailPage.tsx
      BrokenProductDemo.tsx   # намеренный баг для теста boundary
  shared/
    ui/
      ErrorPanel.tsx
      SectionErrorFallback.tsx
      RouteErrorFallback.tsx
    notifications/
      ToastProvider.tsx
```

---

## Задание 1. `ErrorPanel` и fallbacks

Создайте `ErrorPanel` по образцу из [16-global-error-ux.md](16-global-error-ux.md).

`SectionErrorFallback` — для react-error-boundary:

```tsx
import type { FallbackProps } from "react-error-boundary";
import { ErrorPanel } from "@/shared/ui/ErrorPanel";

export function SectionErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  return (
    <ErrorPanel
      title="Ошибка отображения раздела"
      message={error.message}
      onRetry={resetErrorBoundary}
    />
  );
}
```

`RouteErrorFallback` — с `useRouteError` ([15-boundaries-router.md](15-boundaries-router.md)).

**Критерий:** fallback рендерит `role="alert"`, кнопка retry видима.

---

## Задание 2. Router с `errorElement`

Подключите React Router 7 ([react-basic: React Router](../react-basic/23-react-router.md)):

| Path | Компонент |
|------|-----------|
| `/login` | `LoginPage` (заглушка) |
| `/` | `AdminLayout` + children |
| `/products` | список (заглушка OK) |
| `/products/:productId` | `ProductDetailPage` |
| `/products/broken` | `BrokenProductDemo` |

На layout route:

```tsx
{
  path: "/",
  element: <AdminLayout />,
  errorElement: <RouteErrorFallback />,
  children: [ /* ... */ ],
}
```

`AdminLayout`: sidebar + `<Outlet />` в content area.

**Критерий:** переход на несуществующий loader throw (если добавите) или render throw показывает `RouteErrorFallback`, sidebar жив (если error ниже layout — проверьте дерево).

---

## Задание 3. QueryErrorResetBoundary + ErrorBoundary

В `AdminLayout` content:

```tsx
import { useLocation, Outlet } from "react-router-dom";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { SectionErrorFallback } from "@/shared/ui/SectionErrorFallback";

export function AdminContent() {
  const location = useLocation();

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={SectionErrorFallback}
          resetKeys={[location.pathname]}
          onReset={reset}
        >
          <Outlet />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

**Критерий:** после краша на `/products/broken` переход на `/products` **без** залипшего fallback.

---

## Задание 4. `BrokenProductDemo`

Намеренный render crash:

```tsx
export function BrokenProductDemo() {
  const product: { category: { slug: string } | null } = {
    category: null,
  };

  // QA: воспроизвести white screen без boundary
  return <p>Категория: {product.category!.slug}</p>;
}
```

Route: `/products/broken`.

**Критерий:** с boundary — `SectionErrorFallback`; кнопка reset **снова** падает (ожидаемо) — добавьте ссылку «К списку» в fallback или в `ErrorPanel` optional `secondaryAction`.

Улучшение: toggle «безопасный режим» через query `?safe=1` и optional chaining — покажите разницу dev fix vs boundary.

---

## Задание 5. Root boundary

`RootErrorBoundary` в `main.tsx` **вокруг** `RouterProvider`:

```tsx
<QueryClientProvider client={queryClient}>
  <ToastProvider>
    <AuthProvider>
      <RootErrorBoundary>
        <RouterProvider router={router} />
      </RootErrorBoundary>
    </AuthProvider>
  </ToastProvider>
</QueryClientProvider>
```

Fatal fallback — reload page. **Критерий:** ошибка **вне** admin layout (например throw в router config) не белит document.

---

## Задание 6. Query error + toast

Hook `useProducts` (заглушка или Django [07-lab-django-products.md](07-lab-django-products.md)):

```tsx
export function ProductsListPage() {
  const { data, isError, error, refetch, isFetching } = useProducts();

  if (isError) {
    return (
      <ErrorPanel
        title="Не удалось загрузить каталог"
        message={error.message}
        onRetry={() => refetch()}
        retryLabel={isFetching ? "Загрузка…" : "Повторить"}
      />
    );
  }

  return <ul>{/* ... */}</ul>;
}
```

Mutation demo: кнопка «Сохранить» вызывает API с заведомо неверным body → `useApiErrorToast` из [16-global-error-ux.md](16-global-error-ux.md).

**Критерий:** 500 → toast с retry; список → inline ErrorPanel.

---

## Задание 7. Offline banner

Добавьте `OfflineBanner` в `AdminLayout`. DevTools → Network → Offline.

**Критерий:** banner виден, submit mutation disabled или показывает toast «Нет сети».

---

## Самопроверка (чек-лист лабы)

1. Откройте `/products/broken` → fallback, не white screen.
2. Перейдите на `/products` → нормальный UI.
3. Нажмите reset на broken → снова fallback → перейдите away → OK.
4. Симулируйте Query error (stop Django или mock 500) → ErrorPanel + refetch.
5. Симулируйте mutation error → toast.
6. Offline → banner.

---

## Подсказки

- Если fallback «залипает», проверьте `resetKeys` и что boundary не на root App без remount.
- `StrictMode` double-mount в dev — boundary может логировать дважды; норма.
- Не логируйте токены в `onError` boundary.

---

## Сдача

PR или скриншоты: broken route, Query error, toast, offline. В описании — **одним абзацем** различие трёх слоёв (boundary / route / Query).

---

## Типичные ошибки

**Boundary только на ProductDetail, не на Outlet.** Sidebar падает вместе с content.

**Забыли `QueryErrorResetBoundary`.** Reset не refetch Query.

**Один ErrorPanel для 403 и 500.** Разные title и actions.

**Тестируют только happy path.** Broken route — обязательный сценарий QA.

---

## Чек-лист

- [ ] `QueryErrorResetBoundary` + `ErrorBoundary` + `resetKeys`
- [ ] `errorElement` на admin layout
- [ ] Root fatal fallback
- [ ] Query inline error vs mutation toast
- [ ] Offline banner

---

## Далее

Фаза 5 — производительность. Следующий урок: [18. Re-render: mental model и React DevTools](18-rerender-model.md).
