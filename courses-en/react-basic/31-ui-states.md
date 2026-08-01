# 31. UI states: loading, error, empty

## Introduction: "The user stares at a blank screen for 3 seconds"

QA on the staging shop: they open `/catalog`, `:8090` responds slowly — a **blank** page with no explanation. Then they drop the network — a **red stack trace** in the Vite overlay. Product: "We need a skeleton, retry, and 'no products'."

The three states of an async UI are a **mandatory** contract for a data screen:

1. **Loading** — a request is in flight; show a skeleton/spinner.
2. **Error** — a network failure or 500, with a "Retry" button.
3. **Empty** — a successful response, but 0 items (the filter is too strict or the catalog is empty).

After [17-fetch-react.md](17-fetch-react.md) and Query ([20-tanstack-query.md](20-tanstack-query.md)), data arrives asynchronously. Context ([29-context.md](29-context.md)) and the cart don't remove these states from the catalog page. This chapter is about **UX patterns**, reusable components, and a11y.

## What you'll learn

- The state matrix for the shop catalog.
- Skeleton vs spinner — when to use which.
- Error UI + `refetch` / retry.
- Empty state — copy and CTA.
- Integration with TanStack Query `isLoading`, `isError`, `isFetching`.
- Common anti-patterns in mock-exams and in prod.

---

## The state model

```text
                    ┌─────────────┐
                    │   idle /    │
                    │  loading    │──► Skeleton / Spinner
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐  ┌──────────┐  ┌─────────┐
         │ error  │  │ success  │  │ success │
         │        │  │ + empty  │  │ + data  │
         └────────┘  └──────────┘  └─────────┘
              │            │            │
              ▼            ▼            ▼
         Retry UI     Empty UI     Content
```

**Idle** — before the first fetch (Query: `isLoading && !data`).  
**Refetch** — `isFetching && data` — show stale data + a subtle indicator ([21-mutations.md](21-mutations.md)).

---

## Loading: skeleton and spinner

### Spinner — short operations

An "Add to cart" mutation, logout — a button with `disabled` + an inline spinner.

### Skeleton — lists and cards

The user sees the **structure** of the upcoming layout — less layout shift (CLS).

