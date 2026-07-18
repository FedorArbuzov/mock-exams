# 25. Лаба: корзина и mutations на клиенте

## Сценарий

Тикет **NEXT-225**: «Кнопка "В корзину" на карточке товара, счётчик в header, данные только в браузере (demo без checkout API)». Client island: `useState` + Context — паттерн из [react-basic/29-context.md](../react-basic/29-context.md). Не путать с server state (Query).

**Время:** ~50–60 минут.  
**Стенд:** Next `:3000`, каталог из лабы 15.

---

## Подготовка

```bash
cd courses/nextjs-basic/examples
npm run dev
```

Структура:

```text
components/cart/
  CartContext.tsx
  CartProvider.tsx
  AddToCartButton.tsx
  CartBadge.tsx
  CartDrawer.tsx          # опционально
lib/cart/
  types.ts
```

---

## Задание 1. Типы

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

## Задание 2. Context + Provider

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

## Задание 3. Подключить в layout

```tsx
// app/layout.tsx
import { CartProvider } from "@/components/cart/CartProvider";
import { CartBadge } from "@/components/cart/CartBadge";

// внутри body, рядом с QueryProvider:
<CartProvider>
  <header>
    <nav>
      <Link href="/">Shop</Link>
      <Link href="/catalog">Каталог</Link>
      <CartBadge />
    </nav>
  </header>
  <main>{children}</main>
</CartProvider>
```

Providers nesting: `QueryProvider` → `CartProvider` или наоборот — оба client, порядок не критичен если нет cross-deps.

---

## Задание 4. `AddToCartButton`

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
      aria-label={`Добавить ${title} в корзину`}
    >
      В корзину
    </button>
  );
}
```

В `ItemCard` (Server Component) — **передача client child**:

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

Server → Client props должны быть **serializable** (numbers, strings — ok).

---

## Задание 5. `CartBadge`

```tsx
// components/cart/CartBadge.tsx
"use client";

import Link from "next/link";
import { useCart } from "./CartContext";

export function CartBadge() {
  const { totalItems } = useCart();

  return (
    <Link href="/cart" className="cart-badge">
      Корзина ({totalItems})
    </Link>
  );
}
```

---

## Задание 6. Страница `/cart`

```tsx
// app/cart/page.tsx
import { CartPageClient } from "./CartPageClient";

export const metadata = { title: "Корзина" };

export default function CartPage() {
  return (
    <section>
      <h1>Корзина</h1>
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
    return <p className="muted">Корзина пуста.</p>;
  }

  return (
    <>
      <ul>
        {lines.map((l) => (
          <li key={l.itemId}>
            {l.title} × {l.qty}
            <button type="button" onClick={() => removeItem(l.itemId)}>
              Удалить
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={clear}>
        Очистить
      </button>
    </>
  );
}
```

---

## Задание 7. Проверки

| Тест | Ожидание |
|------|----------|
| Add on `/catalog` | badge increment |
| Navigate `/cart` | lines persist (same session) |
| Full page reload | cart **empty** (no persistence yet) |
| View Source `/cart` | «пуста» или skeleton — client state |

---

## Бонус: localStorage sync

```tsx
// при mount read, on change write — осторожно с hydration
useEffect(() => {
  const raw = localStorage.getItem("cart");
  if (raw) setLines(JSON.parse(raw));
}, []);
```

Document flash risk — advanced; для курса достаточно in-memory.

---

## Критерии приёмки

- [ ] Context + hook `useCart`
- [ ] Add button на карточке (server/client boundary)
- [ ] Badge в header
- [ ] `/cart` показывает lines
- [ ] Понимаете: cart ≠ TanStack Query

---

## Частые проблемы

| Симптом | Решение |
|---------|---------|
| useCart error | оберните в CartProvider |
| Button не обновляет badge | Provider выше header и page |
| useCart in server file | только client components |

---

Следующий урок: [26. Cookies, headers, request context](26-cookies-headers.md).
