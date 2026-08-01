# 11. Lab: cart and counter

## Why this lab

[09-useState.md](09-useState.md) and [10-events-controlled.md](10-events-controlled.md) gave the theory of state and events. This **lab** combines them: a mini-cart for the mock-exams shop — an item counter, +/- buttons, a controlled qty input, an `onAdd` callback from the card. No API: everything is local; later the same UX is synced with `:8090` via mutations ([21-mutations.md](21-mutations.md)).

You'll reinforce: immutable updates, functional `setState`, `type="button"`, and not calling the handler on render.

## Prerequisites

- [06-lab-props.md](06-lab-props.md) — `ProductCard` exists.
- `npm run dev` in `courses/react-basic/examples/`.
- Reference solution: [`examples/solutions/11-cart-counter/`](examples/solutions/).

---

## Task 1. CartCounter component

**Context:** the shop header shows "In cart: N".

Create `src/components/CartCounter.tsx`:

```tsx
import { useState } from "react";

export function CartCounter() {
  const [count, setCount] = useState(0);

  return (
    <div className="cart-counter">
      <span>In cart: {count}</span>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        +1
      </button>
      <button
        type="button"
        onClick={() => setCount((c) => Math.max(0, c - 1))}
      >
        −1
      </button>
    </div>
  );
}
```

**Criterion:** count doesn't go below 0; a functional update is used.

---

## Task 2. Wire it into App

In `App.tsx`, add `<CartCounter />` to the header next to `<h1>`.

Check HMR: clicks change the number without a reload.

---

## Task 3. Link ProductCard to the cart

**Context:** one counter for the whole app — state in the **parent** (preview [12-lifting-state.md](12-lifting-state.md)).

In `App.tsx`:

```tsx
const [cartCount, setCartCount] = useState(0);

const handleAddToCart = () => {
  setCartCount((c) => c + 1);
};
```

Pass it into the cards:

```tsx
<ProductCard
  key={product.id}
  product={product}
  onAddToCart={handleAddToCart}
/>
```

Update `ProductCard`:

```tsx
type ProductCardProps = {
  product: Product;
  onAddToCart?: () => void;
};

// in JSX:
<button type="button" onClick={onAddToCart}>
  Add to cart
</button>
```

**Criterion:** clicking "Add to cart" increments the same counter as +1 (if wired to one handler — or only the card buttons; the key point is a single `cartCount` in App).

*Simplify:* `CartCounter` takes a `count` prop and optionally hides its own buttons — display only:

```tsx
type CartCounterProps = { count: number };

export function CartCounter({ count }: CartCounterProps) {
  return <span className="cart-counter">In cart: {count}</span>;
}
```

---

## Task 4. Controlled qty (a single product)

**Context:** before checkout, the user edits the quantity.

Create `src/components/QtyInput.tsx`:

```tsx
import { useState } from "react";

export function QtyInput() {
  const [qty, setQty] = useState(1);

  return (
    <label className="qty-input">
      Quantity
      <input
        type="number"
        min={1}
        max={99}
        value={qty}
        onChange={(e) => {
          const next = Number(e.target.value);
          setQty(Number.isNaN(next) ? 1 : next);
        }}
      />
    </label>
  );
}
```

Place it under the catalog. Make sure the cursor does **not** jump while typing.

---

## Task 5. An intentional bug

Temporarily replace `onClick={onAddToCart}` with `onClick={onAddToCart()}`. Describe in a comment in `App.tsx` what you observe (an infinite loop / an instant jump in count). Restore the correct variant.

```bash
npm run typecheck
```

---

## Success criteria

- [ ] `cartCount` lives in `App`, not duplicated in every card
- [ ] Functional updates for increment/decrement
- [ ] `ProductCard` calls a callback, doesn't mutate a global
- [ ] `QtyInput` — controlled, without a cursor jump
- [ ] You understand the `onClick={fn()}` bug

## If something went wrong

| Symptom | Check |
|---------|----------|
| Count grows on its own | `onClick={handler()}`? |
| Two independent counters | State only in App |
| Input read-only warning | Add onChange |
| NaN in qty | Guard `Number.isNaN` |

## Relation to the course

| Next step | Why |
|--------------|-------|
| [12. Lifting state](12-lifting-state.md) | filter + list |
| [13. Lab: filter](13-lab-lifting-state.md) | shared state for siblings |
| [21. Mutations](21-mutations.md) | POST cart to the API |

Next lesson (theory): [12. Lifting state up](12-lifting-state.md).
