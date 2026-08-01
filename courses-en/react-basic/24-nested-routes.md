# 24. Nested routes, layout, and params

## A scenario from work

Shop SPA: a shared **header** (logo, nav, cart) on the catalog and the product card, but not on the 404 page. A junior copies `<ShopHeader />` into every page — when a link changes, one page gets forgotten. The product detail `/items/42` must read the **id from the URL**, not from `useState` after a click — otherwise the "share" link doesn't work.

**Nested routes** + **`Outlet`** — the layout once, child routes inside. **`useParams`** — parameters from the path.

## What you'll learn

- Layout routes with `Outlet`
- Nested `Route`s without duplicating the path
- `useParams`, validating the id
- Index routes
- Loaders (v7 overview) — without going deep

---

## Layout route

```tsx
// components/ShopLayout.tsx
import { Outlet, Link } from "react-router-dom";

export function ShopLayout() {
  return (
    <div className="shop">
      <header>
        <Link to="/">Shop</Link>
        <nav>
          <Link to="/">Catalog</Link>
          <Link to="/about">About us</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>© mock-exams shop</footer>
    </div>
  );
}
```

`<Outlet />` — the spot where the Router inserts the **child** route.

---

## Declaring nested routes

```tsx
<Routes>
  <Route element={<ShopLayout />}>
    <Route index element={<CatalogPage />} />
    <Route path="items/:itemId" element={<ItemDetailPage />} />
    <Route path="about" element={<AboutPage />} />
  </Route>
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

| URL | What's in the Outlet |
|-----|--------------|
| `/` | `CatalogPage` (index) |
| `/items/42` | `ItemDetailPage` |
| `/about` | `AboutPage` |

The parent **without** a `path` — just a layout wrapper. Child paths are **relative** (`items/:itemId`, not `/items/...` — both styles are possible; here relative to a parent with no path → `/items/:itemId`).

An explicit parent path:

```tsx
<Route path="/" element={<ShopLayout />}>
  <Route index element={<CatalogPage />} />
  ...
</Route>
```

---

## Index route

`index` — the default child on an exact match of the parent URL (`/`). Don't confuse it with a redirect:

```tsx
<Route index element={<Navigate to="catalog" replace />} /> // a different pattern
```

---

## `useParams`

```tsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Item } from "@/api/types";

export function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const id = Number(itemId);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["items", id],
    queryFn: ({ signal }) => api<Item>(`/api/v1/items/${id}`, { signal }),
    enabled: Number.isFinite(id) && id > 0,
  });

  if (!Number.isFinite(id) || id <= 0) {
    return <p>Invalid product id.</p>;
  }

  if (isPending) return <p>Loading…</p>;
  if (isError) return <p role="alert">{error.message}</p>;
  if (!data) return <p>Product not found.</p>;

  return (
    <article>
      <Link to="/">← Catalog</Link>
      <h1>{data.name}</h1>
      <p>{data.price.toFixed(2)} €</p>
      {data.description && <p>{data.description}</p>}
    </article>
  );
}
```

FastAPI 404 → `api()` throws → `isError`. An invalid id in the URL — a client-side check before the fetch.

---

## Link from the catalog

```tsx
import { Link } from "react-router-dom";

<Link to={`/items/${item.id}`}>{item.name}</Link>
```

The URL is the **source of truth** for the detail screen; Query caches by `["items", id]`.

---

## Multiple params

```tsx
<Route path="shops/:shopId/items/:itemId" element={...} />

const { shopId, itemId } = useParams();
```

queryKey: `["shops", shopId, "items", itemId]`.

---

## Optional segments (overview)

```tsx
<Route path="items/:itemId?" ... />
```

Rare; more often separate routes or search params ([26-url-state.md](26-url-state.md)).

---

## Loaders (React Router v7, overview)

RR v7 supports a **loader** on a route for data before render (like Remix). In this course the main data layer is **TanStack Query**; loaders are an alternative for SSR/unified router data. Don't mix the two sources without rules.

```tsx
// overview — not required in the basic labs
<Route
  path="items/:itemId"
  loader={({ params }) => fetchItem(params.itemId)}
  element={<ItemDetailPage />}
/>
```

The capstone can choose Query-only — enough for an SPA to `:8090`.

---

## 404 inside and outside the layout

```tsx
<Route element={<ShopLayout />}>
  {/* shop pages */}
  <Route path="*" element={<NotFoundPage />} />
</Route>
```

Or a global `*` **without** a header — as in [25-lab-router.md](25-lab-router.md).

---

## Common mistakes

1. **Forgetting `<Outlet />`** — a layout with no content.

2. **An absolute path in a child** — `path="/items"` can break nesting; watch the RR v7 docs.

3. **id from location.state instead of params** — a refresh loses the state.

4. **useParams without enabled in Query** — a fetch with `NaN`.

5. **Duplicate layouts** — the header isn't in the layout route.

6. **One queryKey for list and detail** — different keys `["items"]` vs `["items", id]`.

---

## Summary

The layout route renders the shared shop shell and `<Outlet />` for the child pages. The index route — the catalog at `/`. `useParams` extracts `itemId` for `GET /api/v1/items/:id`. Validate the id on the client; the 404 comes from the API. Nested routes remove copy-paste header/footer. Data — TanStack Query, don't duplicate it in a router loader without need.

---

## Checklist

- Where does `<Outlet />` render?
- How does an index route differ from path=""?
- How do you type `useParams` in TS?
- Why `enabled` in useQuery for the detail?
- What breaks if you pass the id only through state?
- How does a nested route affect the URL `/items/5`?

Next lesson: [25. Lab: catalog / product / 404](25-lab-router.md).
