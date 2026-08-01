# 14. Utility types: `Partial`, `Pick`, `Omit`, `Record` and others

## A scenario from work

The «Edit product» form sends a **partial** update: only `price` and `name`. The FastAPI backend `:8090` accepts optional fields. A junior duplicates the type by hand — a sprint later the fields drift apart from the model. The right way: `Partial<Pick<Product, "name" | "price">>`.

Another case: a list DTO without `description` — `Omit<Product, "description">`; a stock dictionary — `Record<string, number>`; a response type — `ReturnType<typeof createOrder>`.

Utility types are **built-in generic types** for transformation without copy-paste.

## What you'll learn

- **`Partial`**, **`Required`**, **`Readonly`**
- **`Pick`**, **`Omit`**, **`Record`**
- **`ReturnType`**, **`Parameters`**, **`Awaited`**
- **`Exclude`**, **`Extract`**, **`NonNullable`**
- DTO patterns for the shop API

---

## `Partial<T>` — all fields optional

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

**Practice:** narrow the `Pick` to the fields the API allows.

---

## `Required<T>` and `Readonly<T>`

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

## `Pick<T, K>` and `Omit<T, K>`

```typescript
type ProductListItem = Pick<Product, "id" | "name" | "price">;
type ProductCreate = Omit<Product, "id">;
type ProductPublic = Omit<Product, "internalNotes">;
```

| Task | Utility |
|--------|---------|
| A card in a list | `Pick` |
| POST without id | `Omit<Product, "id">` |
| Hide internal | `Omit` |

---

## `Record<K, V>`

```typescript
type StockBySku = Record<string, number>;

const inventory: StockBySku = {
  "KB-001": 42,
  "MS-01": 100,
};
```

For a known set of keys — `as const` + a mapped type ([17-enums-const](17-enums-const.md)).

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

Useful for mocks and wrappers without duplicating the signature.

---

## `Exclude`, `Extract`, `NonNullable`

```typescript
type Status = "pending" | "paid" | "shipped" | "cancelled";
type ActiveStatus = Exclude<Status, "cancelled">;

type MaybeProduct = Product | null | undefined;
type DefiniteProduct = NonNullable<MaybeProduct>;
```

---

## Composing utilities

```typescript
type UpdateItemDto = Partial<Pick<Product, "name" | "price" | "category">>;
type ReadonlyProductList = ReadonlyArray<Pick<Product, "id" | "name">>;
```

The chain reads from the inside out: `Partial<Pick<...>>`.

---

## Mapped type (introduction)

```typescript
type Nullable<T> = { [K in keyof T]: T[K] | null };
```

Built-in utilities are a special case; for the course the **ready-made** ones are enough.

---

## Pattern: form vs API

```typescript
type ProductForm = Pick<Product, "name" | "price" | "category">;

function formToCreateDto(form: ProductForm): Omit<Product, "id"> {
  return { ...form };
}
```

---

## Related courses

| Lesson | Relation |
|------|-------|
| [13-generics](13-generics.md) | utilities are generic aliases |
| [15-lab-generics](15-lab-generics.md) | DTO repository |
| [16-classes](16-classes.md) | `implements Pick<...>` |
| [20-discriminated-unions](20-discriminated-unions.md) | `Exclude` |

---

## Common mistakes

| Mistake | Cause | Fix |
|--------|---------|-------------|
| `Partial` on the whole Product in PATCH | The client can «overwrite» id | `Pick` of allowed fields |
| `Omit` forgot a new field | Manual sync | A single `Product` source |
| `Record<string, T>` for 3 keys | Loss of exhaustiveness | Union + `as const` |
| `ReturnType` of an overload | Takes the last one | An explicit type |

---

## In production

- A single `Product` → list item, create, patch via utilities — in sync with OpenAPI `:8090`.
- A shared types package (later) — the same `Pick`/`Omit` on the frontend and the BFF.
- `Readonly` is not a deep freeze — document it for the team.

---

## Summary

Utilities transform types declaratively: **`Partial`** for a patch, **`Pick`/`Omit`** for projections, **`Record`** for dictionaries, **`ReturnType`** for inference from functions.

---

## Checklist

- How do you get «Product without id» in one line?
- Why `NonNullable` after `find`?
- How does `Partial<Pick<T,"a">>` differ from `{ a?: T["a"] }`?
- How do you get the data type of `fetchProduct` without copying fields?

Next lesson: [15. Lab: generic repository](15-lab-generics.md).
