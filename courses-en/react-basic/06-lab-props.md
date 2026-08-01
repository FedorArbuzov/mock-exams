# 06. Lab: Product Card

## Why this lab

[04-props.md](04-props.md) and [05-children-composition.md](05-children-composition.md) covered the component contract and wrappers. This **lab** builds a **ProductCard** — the first "real" piece of shop UI: title, price, an optional badge, and a placeholder "Add to cart" button. The pattern repeats in the capstone once data comes from FastAPI `:8090`; for now, it's a mock array in `App.tsx`.

You'll practice: typing props, destructuring, composition via `Card`, and previewing a list of cards in [07-lists-keys.md](07-lists-keys.md).

## Prerequisites

- Lab [03](03-lab-first-app.md) is done, `npm run dev` works.
- Directory: `courses/react-basic/examples/`.
- Reference solution: [`examples/solutions/06-product-card/`](examples/solutions/) — check it only after your own attempt.

---

## Task 1. The Product type and ProductCard

**Context:** the field contract will match a DRF/FastAPI item (id, name/title, price).

Create `src/types/product.ts`:

```tsx
export type Product = {
  id: number;
  title: string;
  price: number;
  badge?: string;
};
```

Create `src/components/ProductCard.tsx`:

```tsx
import type { Product } from "../types/product";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { title, price, badge } = product;

  return (
    <article className="product-card">
      {badge && <span className="product-card__badge">{badge}</span>}
      <h2>{title}</h2>
      <p className="product-card__price">€ {price.toFixed(2)}</p>
      <button type="button">Add to cart</button>
    </article>
  );
}
```

**Criterion:** the optional `badge` renders only when it's set ([08-conditional-rendering.md](08-conditional-rendering.md)).

---

## Task 2. Mock catalog in App

**Context:** until chapter 18 there's no API available — a local array serves as a contract test for the UI.

In `App.tsx`:

```tsx
import { ProductCard } from "./components/ProductCard";
import type { Product } from "./types/product";

const MOCK_PRODUCTS: Product[] = [
  { id: 1, title: "Mechanical Keyboard", price: 79.99, badge: "Sale" },
  { id: 2, title: "USB-C Hub", price: 34.5 },
  { id: 3, title: "Desk Lamp", price: 49.0, badge: "New" },
];

export function App() {
  return (
    <main className="app">
      <h1>Shop — react-basic</h1>
      <section className="catalog-grid">
        {MOCK_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </main>
  );
}
```

**Criterion:** three cards, the first one with a "Sale" badge.

---

## Task 3. Grid styles (minimum)

**Context:** a visual check for review — no single-column "bedsheet" layout.

Add to `src/index.css`:

```css
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
}

.product-card__badge {
  font-size: 0.75rem;
  background: #ffe082;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}
```

---

## Task 4. Composition — Card wrapper (optional +)

**Context:** a consistent card style shared by the catalog and the cart summary.

Create `src/components/Card.tsx` following the pattern in [05-children-composition.md](05-children-composition.md). Rewrite `ProductCard` so its body sits inside `<Card title={title}>...</Card>`.

**Criterion:** the appearance stays the same; the badge/price logic remains in ProductCard.

---

## Task 5. Typecheck and build

```bash
npm run typecheck
npm run build
```

Deliberately pass `price="79.99"` (a string) to one card — confirm TS complains. Change it back to a `number`.

---

## Success criteria

- [ ] `Product` type lives in its own file
- [ ] `ProductCard` takes a single `product` prop, not three separate ones (a different approach is fine — as long as it's deliberate)
- [ ] Mock array of 3 products, `key={product.id}`
- [ ] The optional badge works
- [ ] `typecheck` and `build` run without errors

## If something goes wrong

| Symptom | Check |
|---------|----------|
| Duplicate key warning | Are the `id` values in MOCK_PRODUCTS unique? |
| `price.toFixed is not a function` | `price` was passed as a string — you need `{}` |
| Badge always shows | Does the second product's object lack a `badge`? |
| Empty grid | Error in the map — check the Console |

## Connection to the course

| Next step | Why |
|--------------|-------|
| [07. Lists and keys](07-lists-keys.md) | goes deeper into map/key |
| [09. useState](09-useState.md) | makes the "Add to cart" button actually work |
| [19. Lab: fetch items](19-lab-fetch-items.md) | MOCK → API :8090 |

Next lesson (theory): [07. Lists, keys, fragments](07-lists-keys.md).
