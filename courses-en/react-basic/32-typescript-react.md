# 32. TypeScript in React: props, events, generics

## Introduction: "any on props — merge blocked"

CI failed on `react-basic/examples`: eslint `@typescript-eslint/no-explicit-any`. In `ProductCard`, props are typed as `any`, and the `onChange` event is `(e) => void` with no type. Reviewer: "Use the types from the API and `ComponentProps`."

After [`typescript-basic`](../typescript-basic/README.md) you know interfaces and generics. React adds a layer: **component props**, **DOM events**, **children**, **ref**, **generic components** for `List<T>` and `Select<Option>`.

This chapter is a bridge to [34-lab-typescript.md](34-lab-typescript.md) and the capstone [38-capstone.md](38-capstone.md). The Item data from `:8090` — a shared type in `types/item.ts`.

## What you'll learn

- Typing props: inline, interface, `ComponentProps`.
- Events: `ChangeEvent`, `FormEvent`, `MouseEvent`.
- `children`, optional props, default values.
- Generic components: `DataList<T>`, `ApiResponse<T>`.
- Utility types: `Pick`, `Omit`, `Partial`.
- Zod + fetch (preview, typescript-basic).

---

## Props: basic patterns

### Inline (small components)

```tsx
function PriceTag({ price, currency = "EUR" }: {
  price: number;
  currency?: string;
}) {
  return <span>{price.toFixed(2)} {currency}</span>;
}
```

### Interface (reuse)

```tsx
export interface ProductCardProps {
  item: Item;
  onAdd?: (id: number) => void;
  className?: string;
}

export function ProductCard({ item, onAdd, className }: ProductCardProps) {
  return (
    <article className={className}>
      <h3>{item.title}</h3>
      {onAdd && (
        <button type="button" onClick={() => onAdd(item.id)}>
          Add to cart
        </button>
      )}
    </article>
  );
}
```

**`?`** — optional; **`onAdd?`** — may not be passed.

---

## The Item type from the API

```tsx
// types/item.ts
export interface Item {
  id: number;
  title: string;
  description: string;
}

export interface ItemsResponse {
  items: Item[];
  total: number;
}
```

```tsx
async function fetchItems(): Promise<ItemsResponse> {
  const res = await fetch("http://localhost:8090/api/v1/items");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

Strict typing of the response — a contract with [api-design](../api-design/README.md). Runtime validation — Zod in typescript-basic.

---

## ComponentProps: extending native elements

The shop's "Buy" button — a styled `<button>` with the same attrs:

```tsx
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "ghost";
};

function Button({ variant = "primary", className, ...rest }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} ${className ?? ""}`}
      {...rest}
    />
  );
}
```

**`ComponentProps<typeof Link>`** — for the React Router Link ([23-react-router.md](23-react-router.md)).

**`ComponentPropsWithoutRef<"input">`** — when you don't forward a ref.

---

## Events

```tsx
import type { ChangeEvent, FormEvent, MouseEvent } from "react";

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };
  return <input type="search" value={value} onChange={handleChange} />;
}

function CheckoutForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(new FormData(e.currentTarget));
  };
  return <form onSubmit={handleSubmit}>...</form>;
}
```

| Element | Event type |
|---------|------------|
| input, textarea | `ChangeEvent<HTMLInputElement>` |
| select | `ChangeEvent<HTMLSelectElement>` |
| form | `FormEvent<HTMLFormElement>` |
| button | `MouseEvent<HTMLButtonElement>` |

**`e.target` vs `e.currentTarget`:** in a form submit, prefer `currentTarget` — always the form element.

---

## children

```tsx
import type { ReactNode } from "react";

type CardProps = {
  title: string;
  children: ReactNode;
};

function Card({ title, children }: CardProps) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
```

**`PropsWithChildren`** — a `{ title: string } & { children?: ReactNode }` helper.

Slots pattern — [05-children-composition.md](05-children-composition.md).

---

## Generic components

A list of any entities with an `id`:

```tsx
type Identifiable = { id: number | string };

type DataListProps<T extends Identifiable> = {
  items: T[];
  renderItem: (item: T) => ReactNode;
  empty?: ReactNode;
};

function DataList<T extends Identifiable>({
  items,
  renderItem,
  empty = null,
}: DataListProps<T>) {
  if (items.length === 0) return <>{empty}</>;
  return <ul>{items.map((item) => <li key={item.id}>{renderItem(item)}</li>)}</ul>;
}

// usage
<DataList<Item>
  items={products}
  renderItem={(item) => <ProductCard item={item} />}
  empty={<EmptyCatalog />}
/>
```

TypeScript **infers** `T` from `items` — an explicit `<Item>` is often optional.

---

## Discriminated unions for UI state

```tsx
type CatalogViewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "success"; items: Item[] };

function CatalogView({ state }: { state: CatalogViewState }) {
  switch (state.status) {
    case "loading":
      return <ProductListSkeleton />;
    case "error":
      return <ErrorPanel message={state.message} />;
    case "empty":
      return <EmptyCatalog />;
    case "success":
      return <ProductList items={state.items} />;
  }
}
```

Narrowing by `status` — the compiler knows the fields ([31-ui-states.md](31-ui-states.md)).

---

## Hooks typing

```tsx
function useDebouncedValue<T>(value: T, delayMs: number): T {
  // ...
}
```

`useState<Item[]>([])` — inference OK. `useState<Item | null>(null)` — a union.

`useRef<HTMLInputElement>(null)` — a ref object for the DOM ([27-ref-memo-callback.md](27-ref-memo-callback.md)).

Context:

```tsx
const CartContext = createContext<CartContextValue | null>(null);
```

---

## Utility types in React

```tsx
type ItemPreview = Pick<Item, "id" | "title">;
type ItemCreate = Omit<Item, "id">;
type PartialItem = Partial<Item>;
```

Props for the create-product form (admin, capstone extension):

```tsx
type ItemFormProps = {
  initial?: PartialItem;
  onSave: (data: ItemCreate) => void;
};
```

---

## eslint and strict

`tsconfig.json` in examples: `"strict": true`. Enable:
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-unused-vars`

**`as Item`** — an escape hatch; prefer validation.

---

## Common mistakes

**`Function` / `any` on event handlers** — you lose the `target` type.

**Forgetting the optional `?`** — the prop is required, breaking call sites.

**A generic constraint that's too weak** — `T extends object` without `id` → key error.

**Duplicating the Item type** — one file `types/item.ts`, imported into api and components.

**A props intersection conflict** — `ComponentProps<"button"> & { type: string }` — omit `type` or use Omit.

---

## Summary

TypeScript in React — props interfaces, DOM events, `ComponentProps`, generic lists, discriminated unions for async UI. Sync the Item types with FastAPI `:8090`. Practice — [34-lab-typescript.md](34-lab-typescript.md).

## Checklist

- [ ] `ComponentProps<"button">` for a wrapper
- [ ] `ChangeEvent<HTMLInputElement>` for a controlled input
- [ ] Generic `DataList<T extends Identifiable>`
- [ ] `ItemsResponse` for fetch
- [ ] Discriminated union for loading/error/empty/success

Next lesson: [33. Styling](33-styling.md).
