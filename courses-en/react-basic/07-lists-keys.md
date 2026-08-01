# 07. Lists, Keys, Fragments

## Intro: a scenario from work

Staging shop: after sorting the catalog "by price," the quantity input in the **third** card gets "stuck" — it shows 5, even though the user never touched that item. In DevTools the list renders `<ProductRow key={0}>` … `key={4}`. On reorder, React **reused the DOM node** of the third element for a different product — the classic **index-as-key** bug. At the same time, a junior dev returned two `<td>` elements from a map without a `<tr>` wrapper — "Adjacent JSX elements." The senior adds `key={product.id}` and wraps the cells in a **Fragment**.

Lists are the backbone of the mock-exams catalog: `items` from the FastAPI `:8090` JSON, the cart, order lines. You already know the **`map`** method from [08-arrays.md](../javascript-basic/08-arrays.md); here we cover React's rules for rendering collections.

## What you'll learn

- Rendering an array via **`array.map()`** in JSX.
- Why **`key`** is needed and what stable identity means.
- Why **index** is a bad key when reordering/filtering/deleting.
- **`<>...</>`** (Fragment) — grouping without extra DOM.
- **`React.Fragment`** with a key for lists of fragments.
- Empty lists and loading state (preview [08-conditional-rendering.md](08-conditional-rendering.md)).

## map in JSX

```tsx
type Product = { id: number; title: string; price: number };

function ProductList({ products }: { products: Product[] }) {
  return (
    <ul className="product-list">
      {products.map((product) => (
        <li key={product.id}>
          {product.title} — € {product.price.toFixed(2)}
        </li>
      ))}
    </ul>
  );
}
```

**Rules:**

1. `map` returns an **array of elements** — React knows how to render it.
2. Put the **key** on the **root** element of each iteration (often `<li>`, `<ProductCard>`).
3. Don't call `map` for side effects — use `forEach` for that ([08-arrays.md](../javascript-basic/08-arrays.md)).

Data from the API:

```tsx
// After fetching from :8090
const [products, setProducts] = useState<Product[]>([]);
// ...
return (
  <div>
    {products.map((p) => (
      <ProductCard key={p.id} product={p} />
    ))}
  </div>
);
```

## Key: why React asks for identity

When updating, React compares the **new** tree with the **old** one (reconciliation, [01-landscape.md](01-landscape.md)). The key tells it: "this element is the **same** logical item as before."

```tsx
// A stable id from the server — ideal
products.map((p) => <ProductCard key={p.id} product={p} />);
```

| Key | When it's OK | When it's bad |
|-----|----------|-------------|
| `product.id` | id is stable for the list's lifetime | id changes on every fetch for no reason |
| Backend `uuid` | no natural id | — |
| `index` | static, read-only list | sort, filter, insert, delete |
| `Math.random()` | **never** | every render gets a new key → remount |

**Symptoms of a bad key:** input/checkbox state "moves" to the wrong row, animations glitch, a child's `useEffect` fires extra requests.

### A reorder example

```tsx
// Bad: after sorting by price, DOM nodes get reused incorrectly
items.map((item, index) => <Row key={index} item={item} />);

// OK:
items.map((item) => <Row key={item.id} item={item} />);
```

## Fragment: grouping without a div soup

Sometimes you need to return **several** siblings without wrapping them in a layout element (an extra `<div>` would break flex/grid or `<table>` semantics):

```tsx
import { Fragment } from "react";

function OrderSummaryLines({ lines }: { lines: { id: string; label: string; qty: number }[] }) {
  return (
    <>
      {lines.map((line) => (
        <Fragment key={line.id}>
          <dt>{line.label}</dt>
          <dd>{line.qty}</dd>
        </Fragment>
      ))}
    </>
  );
}
```

The short `<>` syntax **doesn't** accept a `key` — for that, use `import { Fragment } from "react"`.

### map + Fragment in a shop table

```tsx
function CartTable({ rows }: { rows: CartRow[] }) {
  return (
    <table>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.title}</td>
            <td>{row.qty}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

Here the key goes on `<tr>`, so no Fragment is needed.

## Empty list and guard

```tsx
function Catalog({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="empty">No products yet. Check the API :8090.</p>;
  }

  return (
    <div className="catalog-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

Early return vs inline `&&` — see [08-conditional-rendering.md](08-conditional-rendering.md).

## Immutability when updating a list

React state needs a **new** array reference ([09-useState.md](09-useState.md)):

```tsx
// Add to cart — a new array
setItems((prev) => [...prev, newItem]);

// Remove
setItems((prev) => prev.filter((x) => x.id !== removedId));

// Don't mutate:
// items.push(newItem); setItems(items); // React may not re-render
```

Same principle as `toSorted` vs `sort` in [08-arrays.md](../javascript-basic/08-arrays.md).

## Common mistakes

| Mistake | Root cause | Fix |
|--------|------------------|-------------|
| Warning: Each child should have a unique key | key forgotten, or placed on an inner div | key on the top-level element in the map |
| `key={index}` after filtering | index isn't a stable id | use the entity's id |
| key on the `<>` Fragment shorthand | short syntax has no key | `<Fragment key=...>` |
| `map` without a return inside `{}` | `{}` block with no return | use parentheses or an explicit return |
| Nested maps without keys at both levels | inner list | key at every level |
| `key={product.title}` | duplicate titles | use the id |

## Summary

Collections in the UI are rendered with **`items.map(...)`** and a **unique, stable `key`**. Index is only for static lists. **Fragment** groups nodes without extra DOM; when you need a key, use the explicit **`Fragment`** import. Updating lists in state means **immutable** copies. The shop catalog served from `:8090` follows the exact same pattern as the mock data in [06-lab-props.md](06-lab-props.md).

## Checklist

- [ ] Where does the `key` go in `products.map(...)`?
- [ ] Why does index break a controlled input on sort?
- [ ] When isn't `<>` enough?
- [ ] How do you add an item to a state array without mutating it?
- [ ] What do you show when `products.length === 0`?

Next lesson: [08. Conditional rendering](08-conditional-rendering.md).
