# 10. Events and controlled inputs

## Intro: a scenario from work

The "Add product" form in the admin shop: after every letter typed in the "Name" field, the cursor jumps to the start and the quantity resets. The cause — `<input value={title} />` **without** `onChange`, or the value comes from props while edits are written to local state that isn't synced. A second ticket: `onClick={addToCart()}` — the cart is emptied on **every** render. A third: `preventDefault` was forgotten on submit — the page reloads and the SPA crashes.

React events are **SyntheticEvents**, with delegation and camelCase. **Controlled components** are the single source of truth in state for shop forms (qty, promo code, search).

## What you'll learn

- The **`onClick`**, **`onChange`**, **`onSubmit`** handlers.
- Passing a function vs **calling** a function in JSX.
- **`event.target`** and typing for an input in TS.
- **Controlled** vs **uncontrolled** inputs.
- **`preventDefault`** and forms without a reload.
- Combining events + `useState` ([09-useState.md](09-useState.md)).

## onClick and passing callbacks

```tsx
function AddToCartButton({ productId }: { productId: number }) {
  const handleClick = () => {
    console.log("Add product", productId);
    // later: mutation / lift state
  };

  return (
    <button type="button" onClick={handleClick}>
      Add to cart
    </button>
  );
}
```

| JSX | When |
|-----|-------|
| `onClick={handleClick}` | pass the function — **correct** |
| `onClick={() => add(id)}` | you need an argument from the closure |
| `onClick={addToCart()}` | **called immediately** on render — a bug |

```tsx
// Bug: addToCart() runs on every render
<button onClick={addToCart()}>Buy</button>

// OK
<button onClick={() => addToCart(product.id)}>Buy</button>
```

`type="button"` on buttons outside a `<form>` — otherwise an implicit submit in some browsers.

## SyntheticEvent

React normalizes events across browsers:

```tsx
function Row({ id }: { id: number }) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // don't bubble up to the row click
    console.log("Clicked row", id);
  };

  return <button type="button" onClick={handleClick}>Select</button>;
}
```

In React 17+ events are attached to the root, not the document — for this course it's enough to know: the API resembles the DOM, the types are `React.MouseEvent`, `React.ChangeEvent`.

## Controlled input: text

**Controlled** — the input's value is **always** from state:

```tsx
import { useState } from "react";

function SearchBox() {
  const [query, setQuery] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  return (
    <input
      type="search"
      placeholder="Search the catalog…"
      value={query}
      onChange={handleChange}
    />
  );
}
```

Without `onChange` when `value={query}`, React will emit a warning — a read-only field.

**Why controlled:** catalog filter, debounced search ([16-lab-effects.md](16-lab-effects.md)), promo validation, a single source of truth before a POST to `:8090`.

## Other input types

```tsx
function QtyStepper() {
  const [qty, setQty] = useState(1);

  return (
    <input
      type="number"
      min={1}
      max={99}
      value={qty}
      onChange={(e) => setQty(Number(e.target.value))}
    />
  );
}
```

Checkbox:

```tsx
const [agree, setAgree] = useState(false);

<input
  type="checkbox"
  checked={agree}
  onChange={(e) => setAgree(e.target.checked)}
/>;
```

Select:

```tsx
const [category, setCategory] = useState("electronics");

<select value={category} onChange={(e) => setCategory(e.target.value)}>
  <option value="electronics">Electronics</option>
  <option value="home">Home</option>
</select>
```

## Uncontrolled (briefly)

Ref + DOM value — [27-ref-memo-callback.md](27-ref-memo-callback.md). For most shop forms in this course — **controlled**. Uncontrolled is appropriate for a file input or integration with non-React libraries.

## A form and preventDefault

```tsx
function QuickOrderForm() {
  const [sku, setSku] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Order SKU:", sku);
    // fetch POST :8090/orders — later
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        SKU
        <input value={sku} onChange={(e) => setSku(e.target.value)} />
      </label>
      <button type="submit">Order</button>
    </form>
  );
}
```

Without `preventDefault`, the browser will do a GET/POST navigation — a **full** reload, losing the SPA state.

## Callback upward (a preview of lifting)

```tsx
type ProductCardProps = {
  product: Product;
  onAdd: (id: number) => void;
};

function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <article>
      <h2>{product.title}</h2>
      <button type="button" onClick={() => onAdd(product.id)}>
        Add to cart
      </button>
    </article>
  );
}
```

The parent holds `cartCount` — [12-lifting-state.md](12-lifting-state.md).

## Accessibility (minimum)

- `<label>` is linked to the input (`htmlFor` + `id`).
- Buttons — meaningful text, not just an icon without `aria-label`.
- `onKeyDown` for custom widgets — later.

## Common mistakes

| Mistake | Root cause | Fix |
|--------|------------------|-------------|
| Cursor jumps | value without onChange or key remount | Controlled pair |
| `onClick={fn()}` | Immediate invoke | `onClick={() => fn()}` |
| Page reload on submit | No preventDefault | `event.preventDefault()` |
| `value` undefined → uncontrolled | Initial state isn't a string | `useState("")` |
| Number input NaN | Empty string in value | Parse + fallback |
| Extra re-render onChange | Heavy work in the handler | debounce in an effect |

## Summary

React events are **camelCase**, functions in JSX are passed **without calling** (except a factory). **Controlled inputs** — `value` + `onChange` from `useState`. Forms — **`onSubmit`** + **`preventDefault`**. Shop UI: search, qty, checkout — all built on this pattern until React Hook Form in intermediate.

## Checklist

- [ ] The difference between `onClick={f}` and `onClick={f()}`
- [ ] What does a controlled input do?
- [ ] Why `preventDefault` on form submit?
- [ ] The event type for `<input onChange>` in TS?
- [ ] How do you pass `product.id` into a handler?

Next lesson: [11. Lab: cart and counter](11-lab-state.md).
