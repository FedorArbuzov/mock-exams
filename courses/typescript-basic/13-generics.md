# 13. Generics: обобщённые функции и интерфейсы

## Сценарий с работы

В shop-сервисе три репозитория: `Product`, `Order`, `Customer`. Джун копирует `findById(id: number): Product | undefined` три раза. При добавлении `Warehouse` — четвёртая копия. Тимлид просит **один** `findById<T extends HasId>(...)` с ограничением «T имеет поле `id`».

Другой кейс: `wrapResponse(data)` должен вернуть `{ data: T, meta: ... }` с **сохранением** типа `T`, а не `unknown`. Generics — «тип уточняется при вызове» без жертвы `any`.

## Что вы узнаете

- **Generic functions** `<T>` и вывод типа
- **Generic interfaces** (`Repository<T>`, `ApiList<T>`)
- **Constraints** `T extends HasId`
- Несколько параметров типа и **default** generic
- Антипаттерны и variance (практическая интуиция)

---

## Generic-функция: базовый паттерн

```typescript
function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}

const a = first([1, 2, 3]);           // number | undefined
const b = first(["keyboard", "mouse"]); // string | undefined
```

TypeScript **выводит** `T` из аргумента. Явная передача: `first<Product>(products)`.

Когда вывод ломается (пустой массив `[]`):

```typescript
const empty = [] as Product[]; // или generic default
```

---

## Зачем не `any`

```typescript
function identityBad(x: any): any { return x; }
function identity<T>(x: T): T { return x; }

const p = identity({ id: 1, name: "Desk" });
// { id: number; name: string } — тип сохранён
```

Реальный кейс shop: `cache.get<T>(key)` возвращает тот же `T`, что положили.

---

## Constraints: `extends`

```typescript
type HasId = { id: number };

function findById<T extends HasId>(
  items: readonly T[],
  id: number
): T | undefined {
  return items.find((item) => item.id === id);
}

type Product = HasId & { name: string; price: number };

const found = findById(products, 1); // Product | undefined
```

**Почему `extends`:** внутри функции доступно `item.id`.

### Constraint на ключи

```typescript
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

pluck(products[0], "name");  // string
// pluck(products[0], "foo"); // error
```

---

## Generic interfaces

```typescript
interface Repository<T extends HasId> {
  getAll(): Promise<readonly T[]>;
  getById(id: number): Promise<T | undefined>;
  save(entity: T): Promise<T>;
}

interface ProductRepo extends Repository<Product> {
  findByCategory(category: string): Promise<Product[]>;
}
```

Реализация — [15-lab-generics](15-lab-generics.md).

### API list wrapper

```typescript
interface ApiList<T> {
  items: T[];
  total: number;
  page: number;
}

async function fetchProductPage(): Promise<ApiList<Product>> {
  const res = await fetch("http://localhost:8090/api/v1/items?page=1");
  return res.json();
}
```

Контракт pagination — [`fastapi/17-pagination`](../fastapi/17-pagination-filters.md).

---

## Несколько type parameters

```typescript
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}

function mapValues<T extends object, R>(
  obj: T,
  fn: (value: T[keyof T]) => R
): Record<keyof T, R> {
  const result = {} as Record<keyof T, R>;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    result[key] = fn(obj[key]);
  }
  return result;
}
```

---

## Generic class (затравка)

```typescript
class Box<T> {
  #value: T;
  constructor(value: T) { this.#value = value; }
  get(): T { return this.#value; }
  map<R>(fn: (v: T) => R): Box<R> {
    return new Box(fn(this.#value));
  }
}
```

Подробнее — [16-classes](16-classes.md).

---

## Default type parameter

```typescript
interface Paginated<T, M = { page: number; total: number }> {
  items: T[];
  meta: M;
}
```

---

## Variance (интуиция)

Под `strictFunctionTypes` нельзя присвоить `(p: { name: string }) => void` туда, где ждут `(p: Product) => void` — параметры **контравариантны**. Не передавайте «слишком узкий» колбэк без понимания контракта.

---

## Связь с курсом

| Урок | Связь |
|------|-------|
| [10-functions](10-functions.md) | `first<T>` |
| [14-utility-types](14-utility-types.md) | `Partial<T>` |
| [15-lab-generics](15-lab-generics.md) | Repository |
| [19-type-guards](19-type-guards.md) | `filter` с `p is T` |

---

## Типичные ошибки

| Ошибка | Причина | Исправление |
|--------|---------|-------------|
| `T extends any` | Отключает проверки | Конкретный constraint |
| `findById` → `HasId` | Не сохранили T | `T \| undefined` |
| Generic без использования T | Лишний параметр | Удалить |
| Копипаста 5 репозиториев | Страх generics | `Repository<T>` |

---

## В продакшене

- Один `Repository<T extends HasId>` — мост к HTTP-клиенту `:8090` в nodejs-курсе.
- Generic на **границе** (cache, API wrapper); доменные типы — конкретные `Product`, `Order`.
- Не `<any>` «чтобы скомпилилось» — исправьте аргумент или constraint.

---

## Резюме

Generics параметризуют типы без стирания в `any`. `T extends Constraint` ограничивает допустимые типы. Generic interfaces — контракты для shop и API. Вывод работает в большинстве вызовов.

---

## Чек-лист

- Чем `identity<T>(x: T): T` лучше `(x: any) => any`?
- Зачем `T extends HasId` в `findById`?
- Как TS выводит `T` в `first([1,2,3])`?
- Когда generic **не** нужен?

Следующий урок: [14. Utility types](14-utility-types.md).
