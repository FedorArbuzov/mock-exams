# 32. TypeScript в React: props, events, generics

## Введение: «any на props — merge заблокирован»

CI упал на `react-basic/examples`: eslint `@typescript-eslint/no-explicit-any`. В `ProductCard` props типизированы как `any`, событие `onChange` — `(e) => void` без типа. Reviewer: «Используйте типы из API и `ComponentProps`».

После [`typescript-basic`](../typescript-basic/README.md) вы знаете interfaces и generics. React добавляет слой: **props компонентов**, **события DOM**, **children**, **ref**, **generic components** для `List<T>` и `Select<Option>`.

Эта глава — мост к [34-lab-typescript.md](34-lab-typescript.md) и capstone [38-capstone.md](38-capstone.md). Данные Item с `:8090` — shared type в `types/item.ts`.

## Что вы узнаете

- Типизация props: inline, interface, `ComponentProps`.
- Events: `ChangeEvent`, `FormEvent`, `MouseEvent`.
- `children`, optional props, default values.
- Generic components: `DataList<T>`, `ApiResponse<T>`.
- Utility types: `Pick`, `Omit`, `Partial`.
- Zod + fetch (preview, typescript-basic).

---

## Props: базовые паттерны

### Inline (малые компоненты)

```tsx
function PriceTag({ price, currency = "EUR" }: {
  price: number;
  currency?: string;
}) {
  return <span>{price.toFixed(2)} {currency}</span>;
}
```

### Interface (переиспользование)

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
          В корзину
        </button>
      )}
    </article>
  );
}
```

**`?`** — optional; **`onAdd?`** — может не передаваться.

---

## Тип Item из API

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

Строгая типизация ответа — контракт с [api-design](../api-design/README.md). Runtime validation — Zod в typescript-basic.

---

## ComponentProps: расширение нативных элементов

Кнопка shop «Купить» — стилизованная `<button>` с теми же attrs:

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

**`ComponentProps<typeof Link>`** — для React Router Link ([23-react-router.md](23-react-router.md)).

**`ComponentPropsWithoutRef<"input">`** — когда ref не пробрасываете.

---

## События

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

| Элемент | Event type |
|---------|------------|
| input, textarea | `ChangeEvent<HTMLInputElement>` |
| select | `ChangeEvent<HTMLSelectElement>` |
| form | `FormEvent<HTMLFormElement>` |
| button | `MouseEvent<HTMLButtonElement>` |

**`e.target` vs `e.currentTarget`:** в form submit prefer `currentTarget` — всегда form element.

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

**`PropsWithChildren`** — `{ title: string } & { children?: ReactNode }` helper.

Slots pattern — [05-children-composition.md](05-children-composition.md).

---

## Generic components

Список любых сущностей с `id`:

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

TypeScript **выводит** `T` из `items` — явный `<Item>` часто optional.

---

## Discriminated unions для UI state

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

Сужение по `status` — compiler знает поля ([31-ui-states.md](31-ui-states.md)).

---

## Hooks typing

```tsx
function useDebouncedValue<T>(value: T, delayMs: number): T {
  // ...
}
```

`useState<Item[]>([])` — inference OK. `useState<Item | null>(null)` — union.

`useRef<HTMLInputElement>(null)` — ref object для DOM ([27-ref-memo-callback.md](27-ref-memo-callback.md)).

Context:

```tsx
const CartContext = createContext<CartContextValue | null>(null);
```

---

## Utility types в React

```tsx
type ItemPreview = Pick<Item, "id" | "title">;
type ItemCreate = Omit<Item, "id">;
type PartialItem = Partial<Item>;
```

Props формы создания товара (admin, capstone extension):

```tsx
type ItemFormProps = {
  initial?: PartialItem;
  onSave: (data: ItemCreate) => void;
};
```

---

## eslint и strict

`tsconfig.json` в examples: `"strict": true`. Включите:
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-unused-vars`

**`as Item`** — escape hatch; prefer validation.

---

## Типичные ошибки

**`Function` / `any` на event handlers** — теряете `target` type.

**Забыли optional `?`** — prop required, ломает call sites.

**Generic constraint слишком слабый** — `T extends object` без `id` → key error.

**Дублирование Item type** — один файл `types/item.ts`, import в api и components.

**Props intersection конфликт** — `ComponentProps<"button"> & { type: string }` — omit `type` или use Omit.

---

## Резюме

TypeScript в React — props interfaces, DOM events, `ComponentProps`, generic lists, discriminated unions для async UI. Типы Item синхронизируйте с FastAPI `:8090`. Практика — [34-lab-typescript.md](34-lab-typescript.md).

## Чек-лист

- [ ] `ComponentProps<"button">` для обёртки
- [ ] `ChangeEvent<HTMLInputElement>` для controlled input
- [ ] Generic `DataList<T extends Identifiable>`
- [ ] `ItemsResponse` для fetch
- [ ] Discriminated union для loading/error/empty/success

Следующий урок: [33. Стили](33-styling.md).
