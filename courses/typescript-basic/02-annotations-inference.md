# 02. Аннотации типов и вывод (inference)

## Введение: сценарий с работы

Code review BFF к shop API. Джун аннотировал **каждую** переменную:

```typescript
const title: string = "Keyboard";
const price: number = 79.99;
const qty: number = 2;
const total: number = price * qty;
```

Senior: «TypeScript уже вывел типы — шум мешает diff». На следующем файле тот же джун **не** аннотировал возврат функции — `return price + qty` склеил string с number, потому что `price` пришёл из query как string, а TS вывел `any` из `JSON.parse`. Два крайности: **избыточные** аннотации и **дыра `any`**.

В [`javascript-basic/04-primitives`](../javascript-basic/04-primitives.md) вы проверяли `typeof` в runtime. TypeScript делает похожее **на этапе компиляции** — но только если не отключить проверку через `any`. На `:8090` FastAPI вернёт `price` как number в JSON; до интеграции вы моделируете данные локально и учитесь **доверять inference там, где очевидно**, и **явно типизировать границы** (параметры функций, API responses).

## Что вы узнаете

- Базовые аннотации: `string`, `number`, `boolean`, `void`, `unknown`.
- **Вывод типов** (type inference) — когда TS сам знает тип.
- Где аннотации **обязательны** и где **лишни**.
- Ловушку **`any`** и почему при `strict` её избегают.
- Аннотации параметров и возвращаемых значений функций.
- Связь с привычками из javascript-basic (`typeof`, явный parse).

## Явные аннотации

Синтаксис: **имя : тип**:

```typescript
let port: number = 8090;
let apiBase: string = "http://localhost:8090/api/v1";
let debug: boolean = false;

function greet(name: string): string {
  return `Hello, ${name}`;
}
```

Для **параметров** функции аннотации почти всегда нужны (без них — неявный `any` в нестрогих режимах; при `noImplicitAny` — ошибка):

```typescript
function lineTotal(price: number, quantity: number): number {
  return price * quantity;
}
```

**Возвращаемый тип** можно опустить, если тело очевидно — TS выведет `number`. В публичном API библиотек и сложных функциях возврат **лучше указать явно** — контракт для вызывающих.

## Вывод типов (inference)

```typescript
const title = "Keyboard";       // string (literal widening до string)
let price = 79.99;              // number
const ids = [1, 2, 3];          // number[]
const product = { id: 1, title: "Mouse", price: 29.99 };
// product: { id: number; title: string; price: number }
```

Правило курса: **`const` + инициализатор** → смело без аннотации. **Границы** (аргументы функций, поля API, пустые массивы) → явно:

```typescript
const items: { id: number; title: string }[] = [];
items.push({ id: 1, title: "Desk" }); // OK

const bad = [];
bad.push({ id: 1 }); // без аннотации: never[] или any[] — боль
```

### Best common type

```typescript
const values = [1, "two", true];
// (string | number | boolean)[] — union из элементов
```

Как смешение типов в JS, но **зафиксировано** статически.

## Базовые типы TypeScript

| TS тип | JS аналог | Примечание |
|--------|-----------|------------|
| `string` | string | UTF-16 как в JS |
| `number` | number | один double + NaN, Infinity |
| `boolean` | boolean | |
| `bigint` | bigint | `100n` |
| `null` | null | отдельный тип |
| `undefined` | undefined | |
| `void` | `undefined` в return | «ничего полезного» |
| `never` | unreachable | функция всегда throw |

```typescript
function fail(msg: string): never {
  throw new Error(msg);
}

function logPrice(price: number): void {
  console.log(price);
  // return; — неявно undefined, OK для void
}
```

`void` ≠ «запрещён return» — можно `return;` или `return undefined`.

## `any` — аварийный люк (и ловушка)

`any` отключает проверку для значения:

```typescript
let payload: any = JSON.parse('{"price":"79.99"}');
const total: number = payload.price * 2; // компилируется — бомба в runtime
```

В [`javascript-basic`](../javascript-basic/04-primitives.md) тот же баг без предупреждения. С **`strict: true`** неявный `any` — ошибка; явный `any` — code smell.

```typescript
// eslint @typescript-eslint/no-explicit-any в командах mock-exams
function legacyHandler(data: any) { /* ... */ }
```

