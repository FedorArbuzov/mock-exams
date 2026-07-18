# 08. Сужение типов (type narrowing)

## Введение: сценарий с работы

BFF получает тело webhook: то **создание заказа**, то **отмена**. Поле `type` в JSON — `"order.created" | "order.cancelled"`. Пока тип `payload: unknown` или широкий union, нельзя безопасно обратиться к `payload.orderId`. После `if (payload.type === "order.created")` TypeScript **сужает** union — `orderId` доступен. Без этого паттерна разработчики пишут `(payload as any).orderId` — и снова баги как в чистом JS.

Второй кейс: `typeof price === "number"` — наследие [`javascript-basic/04`](../javascript-basic/04-primitives.md), но теперь **компилятор** понимает ветки. Третий: `error instanceof Error` в catch — не `error.message` на `unknown`. Narrowing — мост от **union/unknown** к конкретным операциям в shop-коде и парсерам ответов **:8090**.

## Что вы узнаете

- **Control flow narrowing** — TS следит за `if`, `return`, `switch`.
- **`typeof`** для примитивов.
- **`in`** для полей объекта.
- **`instanceof`** для классов и `Error`.
- **Discriminated unions** по общему полю.
- **Type predicates** `arg is T` (обзор).
- Паттерн parse boundary: `unknown` → validated type.

## Зачем narrowing

```typescript
function formatAmount(value: string | number): string {
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  return value.trim();
}
```

Вне `if` `value` — `string | number`; внутри ветки `number` — только `number`. Без проверки `.toFixed` — ошибка TS2339.

## typeof

Работает для: `"string"`, `"number"`, `"bigint"`, `"boolean"`, `"symbol"`, `"undefined"`, `"object"`, `"function"`.

```typescript
function parsePort(input: string | number): number {
  if (typeof input === "number") {
    return input;
  }
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) {
    throw new Error("Invalid port");
  }
  return parsed;
}
```

**Ловушки** (как в JS):

```typescript
typeof null;        // "object" — не сужает к null надёжно
typeof [];          // "object"
typeof (() => {});  // "function"
```

Для `null` — `value === null`; для массива — `Array.isArray(value)`.

## Truthiness narrowing

```typescript
function printTitle(title: string | undefined): void {
  if (title) {
    console.log(title.toUpperCase());
  }
}
```

Внутри ветки `title` — `string` (falsy `""` отсечён — помните из javascript-basic). Для **явного** null/undefined предпочтите `!= null` или `??`.

## in operator

```typescript
type Cat = { meow: () => void };
type Dog = { bark: () => void };

function speak(pet: Cat | Dog): void {
  if ("meow" in pet) {
    pet.meow();
  } else {
    pet.bark();
  }
}
```

Для union **объектов** с разными полями — идиома shop events.

```typescript
interface CreatedEvent {
  type: "order.created";
  orderId: number;
}

interface CancelledEvent {
  type: "order.cancelled";
  reason: string;
}

type OrderEvent = CreatedEvent | CancelledEvent;

function handleEvent(e: OrderEvent): void {
  if (e.type === "order.created") {
    console.log("New order", e.orderId);
  } else {
    console.log("Cancelled:", e.reason);
  }
}
```

## Discriminated unions

Общее поле (**discriminant**) с literal типом:

```typescript
type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; items: Product[] }
  | { status: "error"; message: string };

function render(state: LoadState): string {
  switch (state.status) {
    case "idle":
      return "Click to load";
    case "loading":
      return "Loading from :8090...";
    case "success":
      return `Items: ${state.items.length}`;
    case "error":
      return state.message;
    default:
      const _exhaustive: never = state;
      return _exhaustive;
  }
}
```

`never` в `default` — **exhaustiveness check**: забыли ветку — TS предупредит.

## instanceof

```typescript
function logError(err: unknown): void {
  if (err instanceof Error) {
    console.error(err.message, err.stack);
    return;
  }
  console.error("Unknown error", err);
}
```

Работает с классами из `global`/`node`. Plain objects из JSON **не** `instanceof` ваших interfaces.

```typescript
class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}
```

## Equality narrowing

```typescript
function example(x: string | number, y: string | boolean) {
  if (x === y) {
    // x и y: string
  }
}
```

Сравнение с **literal**:

```typescript
function setStatus(s: ProductStatus): void {
  if (s === "archived") {
  }
}
```

## Type predicates (обзор)

```typescript
interface Product {
  id: number;
  title: string;
}

function isProduct(value: unknown): value is Product {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as Product).id === "number" &&
    "title" in value &&
    typeof (value as Product).title === "string"
  );
}

function consume(raw: unknown): void {
  if (isProduct(raw)) {
    console.log(raw.title);
  }
}
```

`value is Product` — **пользовательское сужение**; для production JSON лучше Zod; для курса — понимание механизма.

## unknown vs any на границе

```typescript
async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  return res.json();
}

// const data = await fetchJson("http://localhost:8090/api/v1/items");
// data.items — error; сначала narrow или parse
```

Цепочка для shop API (упрощённо):

```typescript
function assertItemsPayload(data: unknown): asserts data is { items: Product[] } {
  if (
    typeof data !== "object" ||
    data === null ||
    !("items" in data) ||
    !Array.isArray((data as { items: unknown }).items)
  ) {
    throw new Error("Invalid items payload from API");
  }
}
```

**Assertion functions** `asserts data is T` — сужают после вызова.

## Связь с javascript-basic

Runtime проверки, которые вы писали вручную, теперь **дублируются** компилятором внутри веток:

| JS habit | TS narrowing |
|----------|----------------|
| `typeof x === "number"` | да |
| `Array.isArray(x)` | да |
| `x && x.field` | truthiness |
| `x === null` | equality |

Вне узких мест TS **не помнит** сужение — каждая ветка заново.

## Как это связано с курсом

| Урок | Связь |
|------|-------|
| [05. Unions](05-unions-intersections.md) | что сужать |
| [02. unknown](02-annotations-inference.md) | вход parse |
| [09. Лаба objects](09-lab-objects.md) | guards для каталога |
| [06. Лаба](06-lab-unions.md) | `ok` discriminant |
| [`javascript-basic/32`](../javascript-basic/32-error-handling.md) | catch unknown |

## Типичные ошибки

**Cast вместо narrow:** `(x as Product).id` — обход TS.

**Полагаться на `typeof null`.** Используйте `=== null`.

**Забыть break в switch** — fall-through ломает логику (TS не всегда спасёт).

**instanceof для interface.** Interfaces не в runtime.

**Сужение «снаружи» блока if.** TS не переносит знание между несвязанными вызовами.

**Не exhaustive switch** при union — добавьте `never` default.

## Резюме

**Narrowing** превращает `union` и `unknown` в конкретный тип через `typeof`, `in`, `===`, `instanceof`, discriminant. **Control flow** анализ — сила TS без runtime cost. Discriminated unions моделируют ответы API и UI state. На границе с **:8090** — `unknown` + guards; `as` только с доказательством. Лаба 09 закрепит на каталоге.

## Чек-лист

- [ ] Сузьте `string | number` через `typeof`
- [ ] Объясните discriminant на `LoadState`
- [ ] Почему `instanceof` не для `interface Product`?
- [ ] Что делает `value is Product`?
- [ ] Зачем `const _x: never = state` в switch?
- [ ] Отличие cast `as` от narrowing

Следующий урок: [09. Лаба: типизированный каталог](09-lab-objects.md).
