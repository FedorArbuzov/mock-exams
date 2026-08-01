# 25. Lab: cart and client-side mutations

## Scenario

Ticket **NEXT-225**: "Add an 'Add to cart' button on the product card, a counter in the header, data kept in the browser only (demo, no checkout API)." Client island: `useState` + Context — the pattern from [react-basic/29-context.md](../react-basic/29-context.md). Don't confuse this with server state (Query).

**Time:** ~50-60 minutes.
**Stack:** Next `:3000`, catalog from lab 15.

---

## Setup

```bash
cd courses/nextjs-basic/examples
npm run dev
```

Structure:

```text
components/cart/
  CartContext.tsx
  CartProvider.tsx
  AddToCartButton.tsx
  CartBadge.tsx
  CartDrawer.tsx          # optional
lib/cart/
  types.ts
```

---

## Task 1. Types

```tsx
// lib/cart/types.ts
export type CartLine = {
  itemId: number;
  title: string;
  qty: number;
};

export type CartState = {
  lines: CartLine[];
};
```

---

## Task 2. Context + Provider

```tsx
// components/cart/CartContext.tsx
"use client";

import { createContext, useContext } from "react";
import type { CartLine } from "@/lib/cart/types";

export type CartContextValue = {
  lines: CartLine[];
  totalItems: number;
  addItem: (line: Omit<CartLine, "qty">) => void;
  removeItem: (itemId: number) => void;
  clear: () => void;
};

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
```

```tsx
// components/cart/CartProvider.tsx
"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { CartLine } from "@/lib/cart/types";
import { CartContext, type CartContextValue } from "./CartContext";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (item: Omit<CartLine, "qty">) => {
      setLines((prev) => {
        const existing = prev.find((l) => l.itemId === item.itemId);
        if (existing) {
          return prev.map((l) =>
            l.itemId === item.itemId ? { ...l, qty: l.qty + 1 } : l,
          );
        }
        return [...prev, { ...item, qty: 1 }];
      });
    };

    const removeItem = (itemId: number) => {
      setLines((prev) => prev.filter((l) => l.itemId !== itemId));
    };

    const clear = () => setLines([]);

    const totalItems = lines.reduce((sum, l) => sum + l.qty, 0);

    return { lines, totalItems, addItem, removeItem, clear };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
```

---

## Task 3. Wire it into the layout

```tsx
// app/layout.tsx
import { CartProvider } from "@/components/cart/CartProvider";
import { CartBadge } from "@/components/cart/CartBadge";

// inside body, next to QueryProvider:
<CartProvider>
  <header>
    <nav>
      <Link href="/">Shop</Link>
      <Link href="/catalog">Catalog</Link>
      <CartBadge />
    </nav>
  </header>
  <main>{children}</main>
</CartProvider>
```

Provider nesting: `QueryProvider` → `CartProvider` or the other way around — both are client-side, so the order doesn't matter as long as there are no cross-dependencies.

---

## Task 4. `AddToCartButton`

```tsx
// components/cart/AddToCartButton.tsx
"use client";

import { useCart } from "./CartContext";

type Props = { itemId: number; title: string };

export function AddToCartButton({ itemId, title }: Props) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      onClick={() => addItem({ itemId, title })}
      aria-label={`Add ${title} to cart`}
    >
      Add to cart
    </button>
  );
}
```

In `ItemCard` (a Server Component) — **passing a client child**:

```tsx
// components/catalog/ItemCard.tsx
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export function ItemCard({ item }: Props) {
  return (
    <li className="card">
      <strong>{item.title}</strong>
      <AddToCartButton itemId={item.id} title={item.title} />
    </li>
  );
}
```

Server → Client props must be **serializable** (numbers, strings — fine).

---

## Task 5. `CartBadge`

```tsx
// components/cart/CartBadge.tsx
"use client";

import Link from "next/link";
import { useCart } from "./CartContext";

export function CartBadge() {
  const { totalItems } = useCart();

  return (
    <Link href="/cart" className="cart-badge">
      Cart ({totalItems})
    </Link>
  );
}
```

---

## Task 6. The `/cart` page

```tsx
// app/cart/page.tsx
import { CartPageClient } from "./CartPageClient";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <section>
      <h1>Cart</h1>
      <CartPageClient />
    </section>
  );
}
```

```tsx
// app/cart/CartPageClient.tsx
"use client";

import { useCart } from "@/components/cart/CartContext";

export function CartPageClient() {
  const { lines, removeItem, clear, totalItems } = useCart();

  if (totalItems === 0) {
    return <p className="muted">Your cart is empty.</p>;
  }

  return (
    <>
      <ul>
        {lines.map((l) => (
          <li key={l.itemId}>
            {l.title} × {l.qty}
            <button type="button" onClick={() => removeItem(l.itemId)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={clear}>
        Clear
      </button>
    </>
  );
}
```

---

## Task 7. Checks

| Test | Expected result |
|------|----------|
| Add on `/catalog` | badge increments |
| Navigate to `/cart` | lines persist (same session) |
| Full page reload | cart is **empty** (no persistence yet) |
| View Source on `/cart` | "empty" text or skeleton — client state |

---

## Bonus: localStorage sync

```tsx
// read on mount, write on change — be careful with hydration
useEffect(() => {
  const raw = localStorage.getItem("cart");
  if (raw) setLines(JSON.parse(raw));
}, []);
```

Content-flash risk here is an advanced topic; in-memory state is enough for this course.

---

## Acceptance criteria

- [ ] Context + `useCart` hook
- [ ] Add button on the card (server/client boundary)
- [ ] Badge in the header
- [ ] `/cart` shows the lines
- [ ] You understand: cart ≠ TanStack Query

---

## Common issues

| Symptom | Fix |
|---------|---------|
| useCart error | wrap it in CartProvider |
| Button doesn't update the badge | Provider must sit above both header and page |
| useCart in a server file | only works in client components |

---

Next lesson: [26. Cookies, headers, request context](26-cookies-headers.md).
