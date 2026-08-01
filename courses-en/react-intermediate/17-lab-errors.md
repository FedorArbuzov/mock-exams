# 17. Lab: fallback UI and route errors

## Scenario

Ticket **ADMIN-214**: "A white screen on a broken product — unacceptable." After the theory in [14-error-boundaries.md](14-error-boundaries.md)–[16-global-error-ux.md](16-global-error-ux.md), you build a full error stack into [`examples/`](examples/src/): a root boundary, a route `errorElement`, `QueryErrorResetBoundary`, a toast for mutations, and a demo "broken" component for QA.

**Time:** ~55–70 minutes. Django `:8092` is optional — a mock product id is enough.

---

## Setup

```bash
cd courses/react-intermediate/examples
npm install
npm run dev   # http://localhost:5174
```

Add the dependency (if not there yet):

```bash
npm install react-error-boundary
```

Structure after the lab:

```text
src/
  app/
    router.tsx
    AdminLayout.tsx
    RootErrorBoundary.tsx
  features/
    products/
      ProductDetailPage.tsx
      BrokenProductDemo.tsx   # an intentional bug to test the boundary
  shared/
    ui/
      ErrorPanel.tsx
      SectionErrorFallback.tsx
      RouteErrorFallback.tsx
    notifications/
      ToastProvider.tsx
```

---

## Task 1. `ErrorPanel` and fallbacks

Create `ErrorPanel` modeled on the one from [16-global-error-ux.md](16-global-error-ux.md).

`SectionErrorFallback` — for react-error-boundary:

```tsx
import type { FallbackProps } from "react-error-boundary";
import { ErrorPanel } from "@/shared/ui/ErrorPanel";

export function SectionErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  return (
    <ErrorPanel
      title="Section display error"
      message={error.message}
      onRetry={resetErrorBoundary}
    />
  );
}
```

`RouteErrorFallback` — with `useRouteError` ([15-boundaries-router.md](15-boundaries-router.md)).

**Criterion:** the fallback renders `role="alert"`, the retry button is visible.

---

## Task 2. Router with `errorElement`

Set up React Router 7 ([react-basic: React Router](../react-basic/23-react-router.md)):

| Path | Component |
|------|-----------|
| `/login` | `LoginPage` (stub) |
| `/` | `AdminLayout` + children |
| `/products` | list (a stub is OK) |
| `/products/:productId` | `ProductDetailPage` |
| `/products/broken` | `BrokenProductDemo` |

On the layout route:

```tsx
{
  path: "/",
  element: <AdminLayout />,
  errorElement: <RouteErrorFallback />,
  children: [ /* ... */ ],
}
```

`AdminLayout`: sidebar + `<Outlet />` in the content area.

**Criterion:** navigating to a non-existent loader throw (if you add one) or a render throw shows `RouteErrorFallback`, the sidebar is alive (if the error is below the layout — check the tree).

---

## Task 3. QueryErrorResetBoundary + ErrorBoundary

In the `AdminLayout` content:

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

**Criterion:** after a crash on `/products/broken`, navigating to `/products` **without** a stuck fallback.

---

## Task 4. `BrokenProductDemo`

An intentional render crash:

```tsx
export function BrokenProductDemo() {
  const product: { category: { slug: string } | null } = {
    category: null,
  };

  // QA: reproduce the white screen without a boundary
  return <p>Category: {product.category!.slug}</p>;
}
```

Route: `/products/broken`.

**Criterion:** with a boundary — `SectionErrorFallback`; the reset button crashes **again** (expected) — add a "To the list" link in the fallback or an optional `secondaryAction` in `ErrorPanel`.

Improvement: a "safe mode" toggle via the query `?safe=1` and optional chaining — show the difference between a dev fix and a boundary.

---

## Task 5. Root boundary

`RootErrorBoundary` in `main.tsx` **around** `RouterProvider`:

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

Fatal fallback — reload the page. **Criterion:** an error **outside** the admin layout (for example, a throw in the router config) doesn't white out the document.

---

## Task 6. Query error + toast

The `useProducts` hook (a stub or Django [07-lab-django-products.md](07-lab-django-products.md)):

```tsx
export function ProductsListPage() {
  const { data, isError, error, refetch, isFetching } = useProducts();

  if (isError) {
    return (
      <ErrorPanel
        title="Failed to load the catalog"
        message={error.message}
        onRetry={() => refetch()}
        retryLabel={isFetching ? "Loading…" : "Retry"}
      />
    );
  }

  return <ul>{/* ... */}</ul>;
}
```

Mutation demo: the "Save" button calls the API with a deliberately invalid body → `useApiErrorToast` from [16-global-error-ux.md](16-global-error-ux.md).

**Criterion:** 500 → a toast with retry; the list → an inline ErrorPanel.

---

## Task 7. Offline banner

Add `OfflineBanner` to `AdminLayout`. DevTools → Network → Offline.

**Criterion:** the banner is visible, the mutation submit is disabled or shows a "No network" toast.

---

## Self-check (lab checklist)

1. Open `/products/broken` → a fallback, not a white screen.
2. Navigate to `/products` → the normal UI.
3. Click reset on broken → the fallback again → navigate away → OK.
4. Simulate a Query error (stop Django or mock a 500) → ErrorPanel + refetch.
5. Simulate a mutation error → a toast.
6. Offline → a banner.

---

## Hints

- If the fallback "sticks", check `resetKeys` and that the boundary isn't on the root App without a remount.
- `StrictMode` double-mount in dev — the boundary may log twice; that's normal.
- Don't log tokens in the boundary's `onError`.

---

## Submission

A PR or screenshots: the broken route, a Query error, a toast, offline. In the description — the difference between the three layers (boundary / route / Query) **in one paragraph**.

---

## Common mistakes

**Boundary only on ProductDetail, not on the Outlet.** The sidebar crashes along with the content.

**Forgot `QueryErrorResetBoundary`.** Reset doesn't refetch Query.

**One ErrorPanel for 403 and 500.** Different titles and actions.

**Testing only the happy path.** A broken route is a mandatory QA scenario.

---

## Checklist

- [ ] `QueryErrorResetBoundary` + `ErrorBoundary` + `resetKeys`
- [ ] `errorElement` on the admin layout
- [ ] Root fatal fallback
- [ ] Query inline error vs mutation toast
- [ ] Offline banner

---

## Next

Phase 5 — performance. Next lesson: [18. Re-render: mental model and React DevTools](18-rerender-model.md).
