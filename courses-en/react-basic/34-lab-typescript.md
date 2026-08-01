# 34. Lab: typed ProductList

## Scenario

Tech lead: "Catalog page merge blocked — remove `any`, type the Item from the API, generic list component." You'll type the fetch to FastAPI `:8090`, `ProductList`, card props, and a discriminated union for UI states, following [32-typescript-react.md](32-typescript-react.md) and [31-ui-states.md](31-ui-states.md).

**Time:** ~45–60 minutes.  
**Code:** `courses/react-basic/examples/src/`.

---

## Goals

- `types/item.ts` — `Item`, `ItemsResponse`
- `api/items.ts` — typed `fetchItems`, `fetchItemById`
- Generic `DataList<T>` or typed `ProductList`
- `CatalogPage` with union state `CatalogViewState`
- ESLint with no `any` in new files

**Prerequisites:** [19-lab-fetch-items.md](19-lab-fetch-items.md), [32-typescript-react.md](32-typescript-react.md).

---

## Setup

```bash
cd courses/react-basic/examples
npm install
npm run dev
# docker compose in deploy/fastapi — :8090
curl http://localhost:8090/api/v1/items
```

---

## Task 1. types/item.ts

```tsx
export interface Item {
  id: number;
  title: string;
  description: string;
}

export interface ItemsResponse {
  items: Item[];
  total: number;
}

export type ItemPreview = Pick<Item, "id" | "title">;
```

### Criteria

- [ ] The export is used in both api and components (single source of truth)
- [ ] No duplicate `interface Item` in other files

---

## Task 2. api/items.ts

```tsx
import type { Item, ItemsResponse } from "../types/item";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8090";

export async function fetchItems(): Promise<ItemsResponse> {
  const res = await fetch(`${BASE}/api/v1/items`);
  if (!res.ok) {
    throw new Error(`Failed to load items: ${res.status}`);
  }
  return res.json() as Promise<ItemsResponse>;
}

export async function fetchItemById(id: number): Promise<Item> {
  const res = await fetch(`${BASE}/api/v1/items/${id}`);
  if (res.status === 404) {
    throw new Error("NOT_FOUND");
  }
  if (!res.ok) {
    throw new Error(`Failed to load item: ${res.status}`);
  }
  return res.json() as Promise<Item>;
}
```

Add to `.env.example`:

```env
VITE_API_URL=http://localhost:8090
```

### Criteria

- [ ] Explicit return type `Promise<ItemsResponse>`
- [ ] Errors are `Error` instances with a message the ErrorPanel can show

---

## Task 3. components/DataList.tsx (generic)

```tsx
import type { ReactNode } from "react";

type Identifiable = { id: number | string };

export type DataListProps<T extends Identifiable> = {
  items: T[];
  renderItem: (item: T) => ReactNode;
  empty?: ReactNode;
  className?: string;
};

export function DataList<T extends Identifiable>({
  items,
  renderItem,
  empty = null,
  className,
}: DataListProps<T>) {
  if (items.length === 0) {
    return <div className={className}>{empty}</div>;
  }
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.id}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

---

## Task 4. components/ProductCard.tsx

```tsx
import type { Item } from "../types/item";
import type { ComponentProps } from "react";

export type ProductCardProps = {
  item: Item;
  onAdd?: (id: number) => void;
} & Pick<ComponentProps<"article">, "className">;

export function ProductCard({ item, onAdd, className }: ProductCardProps) {
  return (
    <article className={className}>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      {onAdd && (
        <button type="button" onClick={() => onAdd(item.id)}>
          Add to cart
        </button>
      )}
    </article>
  );
}
```

---

## Task 5. CatalogViewState + CatalogPage

```tsx
import type { Item } from "../types/item";

export type CatalogViewState =
  | { status: "loading" }
  | { status: "error"; message: string; retry?: () => void }
  | { status: "empty" }
  | { status: "success"; items: Item[] };
```

In `CatalogPage`:

1. `useQuery` with `queryFn: fetchItems` **or** `useEffect` + `useState` (prefer Query if it's already wired up — [20-tanstack-query.md](20-tanstack-query.md)).
2. Map the query flags → `CatalogViewState`.
3. Render via `switch (state.status)`.

```tsx
function CatalogPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
  });

  let viewState: CatalogViewState;
  if (isLoading) viewState = { status: "loading" };
  else if (isError)
    viewState = {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      retry: () => refetch(),
    };
  else if (!data?.items.length) viewState = { status: "empty" };
  else viewState = { status: "success", items: data.items };

  return <CatalogView state={viewState} />;
}
```

`CatalogView` — a switch with no `any`.

### Criteria

- [ ] The compiler checks exhaustiveness in the `switch`
- [ ] `ProductList` / `DataList<Item>` renders the cards
- [ ] Loading/error/empty from [31-ui-states.md](31-ui-states.md)

---

## Task 6. (Optional) Item detail route

`/items/:id` — `fetchItemById`, typed `Item`, 404 → error state "Item not found."

See [25-lab-router.md](25-lab-router.md).

---

## Self-check

- [ ] `npm run build` passes with no TS errors
- [ ] `grep -r "any" src/` — no new `any` (legacy ones can stay marked TODO)
- [ ] The OpenAPI schema at `:8090` and `Item` agree (id number, title, description)
- [ ] `useCart` from [30-lab-context.md](30-lab-context.md) accepts an `id: number` from the card

---

## Extensions

| Level | Task |
|---------|--------|
| A | Zod schema `ItemSchema.parse(await res.json())` |
| B | `ProductCard` styled with a CSS module [33-styling.md](33-styling.md) |
| C | Unit test types with `expectTypeOf` (vitest) |

---

## Common mistakes

1. **`as Item` with no check** — the API changes, and the UI breaks silently. At minimum, check `Array.isArray(data.items)`.

2. **Generic DataList without `key={item.id}`** — a runtime warning.

3. **Union state with no default** — TS error "not exhaustively checked" — add `default: assertNever`.

4. **Hardcoded env URL only** — staging breaks; use `VITE_API_URL`.

5. **Forgot optional `onAdd` in the type** — the card always shows the button even though the parent didn't pass a handler.

---

## Connection to the capstone

Carry the types and `api/items.ts` over into the capstone [38-capstone.md](38-capstone.md) without rewriting them. Folder structure — [35-project-structure.md](35-project-structure.md).

Next lesson: [35. Project structure](35-project-structure.md).
