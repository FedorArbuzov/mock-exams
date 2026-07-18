# 15. Лаба: generic repository

## Зачем эта лаба

Перед Postgres (nodejs-intermediate) — **in-memory** слой shop: generic `MemoryRepository<T>`, специализация `ProductRepository`. DTO create/update — через [14-utility-types](14-utility-types.md). Позже тот же `Repository<T>` станет HTTP-клиентом к FastAPI `:8090` без смены сигнатур сервиса.

**Время:** ~55–70 минут. Продолжайте проект из [12-lab-functions](12-lab-functions.md).

---

## Задание 1. Базовые типы

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

## Задание 2. Интерфейс `Repository<T>`

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

## Задание 3. `MemoryRepository<T>`

```typescript
export class MemoryRepository<T extends HasId> implements Repository<T> {
  #items = new Map<number, T>();
  #nextId = 1;

  constructor(private readonly factory: (data: Omit<T, "id">, id: number) => T) {}

  create(data: Omit<T, "id">): T {
    // TODO: factory(data, #nextId++), Map.set
  }

  update(id: number, patch: Partial<T>): T | undefined {
    // TODO: merge, игнорировать patch.id
  }
  // getAll, getById, delete — см. шаблон в репозитории курса
}
```

---

## Задание 4. `ProductRepository`

`findByCategory`, `applyDiscount(id, percent)` (0–100, throw), `createProductRepo(seed)`.

---

## Задание 5. Демо

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

## Задание 6 (опционально). `OrderRepository.markPaid`

Комментарий: почему `Repository<Order>` лучше несвязанных классов.

---

## Задание 7 (опционально). Мост к API

```typescript
export interface ProductApiClient extends Repository<Product> {
  // реализация через fetch :8090
}
```

Перечислите соответствие методов ↔ `GET/POST/PATCH/DELETE` items.

---

## Критерии успеха

- [ ] `MemoryRepository` generic, `Omit<T,"id">` на create
- [ ] `applyDiscount` типизирован
- [ ] `npx tsc` strict

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| Duplicate id | `#nextId`, не `length` |
| `update` мутирует ссылку | `{ ...existing, ...patch, id }` |
| `Partial<T>` patch id | деструктурировать `id` из patch |

## Связь с курсом

| Дальше | Связь |
|--------|-------|
| [16-classes](16-classes.md) | `implements`, `#` |
| [18-lab-classes](18-lab-classes.md) | Product hierarchy |
| [`deploy/fastapi`](../../deploy/fastapi/README.md) | REST items |

Следующий урок: [16. Классы с типами](16-classes.md).

## Чек-лист

- [ ] Generic constraint `T extends HasId`
- [ ] DTO через `Omit` / `Partial<Pick<...>>`
- [ ] Понимаете замену in-memory на fetch
