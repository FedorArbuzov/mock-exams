# 25. Lab: catalog / product / 404

## Scenario

Ticket **SHOP-310**: "Shop routes — a list, a card by id, a 404 for garbage in the URL." Data from `:8090` via Query ([22-lab-query.md](22-lab-query.md)), navigation via React Router ([23-react-router.md](23-react-router.md), [24-nested-routes.md](24-nested-routes.md)).

**Time:** ~60–75 minutes.

---

## Setup

```bash
cd deploy/fastapi && docker compose up -d --build
cd courses/react-basic/examples && npm install && npm run dev
```

`BrowserRouter` + `QueryClientProvider` in `main.tsx`.

Structure:

```text
src/
  components/
    ShopLayout.tsx
  pages/
    CatalogPage.tsx
    ItemDetailPage.tsx
    NotFoundPage.tsx
  App.tsx
```

---

## Task 1. `ShopLayout`

- Header: logo Link `/`, nav Link `/` and `/about` (About — a stub `<p>About the shop</p>`);
- `<Outlet />` in `<main>`;
- a one-line footer.

---

## Task 2. `CatalogPage`

- `useItems()` from [22-lab-query.md](22-lab-query.md) or inline `useQuery`;
- loading / error / empty / list;
- each product — **`Link to={`/items/${item.id}`}`** with name and price.

---

## Task 3. `ItemDetailPage`

- `useParams<{ itemId: string }>()`;
- parse `Number(itemId)`, invalid → "Invalid id";
- `useQuery` key `["items", id]`, fn `GET /api/v1/items/${id}`, `enabled` when the id is valid;
- Link "← Catalog" to `/`;
- UI loading/error/not found.

---

## Task 4. `NotFoundPage`

```tsx
export function NotFoundPage() {
  return (
    <main>
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/">Go home</Link>
    </main>
  );
}
```

---

## Task 5. `App.tsx` routes

```tsx
<Routes>
  <Route element={<ShopLayout />}>
    <Route index element={<CatalogPage />} />
    <Route path="items/:itemId" element={<ItemDetailPage />} />
    <Route path="about" element={<p>About the shop — mock-exams</p>} />
  </Route>
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

404 **without** the shop header — a global catch-all outside the layout (an intentional UX choice).

---

## Verification

| URL | Expectation |
|-----|----------|
| `/` | list from the API |
| `/items/1` | detail of the Demo item |
| `/items/999999` | error from the API (404) |
| `/items/abc` | "Invalid id" with no extra fetch |
| `/nope` | NotFoundPage with no header |
| Click a Link back and forth | no full reload, Query cache |

Refresh on `/items/1` — the page loads (Vite dev OK).

Open the React Query Devtools — on the second visit to a detail page you may get a cache hit for `["items", 1]`.

---

## Task 6. (Optional) `NavLink` active

Highlight "Catalog" on `/` and `/items/:id` — the `end` prop or a custom `isActive`.

---

## Success criteria

- [ ] Layout + Outlet, no duplicate header
- [ ] Index = catalog
- [ ] Detail by params + Query
- [ ] Global 404
- [ ] Links, not `<a href>`
- [ ] typecheck OK

---

## Common mistakes in the lab

1. **Outlet forgotten** — blank main.

2. **`<a href="/items/1">`** — full reload.

3. **Detail id from state** — broken deep link.

4. **404 inside layout only** — `/nope` shows catalog routes wrong; you need an outer `*`.

5. **Same queryKey for list/detail** — stale wrong shape.

---

## Related courses

- Router basics: [23-react-router.md](23-react-router.md)
- Nested: [24-nested-routes.md](24-nested-routes.md)
- URL filters next: [26-url-state.md](26-url-state.md)
- API: [deploy/fastapi](../../deploy/fastapi/README.md)

---

## Lab summary

The shop SPA gains production-grade navigation: layout, catalog index, item detail from `:8090`, an isolated 404. URLs are shareable; Query caches between screens.

---

## Checklist before submitting

- Where is `:itemId` declared?
- What does the user see on `/items/999999`?
- Why is the 404 route outside ShopLayout?
- Does the back button work after a Link?

Next lesson: [26. URL as state: search params](26-url-state.md).
