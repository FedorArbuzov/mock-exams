# 13. Lab: Catalog Filter

## Why this lab

[12-lifting-state.md](12-lifting-state.md) covered lifting state to a parent. This **lab** builds a mini catalog page for the mock-exams shop: `CategoryFilter` + `ProductGrid`, a shared `category` in `CatalogPage`, and a derived list without a second `useState`. Mock data has a `category` field; the same fields will later come from FastAPI on `:8090`.

You'll build a controlled select, an empty state, and immutability — and see that siblings stay **in sync** without prop drilling more than one level deep.

## Prerequisites

- [06-lab-props.md](06-lab-props.md), [11-lab-state.md](11-lab-state.md).
- `npm run dev` in `examples/`.
- Reference solution: [`examples/solutions/13-catalog-filter/`](examples/solutions/).

---

## Task 1. Extend the Product type

In `src/types/product.ts`:

```tsx
export type Product = {
  id: number;
  title: string;
  price: number;
  category: "electronics" | "home" | "office";
  badge?: string;
};
```

Update `MOCK_PRODUCTS` in `App.tsx` (at least 6 products, covering all three categories):

```tsx
const MOCK_PRODUCTS: Product[] = [
  { id: 1, title: "Mechanical Keyboard", price: 79.99, category: "electronics", badge: "Sale" },
  { id: 2, title: "USB-C Hub", price: 34.5, category: "electronics" },
  { id: 3, title: "Desk Lamp", price: 49.0, category: "home" },
  { id: 4, title: "Office Chair", price: 299.0, category: "office" },
  { id: 5, title: "Notebook Set", price: 12.0, category: "office" },
  { id: 6, title: "Smart Bulb", price: 19.99, category: "home" },
];
```

---

## Task 2. CategoryFilter (controlled)

Create `src/components/CategoryFilter.tsx`:

```tsx
export type Category = "all" | "electronics" | "home" | "office";

type CategoryFilterProps = {
  value: Category;
  onChange: (next: Category) => void;
};

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <label className="category-filter">
      Category
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Category)}
      >
        <option value="all">All</option>
        <option value="electronics">Electronics</option>
        <option value="home">Home</option>
        <option value="office">Office</option>
      </select>
    </label>
  );
}
```

**Criterion:** the component **does not** contain a `useState` for category.

---

## Task 3. ProductGrid (presentational)

Create `src/components/ProductGrid.tsx`:

```tsx
import { ProductCard } from "./ProductCard";
import type { Product } from "../types/product";

type ProductGridProps = {
  products: Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return <p className="empty">No products in this category</p>;
  }

  return (
    <div className="catalog-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## Task 4. CatalogPage — lift state

Create `src/components/CatalogPage.tsx`:

```tsx
import { useState } from "react";
import type { Product } from "../types/product";
import { CategoryFilter, type Category } from "./CategoryFilter";
import { ProductGrid } from "./ProductGrid";

type CatalogPageProps = {
  products: Product[];
};

export function CatalogPage({ products }: CatalogPageProps) {
  const [category, setCategory] = useState<Category>("all");

  const visibleProducts =
    category === "all"
      ? products
      : products.filter((p) => p.category === category);

  return (
    <section className="catalog-page">
      <CategoryFilter value={category} onChange={setCategory} />
      <ProductGrid products={visibleProducts} />
    </section>
  );
}
```

In `App.tsx`:

```tsx
import { CatalogPage } from "./components/CatalogPage";

export function App() {
  return (
    <main className="app">
      <h1>Shop — react-basic</h1>
      <CatalogPage products={MOCK_PRODUCTS} />
    </main>
  );
}
```

**Criterion:** changing the select instantly updates the grid; "Office" shows 2 cards; the empty category case shows up if you add a test product to only one category and then select another.

---

## Task 5. Styles and typecheck

Add to `index.css`:

```css
.catalog-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-filter select {
  margin-left: 0.5rem;
}

.empty {
  color: #666;
  font-style: italic;
}
```

```bash
npm run typecheck
npm run build
```

In a comment in `CatalogPage.tsx` (2–3 sentences): explain why `visibleProducts` is **not** stored in a separate `useState`.

---

## Success criteria

- [ ] `category` state lives only in `CatalogPage`
- [ ] `CategoryFilter` is controlled (`value` + `onChange`)
- [ ] `ProductGrid` doesn't filter on its own
- [ ] Empty state shows up when the filter result is empty
- [ ] `key={product.id}` is preserved
- [ ] Comment explaining derived vs. duplicated state

## If something goes wrong

| Symptom | Check |
|---------|-------|
| Filter doesn't affect the list | Is state in Filter instead of Page? |
| All categories show empty | Typo in `category` strings vs. the Product type |
| TS error on select onChange | Cast `as Category` or validate |
| Duplicate cards | Duplicate ids in MOCK |

## Course connections

| Next step | Why |
|--------------|-------|
| [14. useEffect](14-useEffect.md) | side effects |
| [17. fetch in React](17-fetch-react.md) | products from the API |
| [26. URL state](26-url-state.md) | category in the query string |
| [29. Context](29-context.md) | when lifting goes too deep |

Next lesson (theory): [14. useEffect: syncing with the outside world](14-useEffect.md).
