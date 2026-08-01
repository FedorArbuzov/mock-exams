# 23. React Router: routes and navigation

## A scenario from work

The shop SPA has grown: you need separate URLs — `/` catalog, `/about`, clicking a product without `window.location` (a full reload kills state and the Query cache). A junior adds `<a href="/items/5">` — Vite returns a 404 on refresh. You need a **client router**: the URL changes, React mounts a different component, using the **History API** without an HTML round-trip.

In this course — **React Router v7** (`react-router-dom` in [`examples/package.json`](examples/package.json)).

## What you'll learn

- `BrowserRouter`, `Routes`, `Route`
- `Link` vs `<a>`
- `useNavigate` for programmatic navigation
- The basic structure of shop routes
- The connection to Query and the FastAPI detail endpoint

---

## Installation (already in examples)

```bash
npm install react-router-dom
```

---

## Minimal app

```tsx
// main.tsx
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
```

```tsx
// App.tsx
import { Routes, Route } from "react-router-dom";
import { CatalogPage } from "@/pages/CatalogPage";
import { AboutPage } from "@/pages/AboutPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<CatalogPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
```

`path="*"` — the **catch-all** 404 ([25-lab-router.md](25-lab-router.md)).

---

## `Link` — declarative navigation

```tsx
import { Link } from "react-router-dom";

<nav>
  <Link to="/">Catalog</Link>
  <Link to="/about">About the shop</Link>
</nav>
```

| | `<Link to>` | `<a href>` |
|---|-------------|------------|
| Reload | no | yes (full navigation) |
| SPA state | preserved | lost |
| Active styling | `NavLink` | manual |

```tsx
import { NavLink } from "react-router-dom";

<NavLink
  to="/"
  className={({ isActive }) => (isActive ? "active" : undefined)}
>
  Catalog
</NavLink>
```

---

## `useNavigate` — imperatively

After a successful POST — navigate to the product card:

```tsx
import { useNavigate } from "react-router-dom";

function CreateItemForm() {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: createItem,
    onSuccess: (item) => {
      navigate(`/items/${item.id}`);
    },
  });
}
```

Replace history (no "Back" during checkout):

```tsx
navigate("/cart", { replace: true });
```

Navigate(-1) — like the browser back button.

---

## Path parameters (preview)

```tsx
<Route path="/items/:itemId" element={<ItemDetailPage />} />
```

```tsx
import { useParams } from "react-router-dom";

function ItemDetailPage() {
  const { itemId } = useParams();
  const id = Number(itemId);
  // useQuery(['items', id], ...) — see 24-nested-routes.md
}
```

Detail fetch: `GET /api/v1/items/{id}` on `:8090`.

---

## Vite and refresh on a deep link

The dev server must serve `index.html` for unknown paths — Vite does this by default. In production nginx:

```nginx
try_files $uri /index.html;
```

Otherwise a refresh of `/items/5` → 404 from the static server, not from React.

---

## Composition with Query

The Router does **not** load data — it only picks the screen. Each page calls its own hooks:

```text
/catalog     → useItems()
/items/:id   → useQuery(['items', id])
```

The Query cache survives navigation between shop pages.

---

## Folder structure (recommendation)

```text
src/
  pages/
    CatalogPage.tsx
    ItemDetailPage.tsx
    NotFoundPage.tsx
  components/
  App.tsx
```

Conventions — [35-project-structure.md](35-project-structure.md).

---

## Common mistakes

1. **`<a href="/">` in an SPA** — full reload, resets the Query dev cache.

2. **Router outside BrowserRouter** — "useRoutes() may be used only in context".

3. **Duplicate Routers** — two `BrowserRouter`s break history.

4. **Forgetting the catch-all `*`** — unknown URLs — a blank screen.

5. **navigate in render** — an infinite loop; only in effects/handlers.

6. **itemId as a string without Number** — `useQuery` with `"5"` vs 5 — different keys.

---

## Summary

React Router maps **URL → component tree**. `BrowserRouter` + `Routes`/`Route` define the table. `Link`/`NavLink` — navigation without a reload. `useNavigate` — after forms and mutations. Catch-all for 404. Deep links require a fallback to `index.html`. Data still comes from FastAPI via Query.

---

## Checklist

- How does Link differ from an anchor?
- Where do you declare the route `/items/:itemId`?
- How do you navigate to a page after a POST?
- What does `path="*"` render?
- Why does refreshing `/items/1` break without a server fallback?
- Who loads the JSON — the Router or useQuery?

Next lesson: [24. Nested routes and layout](24-nested-routes.md).
