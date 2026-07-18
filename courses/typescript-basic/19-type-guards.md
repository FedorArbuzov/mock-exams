# 19. Type guards: сужение типов в runtime

## Сценарий с работы

BFF получает `unknown` из `res.json()` после `fetch` на `:8090`. Джун кастует `as Product` — приходит `{ title: 123 }`, админка падает на `name.toUpperCase()`. Нужны **проверки в runtime**, после которых TypeScript **сужает** тип: `value is Product`, `typeof` / `in` / `instanceof`, **assertion functions** `asserts value is T` для fail-fast на границе API.

Связь с [08-narrowing](08-narrowing.md): там control flow; здесь — **свои** предикаты для доменных типов shop.

## Что вы узнаете

- **User-defined type guard** `function isProduct(x: unknown): x is Product`
- **Assertion functions** `asserts value is T`
- Встроенные guards и `filter` с предикатом
- `unknown` vs `any` на границе I/O
- Ограничения и антипаттерн `as`

---

## Зачем guards на границе

```typescript
async function fetchUnknown(): Promise<unknown> {
  const res = await fetch("http://localhost:8090/api/v1/items/1");
  return res.json();
}

async function loadProduct(): Promise<Product> {
  const data = await fetchUnknown();

  if (!isProduct(data)) {
    throw new Error("Invalid product payload");
  }

  return data; // Product — без `as`
}
```

TypeScript **доверяет** guard после ветки `if`.

---

## Встроенное сужение

### `typeof` — примитивы

```typescript
function formatId(id: string | number): string {
  if (typeof id === "number") return String(id);
  return id.trim();
}
```

### `in` — поля объекта

```typescript
type Admin = { role: "admin"; permissions: string[] };
type Guest = { role: "guest" };

function canEdit(user: Admin | Guest): boolean {
  if ("permissions" in user) {
    return user.permissions.includes("edit");
  }
  return false;
}
```

### `instanceof` — классы

```typescript
function logProduct(item: Product | string) {
  if (item instanceof Product) {
    console.log(item.describe());
  }
}
```

`instanceof` — для **конструкторов**, не для interface.

---

## User-defined type guard

```typescript
export function isProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "number" &&
    typeof v.name === "string" &&
    typeof v.price === "number" &&
    typeof v.category === "string"
  );
}

function isProductArray(value: unknown): value is Product[] {
  return Array.isArray(value) && value.every(isProduct);
}
```

### С `filter`

```typescript
const mixed: (Product | null)[] = [product, null, product];

const onlyProducts = mixed.filter((p): p is Product => p !== null);
// Product[] — не (Product | null)[]
```

Без `p is Product` union **не сужается**.

---

## Assertion functions

```typescript
export function assertProduct(value: unknown): asserts value is Product {
  if (!isProduct(value)) {
    throw new Error("Expected Product shape");
  }
}

function process(data: unknown) {
  assertProduct(data);
  console.log(data.name); // Product
}
```

| | Type guard `is T` | Assertion `asserts` |
|---|-------------------|---------------------|
| Возврат | `boolean` | `void` |
| Ошибка | вызывающий решает | обычно throw |

---

## Сужение union литералов

Синхронизируйте с `as const` из [17-enums-const](17-enums-const.md):

```typescript
const PAYMENT_METHODS = ["card", "cash", "invoice"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

function isPaymentMethod(s: string): s is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(s);
}
```

---

## `unknown` vs `any`

```typescript
function parseJson(text: string): unknown {
  return JSON.parse(text);
}
```

На границе I/O — **`unknown` + guard**, не `any`.

---

## Ограничения guards

- Структурная проверка — не заменяет Zod для сложных правил.
- `isProduct` может не проверять `price >= 0` — бизнес-валидация отдельно.
- Предикат должен быть **честным** — ложный `true` ломает типизацию в runtime.

---

## Связь с курсом

| Урок | Связь |
|------|-------|
| [08-narrowing](08-narrowing.md) | control flow |
| [11-arrays-tuples](11-arrays-tuples.md) | `filter` + `is T` |
| [21-lab-discriminated](21-lab-discriminated.md) | ApiResult |
| [javascript-basic/32-error-handling](../javascript-basic/32-error-handling.md) | throw на границе |

---

## Типичные ошибки

| Ошибка | Причина | Исправление |
|--------|---------|-------------|
| `as Product` на json | Нет runtime check | `isProduct` |
| Guard всегда `true` | Лень проверять | Честный предикат |
| `instanceof` для interface | Нет класса | Structural guard |
| `filter(Boolean)` | Не сужает | `filter((x): x is T => ...)` |

---

## В продакшене

- Единая точка guards для `:8090` — `product-guards.ts`, не `as` в каждом handler.
- FastAPI может отдавать `title` — guard или mapper **до** доменного `Product`.
- Позже Zod заменит ручные guards — не дублируйте правила в двух местах.

---

## Резюме

Guards связывают runtime проверку и compile-time типы. `is X(value): value is X` для `unknown`. Assertions — fail-fast. `filter` с предикатом убирает `null` из union.

---

## Чек-лист

- Чем `unknown` лучше `any` на границе JSON?
- Почему `filter(Boolean)` не даёт `Product[]`?
- Чем assertion отличается от guard?
- Когда `instanceof` не подходит?

Следующий урок: [20. Discriminated unions](20-discriminated-unions.md).
