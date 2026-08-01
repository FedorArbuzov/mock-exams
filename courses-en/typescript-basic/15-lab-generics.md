# 15. Lab: generic repository

## Why this lab

Before Postgres (nodejs-intermediate) — an **in-memory** shop layer: a generic `MemoryRepository<T>`, a specialization `ProductRepository`. The create/update DTOs — via [14-utility-types](14-utility-types.md). Later the same `Repository<T>` becomes an HTTP client to FastAPI `:8090` without changing the service signatures.

**Time:** ~55–70 minutes. Continue the project from [12-lab-functions](12-lab-functions.md).

---

## Task 1. Base types

`lab/domain.ts`:

```typescript
export type HasId = { id: number };

export type Product = HasId & {
  name: string;
  price: number;
  category: string;
};

export type Order = HasId & {
  customerId: number;
  status: "pending" | "paid" | "shipped";
  total: number;
};

export type CreateProduct = Omit<Product, "id">;
export type UpdateProduct = Partial<Pick<Product, "name" | "price" | "category">>;
```

---

## Task 2. The `Repository<T>` interface

```typescript
export interface Repository<T extends HasId> {
  getAll(): readonly T[];
  getById(id: number): T | undefined;
  create(data: Omit<T, "id">): T;
  update(id: number, patch: Partial<T>): T | undefined;
  delete(id: number): boolean;
}
```

---

## Task 3. `MemoryRepository<T>`

```typescript
export class MemoryRepository<T extends HasId> implements Repository<T> {
  #items = new Map<number, T>();
  #nextId = 1;

  constructor(private readonly factory: (data: Omit<T, "id">, id: number) => T) {}

  create(data: Omit<T, "id">): T {
    // TODO: factory(data, #nextId++), Map.set
  }

  update(id: number, patch: Partial<T>): T | undefined {
    // TODO: merge, ignore patch.id
  }
  // getAll, getById, delete — see the template in the course repository
}
```

---

## Task 4. `ProductRepository`

`findByCategory`, `applyDiscount(id, percent)` (0–100, throw), `createProductRepo(seed)`.

---

## Task 5. Demo

```typescript
const repo = createProductRepo([
  { name: "Keyboard", price: 79.99, category: "electronics" },
  { name: "Mouse", price: 29.99, category: "electronics" },
]);
repo.applyDiscount(1, 10); // ~71.99
repo.delete(2);
```

```bash
npx tsc && node dist/lab/15-demo.js
```

---

## Task 6 (optional). `OrderRepository.markPaid`

A comment: why `Repository<Order>` is better than unrelated classes.

---

## Task 7 (optional). A bridge to the API

```typescript
export interface ProductApiClient extends Repository<Product> {
  // implementation via fetch :8090
}
```

List the correspondence of methods ↔ `GET/POST/PATCH/DELETE` items.

---

## Success criteria

- [ ] `MemoryRepository` generic, `Omit<T,"id">` on create
- [ ] `applyDiscount` is typed
- [ ] `npx tsc` strict

## If something went wrong

| Symptom | Solution |
|---------|---------|
| Duplicate id | `#nextId`, not `length` |
| `update` mutates the reference | `{ ...existing, ...patch, id }` |
| `Partial<T>` patch id | destructure `id` out of the patch |

## Related courses

| Next | Relation |
|--------|-------|
| [16-classes](16-classes.md) | `implements`, `#` |
| [18-lab-classes](18-lab-classes.md) | Product hierarchy |
| [`deploy/fastapi`](../../deploy/fastapi/README.md) | REST items |

Next lesson: [16. Classes with types](16-classes.md).

## Checklist

- [ ] Generic constraint `T extends HasId`
- [ ] DTOs via `Omit` / `Partial<Pick<...>>`
- [ ] You understand replacing in-memory with fetch
