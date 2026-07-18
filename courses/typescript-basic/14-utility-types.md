# 14. Utility types: `Partial`, `Pick`, `Omit`, `Record` и др.

## Сценарий с работы

Форма «Редактировать товар» отправляет **частичное** обновление: только `price` и `name`. Backend FastAPI `:8090` принимает optional поля. Джун дублирует тип вручную — через спринт поля разъехались с моделью. Правильно: `Partial<Pick<Product, "name" | "price">>`.

Другой кейс: DTO списка без `description` — `Omit<Product, "description">`; словарь остатков — `Record<string, number>`; тип ответа — `ReturnType<typeof createOrder>`.

Utility types — **встроенные generic-типы** для трансформации без copy-paste.

## Что вы узнаете

- **`Partial`**, **`Required`**, **`Readonly`**
- **`Pick`**, **`Omit`**, **`Record`**
- **`ReturnType`**, **`Parameters`**, **`Awaited`**
- **`Exclude`**, **`Extract`**, **`NonNullable`**
- Паттерны DTO для shop API

---

## `Partial<T>` — все поля optional

```typescript
type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
};

type ProductPatch = Partial<Product>;

function updateProduct(id: number, patch: Partial<Pick<Product, "name" | "price">>) {
  // PATCH http://localhost:8090/api/v1/items/{id}
}
```

**Практика:** сужайте `Pick` до полей, разрешённых API.

---

## `Required<T>` и `Readonly<T>`

```typescript
type Config = { host?: string; port?: number };
type ResolvedConfig = Required<Config>;

function withDefaults(cfg: Config): Required<Pick<Config, "host" | "port">> {
  return {
    host: cfg.host ?? "localhost",
    port: cfg.port ?? 8090,
  };
}
```

---

## `Pick<T, K>` и `Omit<T, K>`

```typescript
type ProductListItem = Pick<Product, "id" | "name" | "price">;
type ProductCreate = Omit<Product, "id">;
type ProductPublic = Omit<Product, "internalNotes">;
```

| Задача | Utility |
|--------|---------|
| Карточка в списке | `Pick` |
| POST без id | `Omit<Product, "id">` |
| Скрыть internal | `Omit` |

---

## `Record<K, V>`

```typescript
type StockBySku = Record<string, number>;

const inventory: StockBySku = {
  "KB-001": 42,
  "MS-01": 100,
};
```

Для известного набора ключей — `as const` + mapped type ([17-enums-const](17-enums-const.md)).

---

## `ReturnType`, `Parameters`, `Awaited`

```typescript
async function fetchProduct(id: number) {
  const res = await fetch(`http://localhost:8090/api/v1/items/${id}`);
  return res.json() as Promise<Product>;
}

type FetchProductResult = Awaited<ReturnType<typeof fetchProduct>>;
type FetchProductArgs = Parameters<typeof fetchProduct>;
```

Полезно для моков и обёрток без дублирования сигнатуры.

---

## `Exclude`, `Extract`, `NonNullable`

```typescript
type Status = "pending" | "paid" | "shipped" | "cancelled";
type ActiveStatus = Exclude<Status, "cancelled">;

type MaybeProduct = Product | null | undefined;
type DefiniteProduct = NonNullable<MaybeProduct>;
```

---

## Композиция utilities

```typescript
type UpdateItemDto = Partial<Pick<Product, "name" | "price" | "category">>;
type ReadonlyProductList = ReadonlyArray<Pick<Product, "id" | "name">>;
```

Цепочка читается изнутри наружу: `Partial<Pick<...>>`.

---

## Mapped type (введение)

```typescript
type Nullable<T> = { [K in keyof T]: T[K] | null };
```

Встроенные utilities — частный случай; для курса достаточно **готовых**.

---

## Паттерн: форма vs API

```typescript
type ProductForm = Pick<Product, "name" | "price" | "category">;

function formToCreateDto(form: ProductForm): Omit<Product, "id"> {
  return { ...form };
}
```

---

## Связь с курсом

| Урок | Связь |
|------|-------|
| [13-generics](13-generics.md) | utilities — generic aliases |
| [15-lab-generics](15-lab-generics.md) | DTO repository |
| [16-classes](16-classes.md) | `implements Pick<...>` |
| [20-discriminated-unions](20-discriminated-unions.md) | `Exclude` |

---

## Типичные ошибки

| Ошибка | Причина | Исправление |
|--------|---------|-------------|
| `Partial` на всём Product в PATCH | Клиент может «затереть» id | `Pick` разрешённых полей |
| `Omit` забыли новое поле | Ручная синхронизация | Один source `Product` |
| `Record<string, T>` для 3 ключей | Потеря exhaustiveness | Union + `as const` |
| `ReturnType` от overload | Берёт последнюю | Явный тип |

---

## В продакшене

- Один `Product` → list item, create, patch через utilities — синхрон с OpenAPI `:8090`.
- Shared types package (позже) — те же `Pick`/`Omit` на frontend и BFF.
- `Readonly` не deep freeze — документируйте для команды.

---

## Резюме

Utilities трансформируют типы декларативно: **`Partial`** для patch, **`Pick`/`Omit`** для проекций, **`Record`** для словарей, **`ReturnType`** для вывода из функций.

---

## Чек-лист

- Как получить «Product без id» одной строкой?
- Зачем `NonNullable` после `find`?
- Чем `Partial<Pick<T,"a">>` отличается от `{ a?: T["a"] }`?
- Как получить тип данных `fetchProduct` без копирования полей?

Следующий урок: [15. Лаба: generic repository](15-lab-generics.md).