**Альтернативы:**

```typescript
function parseUnknown(raw: string): unknown {
  return JSON.parse(raw);
}

const data = parseUnknown('{"id":1}');
// data.id — ошибка TS; нужно сужение — урок 08
```

| Тип | Проверки |
|-----|----------|
| `any` | выключены |
| `unknown` | нужно сузить перед использованием |
| конкретный тип | полные проверки |

## Аннотации vs inference: практические правила

1. **Параметры функций** — аннотируйте.
2. **Возврат публичных функций** — аннотируйте, если не тривиален.
3. **Локальные `const`** с литералом — не аннотируйте без причины.
4. **Пустые коллекции** — аннотируйте элемент.
5. **Граница с JSON / :8090** — `unknown` + parse, не `any`.

Пример shop-домена:

```typescript
type Money = number; // алиас для читаемости; пока не branded

function formatRub(amount: Money): string {
  return `${amount.toFixed(2)} ₽`;
}

const unitPrice = 79.99;
formatRub(unitPrice); // inference: number → Money OK
```

## Функции: опциональные параметры и значения по умолчанию

```typescript
function fetchItems(
  baseUrl: string,
  page = 1,
  pageSize?: number
): string {
  const size = pageSize ?? 20;
  return `${baseUrl}/items?page=${page}&size=${size}`;
}

fetchItems("http://localhost:8090/api/v1");
// page: number, pageSize: number | undefined
```

Опциональный `?` и default — из JS ([`javascript-basic/10-functions`](../javascript-basic/10-functions.md)); TS отражает в типе `T | undefined`.

## Type assertions (превью — осторожно)

```typescript
const el = document.getElementById("root") as HTMLElement;
```

Утверждение **не меняет** runtime — только говорит компилятору «верь мне». Для DOM и legacy — иногда необходимо; для API JSON — предпочтите валидацию. Двойное утверждение `as unknown as Foo` — красный флаг на review.

## Связь с javascript-basic

То, что вы делали runtime:

```javascript
if (typeof value !== "number" || !Number.isFinite(value)) {
  throw new TypeError("price must be number");
}
```

В TS для **внутреннего** кода:

```typescript
function charge(price: number): void {
  // typeof не нужен — контракт на входе
}
```

Runtime checks остаются на **внешней** границе (HTTP, `JSON.parse`, localStorage) — как Pydantic на `:8090` для HTTP body.

## Как это связано с курсом

| Урок | Связь |
|------|-------|
| [04. Примитивы и литералы](04-primitives-literals.md) | literal types, `as const` |
| [05. Unions](05-unions-intersections.md) | `string \| number` |
| [08. Narrowing](08-narrowing.md) | от `unknown` к конкретному типу |
| [03. Лаба](03-lab-first-ts.md) | ошибки TS на практике |
| [`javascript-basic/04`](../javascript-basic/04-primitives.md) | семантика примитивов |

## Типичные ошибки

**Аннотировать всё подряд.** Шум; доверяйте inference для простых `const`.

**Не аннотировать пустой массив.** `const x = []` → never[] / проблемы с push.

**`any` «временно» на годы.** Один `any` заражает цепочку присваиваний.

**Считать, что типы = валидация.** `as Product` после parse не проверяет поля.

**Путать `void` и `undefined` в return type.** Для колбэков иногда важно — редкий edge case.

**Дублировать тип там, где вывод точнее.** `const x: number = 5` — лишнее.

## Резюме

**Аннотации** задают контракт; **inference** снимает рутину там, где тип очевиден из значения. Базовые типы зеркалят JS примитивы. **`any`** отключает защиту — используйте **`unknown`** на границах. Параметры и API — явно; локальные `const` — часто без аннотации. Внутренний shop-код типизируется строго; данные с `:8090` — через parse + narrowing.

## Чек-лист

- [ ] Когда TS выводит тип без аннотации?
- [ ] Зачем аннотировать параметры функции?
- [ ] Чем `any` отличается от `unknown`?
- [ ] Что вернёт inference для `const x = [1, 2, 3]`?
- [ ] Почему `const items = []` опасен без типа?
- [ ] Где в shop-BFF нужен runtime check, даже с TS?

Следующий урок: [03. Лаба: первый TypeScript](03-lab-first-ts.md).
