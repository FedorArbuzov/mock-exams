# 14. Error boundaries: what they catch and what they don't

## Real-world scenario

Friday, 4:47 PM. The admin SPA against Django `:8092` is already in staging. QA opens `/products`, clicks "Edit" — a white screen. In the console: `TypeError: Cannot read properties of undefined (reading 'slug')`. Sentry is silent: the error is **in render**, but you have no error boundary — React **unmounted** the entire tree up to `<html>`. The user sees a blank page; a refresh only helps until the next broken product.

The tech lead writes in Slack: "We need a fallback UI, not a white screen of death. Async Query errors are separate — that's not a boundary." You open [react-basic: UI states](../react-basic/31-ui-states.md) — loading/error for fetch is already there, but Query won't catch a **synchronous component crash**.

After [13-lab-auth.md](13-lab-auth.md) auth works; now we protect the **render tree** from failures in child components.

## What you'll learn

- What an **error boundary** is and why you need one in a production SPA
- Which errors a boundary **catches** and which it **doesn't**
- The class component: `getDerivedStateFromError`, `componentDidCatch`
- The functional approach: the `react-error-boundary` library
- Granularity: a boundary per route vs per widget
- The connection with TanStack Query ([06-query-advanced.md](06-query-advanced.md)) — different layers

---

## Two worlds of errors in React

| Type | Example | Who catches it |
|-----|--------|-----------|
| **Render** | `product.category.slug` when `category === null` | **Error boundary** |
| **Event handler** | `onClick` → `JSON.parse(bad)` | `try/catch` in the handler |
| **Async / fetch** | `queryFn` rejected | `isError`, `errorElement`; a boundary does **not** catch it |
| **useEffect** | an unhandled rejection in an effect | `try/catch` / `.catch()` in an async effect |

