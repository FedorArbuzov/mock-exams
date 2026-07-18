# 17. Enum, `as const` и `satisfies`

## Сценарий с работы

Статусы заказа shop: `pending`, `paid`, `shipped`, `cancelled`. Команда спорит: **enum**, union с `as const`, или строки «как пришло» с API. Джун объявил `enum OrderStatus` — в bundle лишний объект; switch не исчерпывающий — новый статус с backend молча попадает в `default`. Тимлид: `const ORDER_STATUSES = [...] as const` + `satisfies readonly string[]`.

## Что вы узнаете

- **String / numeric enum** — плюсы и минусы
- **`const enum`** и tree-shaking
- **`as const`** и derived union
- **`satisfies`** — проверка без потери литералов
- Паттерн union object и валидация с `:8090`

---

## String enum

```typescript
enum OrderStatus {
  Pending = "pending",
  Paid = "paid",
  Shipped = "shipped",
  Cancelled = "cancelled",
}

function isFinal(status: OrderStatus): boolean {
  return status === OrderStatus.Cancelled;
}
```

**Плюсы:** namespace, автодополнение. **Минусы:** runtime объект; не все style guides любят enum.

---

## Numeric enum (осторожно)

```typescript
enum Direction {
  Up,    // 0
  Down,  // 1
}
```

Обратный маппинг — ловушка. Для shop — **string** литералы.

---

## `const enum`

Инлайнится при компиляции — нет runtime объекта. Минусы с isolated modules / bundler. Для HTTP-кодов часто достаточно литералов.

---

## Современная альтернатива: `as const` + union

```typescript
const ORDER_STATUSES = ["pending", "paid", "shipped", "cancelled"] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

function assertOrderStatus(value: string): asserts value is OrderStatus {
  if (!(ORDER_STATUSES as readonly string[]).includes(value)) {
    throw new Error(`Invalid status: ${value}`);
  }
}
```

Labels для UI:

```typescript
const STATUS_LABELS = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  shipped: "Отправлен",
  cancelled: "Отменён",
} as const satisfies Record<OrderStatus, string>;
```

---

## Оператор `satisfies`

Проверяет соответствие типу, **сохраняя** узкие литералы:

```typescript
type Route = "/" | "/cart" | "/checkout";

const ROUTES = {
  home: "/",
  cart: "/cart",
  checkout: "/checkout",
} as const satisfies Record<string, Route>;
```

Без `satisfies` аннотация `Record<string, Route>` **расширит** значения до `Route`, потеряв конкретные ключи.

---

## Union object pattern

```typescript
const Category = {
  Electronics: "electronics",
  Furniture: "furniture",
} as const;

type Category = (typeof Category)[keyof typeof Category];
```

Один источник правды для runtime и типов.

---

## Enum vs union

| Критерий | `enum` | `as const` + union |
|----------|--------|---------------------|
| Runtime JS | Объект | Литералы / массив |
| Новый статус API | Расхождение | Валидация + расширение |
| Exhaustive switch | Да | Да + `never` ([20](20-discriminated-unions.md)) |
| Modern style guides | Часто «избегать» | Предпочтительно |

---

## Данные с `:8090`

```typescript
function toOrderStatus(raw: string): OrderStatus {
  if ((ORDER_STATUSES as readonly string[]).includes(raw)) {
    return raw as OrderStatus;
  }
  throw new Error(`Unknown order status: ${raw}`);
}
```

Позже — Zod `.enum([...])`.

---

## `satisfies` для seed config

```typescript
type ProductSeed = { name: string; price: number; category: Category };

const SEED_PRODUCTS = [
  { name: "Keyboard", price: 79.99, category: Category.Electronics },
] as const satisfies readonly ProductSeed[];
```

---

## Связь с курсом

| Урок | Связь |
|------|-------|
| [11-arrays-tuples](11-arrays-tuples.md) | `as const` |
| [19-type-guards](19-type-guards.md) | assert status |
| [20-discriminated-unions](20-discriminated-unions.md) | tagged status |

---

## Типичные ошибки

| Ошибка | Причина | Исправление |
|--------|---------|-------------|
| Numeric enum для статусов | Привычка из C# | String union |
| Забыли `as const` | `string[]` | Assertion |
| Switch без `never` | Новый статус тихо в default | `assertNever` |
| `enum` + дубли string API | Два источника | Один `as const` |

---

## В продакшене

- Airbnb/modern TS — union + `as const`; enum только если команда договорилась.
- Статусы с backend — validate на границе, не `string` в домене.
- `satisfies` для theme, routes, category maps.

---

## Резюме

**Enum** удобен, но даёт runtime. **`as const`** + union — default для статусов shop. **`satisfies`** проверяет конфиг без потери литералов. Значения с `:8090` валидируйте и сужайте.

---

## Чек-лист

- Как получить `type OrderStatus` из массива констант?
- Зачем `satisfies Record<OrderStatus, string>`?
- Почему numeric enum опасен для статусов?
- Как обработать новый статус с API?

Следующий урок: [18. Лаба: иерархия Product](18-lab-classes.md).
