# 30. Lab: theme and cart via Context

## Scenario

Product owner: "On the demo shop, the **dark theme** and the **cart** should work from any page — catalog, product card, 404. Without prop drilling." You implement `ThemeProvider` and `CartProvider` per [29-context.md](29-context.md), wire them into the existing Vite project from [03-lab-first-app.md](03-lab-first-app.md) and the product list [19-lab-fetch-items.md](19-lab-fetch-items.md).

The FastAPI backend on `:8090` serves the catalog; the cart is still **client-only** (like in [11-lab-state.md](11-lab-state.md), but global). Checkout to the API — in the capstone [38-capstone.md](38-capstone.md).

**Time:** ~50–65 minutes.  
**Code:** `courses/react-basic/examples/src/`.

---

## What you'll build

- `ThemeProvider` + `useTheme`, a toggle in `Header`
- `CartProvider` + `useCart`: add, remove, qty, badge count
- `ProductCard` and the `/cart` page without passing props through the layout
- CSS variables for light/dark ([33-styling.md](33-styling.md))
- (Optional) persist the cart to `localStorage`

**Prerequisites:** [28-custom-hooks.md](28-custom-hooks.md), [29-context.md](29-context.md), [23-react-router.md](23-react-router.md).

---

## Setup

```bash
cd courses/react-basic/examples
npm install
npm run dev    # :5173
# FastAPI :8090 — optional for the product list
```

Structure after the lab:

```text
src/
├── context/
│   ├── ThemeContext.tsx
│   └── CartContext.tsx
├── components/
│   ├── Header.tsx
│   ├── ProductCard.tsx
│   └── CartBadge.tsx
├── pages/
│   ├── CatalogPage.tsx
│   └── CartPage.tsx
├── app/
│   └── providers.tsx
└── main.tsx
```

---

## Task 1. ThemeContext

### Steps

1. Create `context/ThemeContext.tsx` following the example from [29-context.md](29-context.md).
2. In `index.css`, add variables:

```css
:root,
[data-theme="light"] {
  --bg: #fafafa;
  --text: #111;
  --card: #fff;
}

[data-theme="dark"] {
  --bg: #121212;
  --text: #eee;
  --card: #1e1e1e;
}

body {
  background: var(--bg);
  color: var(--text);
}
```

3. On `<html>` or `<body>`, in a `useEffect` inside the Provider, set `document.documentElement.dataset.theme = theme`.

### Criteria

- [ ] The button in the Header toggles the theme
- [ ] Reloading the page resets the theme (OK for the MVP; persist — extension B)
- [ ] `useTheme()` outside the Provider throws a clear error

---

## Task 2. CartContext

### Model

```tsx
export type CartLine = {
  id: number;
  title: string;
  qty: number;
};

export type CartContextValue = {
  lines: CartLine[];
  addLine: (item: { id: number; title: string }) => void;
  removeLine: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  totalItems: number;
  clear: () => void;
};
```

### Rules

- `addLine`: if the `id` already exists — `qty + 1`, otherwise a new line with `qty: 1`
- Immutability: new arrays/objects ([javascript-basic 07-objects](../javascript-basic/07-objects.md))
- `totalItems` — sum of qty (can be `useMemo`)

### Criteria

- [ ] "Add to cart" on the card updates the badge in the Header
- [ ] `/cart` shows the list, +/- qty, removing a line
- [ ] Empty cart — empty state ([31-ui-states.md](31-ui-states.md))

---

## Task 3. Providers and Router

`app/providers.tsx`:

```tsx
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>{children}</CartProvider>
    </ThemeProvider>
  );
}
```

`main.tsx`:

```tsx
<StrictMode>
  <AppProviders>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AppProviders>
</StrictMode>
```

A layout route with `Header` + `<Outlet />` ([24-nested-routes.md](24-nested-routes.md)).

### Criteria

- [ ] `/catalog` and `/cart` see the same cart state
- [ ] No `theme` / `cart` props on intermediate layout components

---

## Task 4. ProductCard and CatalogPage

Wire in the data from `:8090` if the stand is up:

```tsx
const res = await fetch("http://localhost:8090/api/v1/items");
const { items } = await res.json();
```

Or a mock array for offline.

`ProductCard`:

```tsx
function ProductCard({ item }: { item: { id: number; title: string } }) {
  const { addLine } = useCart();
  return (
    <article className="card">
      <h3>{item.title}</h3>
      <button type="button" onClick={() => addLine(item)}>
        Add to cart
      </button>
    </article>
  );
}
```

### Criteria

- [ ] `key={item.id}` on the list ([07-lists-keys.md](07-lists-keys.md))
- [ ] A double click on "Add to cart" increases qty, doesn't duplicate lines

---

## Task 5. CartPage

- A table/list: title, qty controls, remove
- A "Clear cart" button
- A "Continue shopping" link → `/catalog`
- Empty: an illustration/text "Your cart is empty"

---

## Self-check (lab checklist)

- [ ] The theme works on Catalog and Cart
- [ ] The badge shows `totalItems`
- [ ] Router navigation doesn't reset the cart
- [ ] No eslint warnings `react-hooks/exhaustive-deps` in the providers
- [ ] Components use `useCart` / `useTheme`, not the raw Context

---

## Extensions (optional)

| Level | Task |
|---------|--------|
| A | `useLocalStorage` for the cart ([28-custom-hooks.md](28-custom-hooks.md)) |
| B | Persist the theme to localStorage |
| C | A "Product added" toast on addLine |
| D | Sync qty with the URL query `?cart=1,2` ([26-url-state.md](26-url-state.md)) |

---

## Common mistakes

1. **Provider inside a single route only** — the cart resets when the page changes. The Provider goes **above** `BrowserRouter` or right below it, but **above** `Routes`.

2. **Mutating `lines.push`** — React doesn't see the changes. Always a new array.

3. **`value={{ lines, addLine }}` without memo** — extra re-renders of the whole subtree.

4. **Duplicating items from Query in the Cart** — the cart holds only `{ id, title, qty }`, not the whole catalog.

5. **CORS on fetch** — if `:8090` isn't up, use a mock; see [18-cors-fastapi.md](18-cors-fastapi.md).

---

## Related courses

| Topic | Lesson |
|------|------|
| Context API | 29 |
| Custom hooks | 28 |
| UI empty state | 31 |
| Theme styling | 33 |
| Capstone cart + API | 38 |

---

## After the lab

Commit to your branch (if you keep a journal). Next lesson: [31. UI states](31-ui-states.md) — loading, error, empty for the catalog fetch.