An error boundary works like a **try/catch for JSX**: if an unhandled exception is thrown while building the tree (during render or a child class component's lifecycle), React looks for the nearest boundary up the tree and shows a **fallback UI** instead of the crashed branch.

```text
App
 └── QueryClientProvider
      └── AuthProvider
           └── Router
                └── ErrorBoundary          ← catches the ProductsTable crash
                     └── ProductsPage
                          └── ProductRow   ← throw here
```

Sibling branches **don't** crash: the sidebar with navigation stays if the boundary wraps only `<Outlet />`.

---

## The class error boundary (the React canon)

Officially a boundary is only a **class component** (as of 2025 React 19 hasn't added a `useErrorBoundary` hook to core):

```tsx
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
};

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
    // here: Sentry, LogRocket, backend /api/v1/client-errors/
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      const { fallback } = this.props;
      return typeof fallback === "function"
        ? fallback(error, this.reset)
        : fallback;
    }
    return this.props.children;
  }
}
```

**`getDerivedStateFromError`** — a pure function, only updates state (no side effects). **`componentDidCatch`** — logging, analytics. **`reset`** — resets the boundary state; children **remount** on the next render (important for "Try again").

### Usage on the products page

```tsx
function ProductEditorPanel({ productId }: { productId: number }) {
  const { data } = useProduct(productId); // Query — see below about async

  // Dangerous: if the API returned an object without category, and the type "lied"
  return (
    <section>
      <h2>{data.title}</h2>
      <p>Category: {data.category.slug}</p>
    </section>
  );
}

function ProductsRoute() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div role="alert" className="error-panel">
          <h2>Couldn't display the product card</h2>
          <p>{error.message}</p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </div>
      )}
    >
      <ProductEditorPanel productId={42} />
    </ErrorBoundary>
  );
}
```

A boundary does **not replace** defensive coding: optional chaining (`data?.category?.slug ?? "—"`) is still needed. A boundary is the **last line of defense** when something does crash anyway.

---

## `react-error-boundary` for a functional style

In [`examples/package.json`](examples/package.json) you can add `react-error-boundary` — a thin wrapper with `FallbackProps`, `resetKeys`, `onReset`:

```tsx
import { ErrorBoundary } from "react-error-boundary";

function ProductFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div role="alert">
      <p>Display error: {error.message}</p>
      <button type="button" onClick={resetErrorBoundary}>
        Reset
      </button>
    </div>
  );
}

export function SafeProductEditor(props: { productId: number }) {
  return (
    <ErrorBoundary
      FallbackComponent={ProductFallback}
      onError={(error, info) => {
        console.error(error, info.componentStack);
      }}
      resetKeys={[props.productId]}
    >
      <ProductEditorPanel {...props} />
    </ErrorBoundary>
  );
}
```

**`resetKeys`** — when `productId` changes, the boundary automatically resets the error and mounts the new product. Without this the user would be stuck on the fallback after navigating to another id.

---

## What a boundary does NOT catch

1. **Errors in event handlers** — wrap them in `try/catch`:

```tsx
async function handleSave() {
  try {
    await saveProduct(form);
  } catch (e) {
    toast.error("Save failed");
  }
}
```

2. **Async code inside useEffect / queryFn** — the rejection doesn't bubble up into render. Use `isError` from Query ([react-basic: TanStack Query](../react-basic/20-tanstack-query.md)).

3. **Errors in the boundary itself** — the fallback can crash too; keep the fallback **simple** (text + a button).

4. **SSR** — on the server a boundary behaves differently; in a Vite SPA ([00-environment.md](00-environment.md)) that's rarely a problem.

5. **Errors in Server Components** — a different model (Next.js); our course is a client SPA.

---

## Granularity: one boundary for the whole app?

A **root boundary** in `main.tsx` — a must-have: it catches unexpected crashes and shows "Something went wrong" instead of a white screen.

A **route-level boundary** — isolation: a products table crash doesn't kill the layout with the [AuthProvider](10-auth-context.md) and sidebar.

**Widget-level** — a heavy chart or a markdown preview from a third-party lib: the widget crashed — the rest of the admin form is alive.

```tsx
// src/app/RootErrorBoundary.tsx — a minimal fallback
export function RootErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <main className="fatal-error">
          <h1>The application is temporarily unavailable</h1>
          <button type="button" onClick={() => window.location.reload()}>
            Reload the page
          </button>
        </main>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
```

Don't put a boundary **on every** `<li>` — overhead and noise in the logs with no benefit.

---

## Error boundary vs Query error state

After [07-lab-django-products.md](07-lab-django-products.md) the list loads through Query:

```tsx
function ProductsList() {
  const { data, isError, error, refetch } = useProducts();

  if (isError) {
    return (
      <div role="alert">
        <p>{error.message}</p>
        <button type="button" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return <ProductsTable rows={data.results} />;
}
```

`isError` — an **expected** network/API failure. An error boundary — an **unexpected** bug in `ProductsTable` (for example, `rows.map` when `rows` is undefined due to a race). Both layers are **compatible**.

---

## Integration with the typed API ([04-api-client.md](04-api-client.md))

A boundary doesn't know about `ApiError.status`. In `componentDidCatch` / `onError`, send:

- `error.message`, `error.stack`
- `info.componentStack`
- context: route, user id from [useAuth](10-auth-context.md) (no tokens!)

Don't log the JWT access token to Sentry.

---

## Common mistakes

**"I'll add an ErrorBoundary — the Query errors will disappear."** No. A 401/500 from `/api/v1/products/` is `isError`, the refresh flow from [12-refresh-flow.md](12-refresh-flow.md), not a boundary.

**"A boundary around the whole App with no route boundaries."** One broken widget throws the user onto the generic fallback of the entire application.

**"The fallback renders the same ProductEditorPanel."** An infinite crash loop. The fallback must be a **different** tree.

**"reset without changing the cause."** The user clicks "Try again" — the same null.category again. You need a data fix or navigation back.

**"I catch fetch errors in a boundary via throw in render."** An anti-pattern:

```tsx
// Bad: throw in render because of async
if (isError) throw error;
```

Use an explicit error UI; throw in render for async — only with Suspense ([22-suspense-data.md](22-suspense-data.md)), not for ordinary Query.

---

## Checklist

- [ ] Name three types of errors a boundary does **not** catch
- [ ] Explain the difference between `getDerivedStateFromError` and `componentDidCatch`
- [ ] Why `resetKeys` when a route param changes
- [ ] Where the root boundary is, where route-level ones are in an admin SPA
- [ ] Why Query `isError` and a boundary are different layers

---

## Next

Next lesson: [15. Boundaries + Router + Query reset](15-boundaries-router.md) — `errorElement`, the pairing with React Router 7 and resetting errors on navigation.
