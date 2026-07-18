# 11. Массивы и кортежи: `Array<T>`, `readonly`, `as const`

## Сценарий с работы

Ответ `GET http://localhost:8090/api/v1/items` — JSON-массив. В TypeScript вы описали `Product[]`, но в одном месте вызвали `.push()` на константе каталога, в другом — передали `["electronics", 100]` туда, где ожидался tuple `[category, maxPrice]`. `tsc` поймал второе; первое прошло, и React-админка получила **мутацию кэша** — тот же баг, что в [javascript-basic/08-arrays](../javascript-basic/08-arrays.md) с `sort()` на state.

Ещё кейс: статусы заказа `["pending", "paid", "shipped"]` — нужен **union литералов**, а не `string[]`, чтобы `switch` был исчерпывающим ([20-discriminated-unions](20-discriminated-unions.md)). Senior предлагает `as const` + `(typeof STATUSES)[number]`.

## Что вы узнаете

- Синтаксис **`T[]`** и **`Array<T>`**
- **`readonly T[]`** и `ReadonlyArray<T>`
- **Кортежи** `[string, number]`, optional и rest элементы
- **`as const`** — глубокая неизменяемость и литеральные типы
- Разницу между **массивом** и **кортежем** в API
- Типичные production-баги

---

## Массивы: `T[]` и `Array<T>`

```typescript
type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
};

const products: Product[] = [
  { id: 1, name: "Keyboard", price: 79.99, category: "electronics" },
  { id: 2, name: "Mouse", price: 29.99, category: "electronics" },
];

const ids: Array<number> = products.map((p) => p.id);
```

Оба синтаксиса **эквивалентны**. Методы наследуют тип элемента:

```typescript
const cheap = products.filter((p) => p.price < 50); // Product[]
const total = products.reduce((s, p) => s + p.price, 0); // number
```

**Важно:** `filter` без type guard не сужает union — для `(Product | null)[]` нужен `filter((p): p is Product => p !== null)` ([19-type-guards](19-type-guards.md)).

---

## Readonly-массивы

```typescript
const catalog: readonly Product[] = products;

// catalog.push(...)  // error TS2339
// catalog[0] = ...   // error
```

| Тип | Мутация `push/sort` | Присвоение по индексу |
|-----|---------------------|------------------------|
| `T[]` | разрешена | разрешена |
| `readonly T[]` | ошибка compile | ошибка compile |

**Runtime:** `readonly` **не замораживает** объект — только проверка TypeScript. Shallow: `readonly` массив всё ещё позволяет мутировать **поля** элементов, если они не readonly.

Паттерн snapshot API:

```typescript
function renderCatalog(items: readonly Product[]): void {
  // items.toSorted(...) OK в ES2023+
}
```

---

## Кортежи (tuples)

Фиксированная **длина** и **тип каждой позиции**:

```typescript
type PriceRange = [min: number, max: number];
type QueryPair = [field: string, value: string];

const electronicsCap: PriceRange = [0, 100];
const filter: QueryPair = ["category", "electronics"];

function inRange(price: number, [min, max]: PriceRange): boolean {
  return price >= min && price <= max;
}
```

### Optional и rest в tuple

```typescript
type HttpResult = [status: number, body?: string];
type StringNumberRest = [string, ...number[]];

const row: StringNumberRest = ["qty", 1, 2, 3];
```

### Tuple vs array

```typescript
const a: string[] = ["a", "b", "c"];       // любая длина
const t: [string, string] = ["a", "b"];    // ровно 2
// const bad: [string, number] = ["x", 1, 2]; // error
```

**Когда tuple в shop:** пара `[category, maxPrice]`, координаты grid, `[data, error]` до discriminated union, `useState` tuple в react-курсе.

---

## `as const`: литералы и readonly глубоко

```typescript
const ORDER_STATUSES = ["pending", "paid", "shipped", "cancelled"] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];
// "pending" | "paid" | "shipped" | "cancelled"
```

Объект категорий:

```typescript
const CATEGORIES = {
  electronics: "electronics",
  furniture: "furniture",
} as const;

type CategoryKey = keyof typeof CATEGORIES;
```

Без `as const` массив статусов становится `string[]` — union литералов **теряется**. Подробнее про `satisfies` — [17-enums-const](17-enums-const.md).

---

## Типизация JSON с `:8090`

OpenAPI items — **массив объектов**, не tuple:

```typescript
interface ItemDto {
  id: number;
  title: string;
  price: number;
}

async function fetchItems(): Promise<readonly ItemDto[]> {
  const res = await fetch("http://localhost:8090/api/v1/items");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: ItemDto[] = await res.json();
  return data;
}
```

Контракт **не гарантирует** порядок полей — tuple для одного item не нужен; `ItemDto` interface лучше.

---

## Многомерные массивы

```typescript
type Matrix = number[][];
type Table = readonly (readonly string[])[];

const grid: Matrix = [
  [1, 2],
  [3, 4],
];
```

---

## Связь с курсом

| Урок | Связь |
|------|-------|
| [javascript-basic/08-arrays](../javascript-basic/08-arrays.md) | map/filter, мутации |
| [10-functions](10-functions.md) | rest `...args: T[]` |
| [12-lab-functions](12-lab-functions.md) | фильтры каталога |
| [14-utility-types](14-utility-types.md) | `Readonly`, `Pick` |
| [17-enums-const](17-enums-const.md) | `as const`, `satisfies` |

---

## Типичные ошибки

| Ошибка | Корневая причина | Исправление |
|--------|------------------|-------------|
| `[string, number][]` вместо tuple | Путаница «пара значений» | `[string, number]` для одной пары |
| Мутация `readonly` в runtime | readonly только compile-time | Копия `[...arr]` или `toSorted` |
| `string[]` для статусов | Потеря union | `as const` + derived union |
| Cast `as [A,B]` без проверки | Ложная уверенность | Валидация / Zod на границе |
| `[T]` vs `T[]` | Tuple длиной 1 vs массив | Явно документировать |

---

## В продакшене

- Кэш каталога с `:8090` храните как `readonly Product[]` — сигнал «не мутировать in place».
- Статусы и категории — один `as const` источник; guards синхронизируйте с массивом ([19-type-guards](19-type-guards.md)).
- Для CSV import — `string[][]`; для typed rows — `Product[]` после валидации.

---

## Резюме

`T[]` — однородная коллекция переменной длины. `readonly T[]` запрещает мутации в типах. **Кортеж** — фиксированные позиции. **`as const`** сохраняет литералы — основа union статусов. JSON lists от FastAPI моделируйте как `Dto[]`.

---

## Чек-лист

- Чем `readonly Product[]` отличается от `Product[]` в compile-time и runtime?
- Когда `[string, number]` лучше, чем `{ field: string; value: number }`?
- Как из `const STATUSES = [...] as const` получить union?
- Почему `filter` не убирает `null` без type guard?
- Что типизирует `Promise<readonly ItemDto[]>`?

Следующий урок: [12. Лаба: типизированные функции shop](12-lab-functions.md).
