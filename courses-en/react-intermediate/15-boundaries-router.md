# 15. Boundaries + Router + Query error reset

## Real-world scenario

After [14-error-boundaries.md](14-error-boundaries.md) you wrapped `<Outlet />` in a boundary — a products table crash no longer whites out the whole screen. But QA finds a new bug: the user sees the "Card error" fallback, navigates through the sidebar to `/dashboard` — **the fallback stays**. The boundary **didn't reset**: the `{ error }` state lives until `reset` is called or the boundary is unmounted.

In parallel, React Router 7 ([react-basic: nested routes](../react-basic/24-nested-routes.md)) supports **`errorElement`** — a dedicated UI for **loader/action** errors and unhandled render errors **inside the route tree**. Tech lead: "Coordinate Router errors, boundary reset, and the Query cache — a single navigation should clear all three layers."

## What you'll learn

- `errorElement` and `useRouteError` in React Router 7
- Resetting an error boundary when the route changes (`key`, `resetKeys`, remount)
- `QueryErrorResetBoundary` from TanStack Query v5
- Composition: Router → Query reset → ErrorBoundary → `<Outlet />`
- The difference between a route error vs a render crash vs a Query failure

---

## Three layers of errors in an admin SPA

```text
Navigation /products → /settings
        │
        ├── React Router: new match, loader errors → errorElement
        ├── QueryErrorResetBoundary: reset queries' error state on reset
        └── react-error-boundary: reset render crash state
```

| Layer | Trigger | UI |
|------|---------|-----|
| Router `errorElement` | throw in loader, render in a route | `RouteErrorFallback` |
| Error boundary | sync throw in a child render | `ProductFallback` |
| Query `isError` | failed `queryFn` | inline alert + refetch |

Don't mix the wording: "The page is unavailable" (route) vs "Failed to load the catalog" (Query) vs "Display bug" (boundary).

---

## React Router 7: `errorElement`

In [11-protected-routes.md](11-protected-routes.md) you already described the route tree. We add a handler on the admin layout:

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
        <p>{error.data?.message ?? "Route error"}</p>
        <Link to="/">To home</Link>
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div role="alert">
        <h1>Unexpected error</h1>
        <p>{error.message}</p>
        <Link to="/">To home</Link>
      </div>
    );
  }

  return <div role="alert">Unknown error</div>;
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

**`errorElement`** on a parent catches errors of **child** routes if they aren't caught closer. For an SPA without loaders it more often triggers on a **throw in render** of a child route component — an overlap with a classic boundary.

Loader example (if you later add data routers):

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

## Resetting the boundary on navigation

### Pattern 1: `key={location.pathname}`

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

A change of path **unmounts** the boundary → the state resets. Simple, but the state of child components is lost on **any** change of path (including the query string, if the key includes `search`).

### Pattern 2: `resetKeys` from react-error-boundary

```tsx
<ErrorBoundary
  FallbackComponent={SectionErrorFallback}
  resetKeys={[location.pathname]}
>
  <Outlet />
</ErrorBoundary>
```

Gentler: children aren't remounted entirely, only the boundary's error state resets.

### Pattern 3: `useNavigate` + reset in the fallback

```tsx
function SectionErrorFallback({ resetErrorBoundary }: FallbackProps) {
  const navigate = useNavigate();

  return (
    <div role="alert">
      <p>The section is temporarily unavailable</p>
      <button
        type="button"
        onClick={() => {
          resetErrorBoundary();
          navigate("/products");
        }}
      >
        Back to the catalog
      </button>
    </div>
  );
}
```

---

## QueryErrorResetBoundary

TanStack Query v5 exports **`QueryErrorResetBoundary`**: on `reset()` it resets queries' error state so that `useQuery` tries to fetch again after the boundary/route is fixed.

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

**`onReset={resetQueries}`** — the user clicks "Try again" in the fallback: the boundary clears the render error **and** Query drops `isError`, kicks off a refetch. Without this the reset button would show the stale error UI from the Query cache again.

Pairing with [06-query-advanced.md](06-query-advanced.md): after a reset it makes sense to `queryClient.invalidateQueries({ queryKey: ["products"] })` if the data is definitely broken.

---

## Protected routes and auth errors

From [12-refresh-flow.md](12-refresh-flow.md): on a failed refresh the user is sent to `/login`. An error boundary should **not** intercept the redirect — `Navigate` doesn't throw. If `ProtectedRoute` throws when there's no role:

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

The 403 lands in the layout's **`errorElement`** — show "Insufficient permissions", not a generic boundary message.

---

## Composing the providers in `main.tsx`

Order from outside in (as in [react-basic: Query provider](../react-basic/20-tanstack-query.md)):

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

`QueryErrorResetBoundary` — **inside** `QueryClientProvider`, usually in `AdminLayout` around `<Outlet />`, not at the root (so the login page doesn't share a reset with admin).

The root boundary — **around** `RouterProvider` or as an `errorElement` on the root route — your choice; the main thing is one explicit fatal fallback.

---

## Suspense and boundaries (preview)

[21-code-splitting.md](21-code-splitting.md) and [22-suspense-data.md](22-suspense-data.md) will add `<Suspense fallback={...}>`. Suspense does **not replace** an error boundary: a rejected promise in `useSuspenseQuery` requires a sibling **ErrorBoundary** or an `errorElement`. Keep:

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

## Common mistakes

**"errorElement catches onClick errors."** No — only loader/action/render in the route subtree.

**"key={pathname} on the entire AdminLayout."** It resets sidebar state and expanded accordions — key only on the content area.

**"Reset the boundary without resetting Query."** The "Retry" button shows the Query error panel again beneath the fixed render.

**"I duplicate the same JSX in the boundary and errorElement."** Extract a `GenericErrorPanel` into `src/shared/ui/`, but with **different** titles/actions per context.

**"Navigate in render without auth is caught by the boundary."** `Navigate` doesn't throw; check the conditions before the dangerous render.

---

## Checklist

- [ ] How `useRouteError` differs from the error in the boundary fallback props
- [ ] Why `QueryErrorResetBoundary` + `onReset`
- [ ] When `resetKeys` vs `key={pathname}` on a boundary
- [ ] Where in the provider tree the reset boundary sits
- [ ] How a 403 from `RequireAdmin` is shown through the Router

---

## Next

Next lesson: [16. Global error UX: toasts, retry, offline](16-global-error-ux.md) — a unified experience for API, network, and unexpected failures.