```tsx
function ProductCardSkeleton() {
  return (
    <article className="card skeleton" aria-hidden="true">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-text" />
      <div className="skeleton-block skeleton-button" />
    </article>
  );
}

function ProductListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

CSS ([33-styling.md](33-styling.md)):

```css
.skeleton-line {
  height: 1rem;
  background: linear-gradient(90deg, var(--card) 25%, #e0e0e0 50%, var(--card) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  border-radius: 4px;
}
```

**a11y:** on the loading container — `aria-busy="true"`, `aria-live="polite"` when it switches to content; the skeleton — `aria-hidden`.

---

## Error: message and retry

```tsx
type ErrorPanelProps = {
  message?: string;
  onRetry?: () => void;
};

function ErrorPanel({
  message = "Failed to load the catalog. Check the network and the API on :8090.",
  onRetry,
}: ErrorPanelProps) {
  return (
    <div role="alert" className="error-panel">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
```

### Distinguish error types

| Case | UI |
|--------|-----|
| Network offline | "No connection" + retry |
| 404 item | "Product not found" + link to catalog |
| 500 server | "Service temporarily unavailable" |
| CORS misconfig | dev hint → [18-cors-fastapi.md](18-cors-fastapi.md) |

Don't show the raw `error.stack` to the user; log it to the console / Sentry (react-intermediate).

---

## Empty state

**Empty ≠ Error.** HTTP 200, `{ items: [], total: 0 }`.

```tsx
function EmptyCatalog({ onResetFilters }: { onResetFilters?: () => void }) {
  return (
    <div className="empty-state">
      <p>No products found</p>
      <p className="muted">Change the filters or check back later.</p>
      {onResetFilters && (
        <button type="button" onClick={onResetFilters}>
          Reset filters
        </button>
      )}
    </div>
  );
}
```

Empty cart — [30-lab-context.md](30-lab-context.md). Empty search — different copy: "Nothing matches '{q}'".

**CTA:** a link to `/catalog`, a reset button, a support contact — one primary action.

---

## Orchestrator component: the AsyncBoundary pattern

```tsx
type AsyncState<T> = {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

function CatalogBody({ state }: { state: AsyncState<Item[]> }) {
  const { data, isLoading, isError, error, refetch } = state;

  if (isLoading && !data) {
    return <ProductListSkeleton />;
  }

  if (isError) {
    return (
      <ErrorPanel
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data || data.length === 0) {
    return <EmptyCatalog />;
  }

  return <ProductList items={data} />;
}
```

**Early returns** top to bottom: loading → error → empty → success ([08-conditional-rendering.md](08-conditional-rendering.md)).

---

## TanStack Query mapping

```tsx
function CatalogPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
  });

  const items = data?.items ?? [];

  return (
    <section aria-busy={isLoading}>
      {isFetching && data && (
        <p className="sr-only" aria-live="polite">
          Updating…
        </p>
      )}
      <CatalogBody
        state={{
          data: items,
          isLoading,
          isError,
          error: error as Error | null,
          refetch,
        }}
      />
    </section>
  );
}
```

Query distinguishes:
- `isLoading` — no cached data, the first fetch
- `isFetching` — any fetch in flight
- `isPending` (v5) — see the docs for your version in `examples/package.json`

**Placeholder data / initialData** — reduces the loading flash on revisit.

---

## Suspense (overview)

React **Suspense** + lazy routes ([24-nested-routes.md](24-nested-routes.md)):

```tsx
<Suspense fallback={<ProductListSkeleton />}>
  <CatalogPage />
</Suspense>
```

Query's `useSuspenseQuery` — in react-intermediate; in basic, explicit flags are enough.

---

## Reusable project components

Recommended folder `src/components/feedback/`:

| Component | Purpose |
|-----------|------------|
| `Spinner` | inline loading |
| `ProductListSkeleton` | catalog |
| `ErrorPanel` | error + retry |
| `EmptyState` | generic icon + title + action |

Props via TypeScript: [32-typescript-react.md](32-typescript-react.md).

---

## mock-exams shop scenario

1. User opens `/catalog` — 6 skeleton cards.
2. FastAPI `:8090` `/api/v1/items` — 200, 1 demo item — the list.
3. User applies the filter "zzz" — empty state.
4. Stop docker — error + retry; after `docker compose up` — retry works.

An optional health check in the footer: `GET /health` ([18-cors-fastapi.md](18-cors-fastapi.md)).

---

## Common mistakes

**A single boolean `loading`** — you can't tell the initial load from a background refetch.

**A full-viewport spinner for 5s** — no skeleton; poor UX.

**Empty on error** — a `catch` swallows it and sets `items = []`.

**No `role="alert"`** on the error — screen readers don't announce it.

**An infinite retry loop** — limit attempts or use exponential backoff ([javascript-basic 28-lab-async](../javascript-basic/28-lab-async.md)).

**Forgetting a loading state on the mutation button** — a double form submit ([21-mutations.md](21-mutations.md)).

---

## Summary

Every data-driven screen of the shop SPA must explicitly handle **loading**, **error**, and **empty**. Skeleton for lists, ErrorPanel with retry, Empty with a CTA. Query gives you the flags — your UI renders them. The context cart's empty state overlaps — reuse a single `EmptyState`.

## Checklist

- [ ] The order of early returns on the catalog page
- [ ] The difference between `isLoading` and `isFetching` in Query
- [ ] Empty vs error vs "no search results"
- [ ] a11y: aria-busy, role=alert
- [ ] Where the feedback components live in the structure ([35-project-structure.md](35-project-structure.md))

Next lesson: [32. TypeScript in React](32-typescript-react.md).
