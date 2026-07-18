# 04. Примитивы и литеральные типы

## Введение: сценарий с работы

Интеграция с FastAPI `:8090`: в OpenAPI поле `status` — enum `active | archived | draft`. На фронте джун сравнивает `if (product.status === "Active")` — регистр не тот, ветка never срабатывает. Параллельно в TS-модели написали `status: string` — компилятор **молчит**, хотя ошибка очевидна при **literal union** `status: "active" | "archived" | "draft"`.

Второй тикет: `productId` в URL — `9007199254740993`. В [`javascript-basic/04-primitives`](../javascript-basic/04-primitives.md) вы помните `MAX_SAFE_INTEGER`. В TS `number` тот же IEEE 754; для snowflake ID нужен `bigint` или `string`.

Третий кейс: конфиг `mode: "dev"` | `"prod"` — случайно присвоили `"development"`. **Literal type** + union ловит на `tsc`. Примитивы в TS — зеркало JS с **дополнительным слоем** точности на этапе компиляции.

## Что вы узнаете

- Примитивы TS: `string`, `number`, `boolean`, `bigint`, `null`, `undefined`.
- **Literal types** — тип как одно конкретное значение.
- **`as const`** — заморозка литералов в объектах и массивах.
- Отличие `string` vs `"keyboard"` как типа.
- Подготовка к **union** статусов shop ([05-unions-intersections.md](05-unions-intersections.md)).
- Связь с JSON от `:8090` и Pydantic enums.

## Примитивы: те же значения, что в JavaScript

TypeScript **не добавляет** новых runtime-примитивов (кроме того, что вы не пишете новый синтаксис):

```typescript
const title: string = "Keyboard";
const price: number = 79.99;
const inStock: boolean = true;
const bigId: bigint = 9007199254740993n;
const empty: null = null;
const missing: undefined = undefined;
```

Семантика `number` — double, `0.1 + 0.2`, `NaN` — как в [javascript-basic/04](../javascript-basic/04-primitives.md). TS не спасает от float-багов — только от присвоения **не того типа**.

```typescript
const lineTotal: number = price * 3; // OK
const broken: number = "79.99";      // TS2322
```

## Literal types

**Литерал** как тип — ровно одно значение:

```typescript
let port: 8090 = 8090;
port = 8091; // error — ожидается 8090

let method: "GET" | "POST" = "GET";
method = "DELETE"; // error
```

Для shop API:

```typescript
type ProductStatus = "active" | "archived" | "draft";

const status: ProductStatus = "active";
// const bad: ProductStatus = "Active"; // TS2322 — регистр важен
```

Сравнение с Python/FastAPI: `Literal["active", "archived"]` в Pydantic — тот же контракт на backend; на клиенте — **синхронизировать** строки с OpenAPI.

### Widening

```typescript
let x = "active"; // let → тип string (widened)
const y = "active"; // const без as const → всё ещё string для const... 
```

На самом деле для `const y = "active"` inference даёт literal `"active"` (не widened до string) — удобно для readonly конфигов:

```typescript
const y = "active";
// type of y: "active"

let z = "active";
// type of z: string
```

## `as const` — глубокие литералы

```typescript
const config = {
  apiBase: "http://localhost:8090/api/v1",
  timeout: 5000,
  methods: ["GET", "POST"] as const,
} as const;

// config.apiBase: "http://localhost:8090/api/v1"
// config.methods: readonly ["GET", "POST"]
// config.methods.push("DELETE"); // error
```

Без `as const`:

```typescript
const loose = { role: "admin" };
// loose.role: string — не "admin"
```

Паттерн для **frozen** shop-констант и route paths в nodejs-basic.

## Строки, шаблоны, union литералов

```typescript
type SkuPrefix = "KB-" | "MS-" | "DS-";

function isKeyboardSku(sku: string): sku is `${SkuPrefix}${string}` {
  return sku.startsWith("KB-");
}
```

Template literal types — продвинутая тема; на базовом курсе достаточно знать, что `type Event = "click" | "focus"` — обычный union литералов.

## Number и BigInt

```typescript
const safeId: number = 9007199254740991; // OK
// const unsafe: number = 9007199254740993; // возможно предупреждение lint

const dbId: bigint = 9007199254740993n;
// dbId + 1n OK; dbId + 1 — TS error
```

Для ID из Postgres `BIGINT` в BFF часто **`string` в JSON** или `bigint` после явного parse — согласуйте с [`fastapi`](../fastapi/README.md) схемой.

## Boolean и truthiness

TS не различает truthy/falsy в типах — только `boolean`:

```typescript
function setFeatured(flag: boolean): void {
  console.log(flag);
}

setFeatured(true);
// setFeatured(1); // TS error — в JS прошло бы
```

Логика `if (port)` с `port: number` — по-прежнему ловушка `0` из javascript-basic; типы не заменяют `??` для дефолтов.

## Символы и уникальные ключи

```typescript
const brand: unique symbol = Symbol("brand");
type BrandedPrice = number & { [brand]: true };
```

На базовом курсе — знать, что `symbol` существует; branded types — позже.

## Примитивы в объектах и JSON

`JSON.parse` не даёт `bigint`/`undefined` в стандартном JSON:

```typescript
interface ItemDto {
  id: number;
  title: string;
  price: number;
  featured: boolean;
}
```

Поля `null` из API — `string | null` или optional `?` — в [05-unions-intersections.md](05-unions-intersections.md).

## Как это связано с курсом

| Урок | Связь |
|------|-------|
| [05. Unions](05-unions-intersections.md) | union литералов `ProductStatus` |
| [02. Inference](02-annotations-inference.md) | widening `let` vs `const` |
| [06. Лаба unions](06-lab-unions.md) | shop status |
| [`javascript-basic/04`](../javascript-basic/04-primitives.md) | runtime семантика |
| [`fastapi/04-pydantic`](../fastapi/04-pydantic-v2.md) | Literal, Enum на backend |

## Типичные ошибки

**`status: string` вместо union литералов.** Теряете проверку опечаток.

**Путать `"active"` (тип) и `string`.** Присвоение произвольной строки только у `string`.

**Ждать от TS исправления float.** `number` остаётся IEEE 754.

**Забыть `n` у BigInt.** `9007199254740993` — number с потерей точности.

**`as const` на всём подряд.** Readonly мешает мутациям там, где нужен mutable builder.

**Несовпадение регистра с API.** `"active"` vs `"ACTIVE"` — договорённость с OpenAPI :8090.

## Резюме

Примитивы TS отражают JS. **Literal types** сужают `string`/`number` до конкретных значений — идеально для статусов shop и HTTP methods. **`as const`** фиксирует глубокие литералы в конфигах. `bigint` для больших ID; `boolean` не смешивается с `number`. Следующий шаг — **unions** нескольких литералов и optional поля.

## Чек-лист

- [ ] Чем `string` отличается от типа `"active"`?
- [ ] Что делает `as const` на объекте конфига?
- [ ] Почему `let x = "a"` имеет тип `string`, а `const y = "a"` — часто `"a"`?
- [ ] Когда выбрать `bigint` вместо `number`?
- [ ] Как literal union помогает для `ProductStatus`?
- [ ] Повторите: `0.1 + 0.2` в TS всё ещё не `0.3`

Следующий урок: [05. Union, intersection и optional](05-unions-intersections.md).
