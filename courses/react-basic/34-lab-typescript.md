# 34. Лаба: типизированный ProductList

## Сценарий

Tech lead: «Catalog page merge blocked — убираем `any`, типы Item из API, generic list component». Вы типизируете fetch к FastAPI `:8090`, `ProductList`, props карточек и discriminated union для UI states по [32-typescript-react.md](32-typescript-react.md) и [31-ui-states.md](31-ui-states.md).

**Время:** ~45–60 минут.  
**Код:** `courses/react-basic/examples/src/`.

---

## Цели

- `types/item.ts` — `Item`, `ItemsResponse`
- `api/items.ts` — typed `fetchItems`, `fetchItemById`
- Generic `DataList<T>` или typed `ProductList`
- `CatalogPage` с union state `CatalogViewState`
- ESLint без `any` на новых файлах

**Предварительно:** [19-lab-fetch-items.md](19-lab-fetch-items.md), [32-typescript-react.md](32-typescript-react.md).

---

## Подготовка

```bash
cd courses/react-basic/examples
npm install
npm run dev
# docker compose в deploy/fastapi — :8090
curl http://localhost:8090/api/v1/items
```

---

## Задание 1. types/item.ts

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

### Критерии

- [ ] Экспорт используется в api и components (single source of truth)
- [ ] Нет дублирования interface Item в других файлах

---

## Задание 2. api/items.ts

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

Добавьте в `.env.example`:

```env
VITE_API_URL=http://localhost:8090
```

### Критерии

- [ ] Return type `Promise<ItemsResponse>` явный
- [ ] Ошибки — `Error` с понятным message для ErrorPanel

---

## Задание 3. components/DataList.tsx (generic)

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

## Задание 4. components/ProductCard.tsx

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
          В корзину
        </button>
      )}
    </article>
  );
}
```

---

## Задание 5. CatalogViewState + CatalogPage

```tsx
import type { Item } from "../types/item";

export type CatalogViewState =
  | { status: "loading" }
  | { status: "error"; message: string; retry?: () => void }
  | { status: "empty" }
  | { status: "success"; items: Item[] };
```

В `CatalogPage`:

1. `useQuery` с `queryFn: fetchItems` **или** `useEffect` + `useState` (prefer Query если уже подключён — [20-tanstack-query.md](20-tanstack-query.md)).
2. Map query flags → `CatalogViewState`.
3. Render через `switch (state.status)`.

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

`CatalogView` — switch без `any`.

### Критерии

- [ ] Compiler проверяет exhaustiveness в `switch`
- [ ] `ProductList` / `DataList<Item>` рендерит карточки
- [ ] Loading/error/empty из [31-ui-states.md](31-ui-states.md)

---

## Задание 6. (Опционально) Item detail route

`/items/:id` — `fetchItemById`, тип `Item`, 404 → error state «Товар не найден».

См. [25-lab-router.md](25-lab-router.md).

---

## Самопроверка

- [ ] `npm run build` проходит без TS errors
- [ ] `grep -r "any" src/` — нет новых any (legacy допустимо помечать TODO)
- [ ] OpenAPI :8090 и `Item` согласованы (id number, title, description)
- [ ] `useCart` из [30-lab-context.md](30-lab-context.md) принимает `id: number` с карточки

---

## Расширения

| Уровень | Задача |
|---------|--------|
| A | Zod schema `ItemSchema.parse(await res.json())` |
| B | `ProductCard` styled with CSS module [33-styling.md](33-styling.md) |
| C | Unit test types with `expectTypeOf` (vitest) |

---

## Типичные ошибки

1. **`as Item` без проверки** — API изменился, UI молча ломается. Минимум — проверка `Array.isArray(data.items)`.

2. **Generic DataList без `key={item.id}`** — runtime warning.

3. **Union state без default** — TS error «not exhaustively checked» — добавьте `default: assertNever`.

4. **env URL hardcode only** — staging ломается; use `VITE_API_URL`.

5. **Optional onAdd забыли в типе** — card always shows button but parent didn't pass handler.

---

## Связь с capstone

Типы и `api/items.ts` переносите в capstone [38-capstone.md](38-capstone.md) без переписывания. Структура папок — [35-project-structure.md](35-project-structure.md).

Следующий урок: [35. Структура проекта](35-project-structure.md).
