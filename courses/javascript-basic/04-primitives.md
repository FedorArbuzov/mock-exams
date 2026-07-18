# 04. Примитивные типы

## Введение: сценарий с работы

Production alert: «Сумма заказа #8842 не сходится на копейку». В логах Node BFF к FastAPI `:8090` вы видите `total: 109.97999999999999` вместо `109.98`. Параллельно QA заводит баг: «Поле optional `middleName` — undefined или null? API отдаёт null, фронт проверяет `if (!user.middleName)` — всё ок, но TypeScript ругается». Третий тикет: «ID товара из JSON `9007199254740993` совпал с другим товаром после парсинга» — классика **IEEE 754** и `Number.MAX_SAFE_INTEGER`.

На code review джун пишет:

```javascript
if (typeof user.id === "null") { /* ... */ }
```

Review висит неделю: `typeof null === "object"` — исторический баг, и **никогда** не вернёт `"null"`. На собеседовании вас просят перечислить **falsy** значения — кандидат забывает `0n` и `document.all` (legacy браузера).

Примитивы — не «скучная таблица для экзамена». Это **контракт данных** между FastAPI Pydantic, JSON, JavaScript и будущим TypeScript. Ошибка на уровне `number` vs `string` для `price` ломает checkout так же надёжно, как SQL injection ломает backend — просто тише.

## Что вы узнаете

- Семь **примитивных** типов ES2020+ и как их проверять.
- Почему все **numbers** (кроме BigInt) — IEEE 754 double и что из этого следует.
- **String**, immutability, шаблонные строки, базовые методы.
- **Boolean**, полный список **falsy** / **truthy** и ловушки в `if`.
- **`null` vs `undefined`** — семантика и JSON.
- **`BigInt`** и **`Symbol`** — когда нужны в реальном коде.
- Примитив vs **объект-обёртка**; надёжные проверки типов.

## Примитивы и объекты: две категории значений

В JavaScript значение либо **примитив**, либо **объект** (object), включая массивы, функции, `Date`:

```javascript
// Примитивы — хранятся «по значению» при присваивании
let a = 10;
let b = a;
b = 20;
console.log(a); // 10 — a не изменилась

// Объекты — ссылка; см. урок 07
const cartA = { items: 1 };
const cartB = cartA;
cartB.items = 2;
console.log(cartA.items); // 2
```

| Тип | Пример | `typeof` |
|-----|--------|----------|
| `undefined` | `let x;` | `"undefined"` |
| `null` | `const x = null` | `"object"` * |
| `boolean` | `true`, `false` | `"boolean"` |
| `number` | `42`, `3.14`, `NaN` | `"number"` |
| `bigint` | `100n` | `"bigint"` |
| `string` | `"hi"`, `` `hi` `` | `"string"` |
| `symbol` | `Symbol("id")` | `"symbol"` |

\* **`typeof null === "object"`** — баг совместимости с 1995 года. Единственный надёжный тест на null: **`value === null`**.

```javascript
typeof 42;              // "number"
typeof "hello";         // "string"
typeof true;            // "boolean"
typeof undefined;       // "undefined"
typeof Symbol("x");     // "symbol"
typeof 10n;             // "bigint"
typeof {};              // "object"
typeof [];              // "object" — массив тоже object!
typeof function(){};    // "function" — подвид object
```

## Number: один тип для целых и дробных

Кроме **BigInt**, все числа — **IEEE 754 double-precision** (64 бита). Целые и дробные — один тип:

```javascript
const price = 79.99;
const qty = 3;
const lineTotal = price * qty; // 239.97 — иногда 239.96999999999997

console.log(0.1 + 0.2);              // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3);      // false

// Практика для денег shop: хранить копейки integer или округлять явно
const cents = Math.round(79.99 * 100); // 7999
```

Литералы:

```javascript
42;
3.14;
1e6;           // 1000000 — экспонента
0xff;          // 255 — hex
0b1010;        // 10 — binary
NaN;           // Not a Number — результат invalid math
Infinity;
-Infinity;
```

### NaN и проверки

`NaN` — единственное значение в JS, которое **не равно само себе** при `===`:

```javascript
NaN === NaN;           // false
Number.isNaN(NaN);     // true — предпочтительно
Number.isNaN("hello"); // false — без coercion
isNaN("hello");        // true — устаревшее приведение строки
```

### Безопасные целые и BigInt

```javascript
Number.MAX_SAFE_INTEGER; // 9007199254740991 (2^53 - 1)

9007199254740992 === 9007199254740992 + 1; // true
true — потеря точности!

const productId = 9007199254740993n; // BigInt литерал
productId + 1n; // 9007199254740994n
// productId + 1; // TypeError — нельзя смешивать с number без явного приведения
```

BigInt — для ID из 64-bit snowflake, blockchain, некоторых Postgres `BIGINT` полей. Shop API mock-exams обычно укладывается в safe integer; знать границу — must для собесов.

```javascript
Number.isFinite(42); // true
Number.isFinite(Infinity); // false
Number.isInteger(3.0);     // true
Number.isInteger(3.14);    // false
```

## String: неизменяемые последовательности UTF-16

Строки **immutable** — методы возвращают **новую** строку:

```javascript
const sku = "KB-001";
sku.toUpperCase(); // "KB-001" если уже upper, или "KB-001"
console.log(sku);  // "KB-001" — исходник не изменился
```

Методы для повседневной работы с данными каталога:

```javascript
"  Keyboard  ".trim();           // "Keyboard"
"a,b,c".split(",");              // ["a", "b", "c"]
"product.json".endsWith(".json"); // true
"Mouse".includes("ou");          // true
"Keyboard".slice(0, 3);          // "Key"
"€99".length;                    // может быть 4 из-за surrogate pairs emoji
```

Шаблонные строки (ES2015):

```javascript
const name = "Ann";
const item = "Desk";
const msg = `Customer ${name} ordered ${item}.
Total lines: ${2}`;
```

**Emoji и length:** `"👋".length === 2` (surrogate pair). Для подсчёта «символов» иногда `[...str].length` или `Intl.Segmenter`.

## Boolean и truthy / falsy

Условия и `&&`/`||` приводят операнды к boolean контексту, но не всегда возвращают `true`/`false` — см. [05-coercion-comparison.md](05-coercion-comparison.md).

**Falsy** — значения, которые в `if (x)` ведут себя как false:

```javascript
Boolean(false);     // false
Boolean(0);         // false
Boolean(-0);        // false
Boolean(0n);        // false — BigInt zero
Boolean("");        // false
Boolean(null);      // false
Boolean(undefined); // false
Boolean(NaN);       // false
```

**Всё остальное truthy**, включая:

```javascript
Boolean([]);        // true — пустой массив!
Boolean({});        // true
Boolean("0");       // true — непустая строка
Boolean("false");   // true
```

```javascript
const port = 0;
if (port) {
  console.log("custom port"); // не выполнится — 0 falsy
}
// Для дефолтов порта BFF используйте ?? — урок 05, 19
```

## `null` vs `undefined`

| | `undefined` | `null` |
|---|-------------|--------|
| Смысл | «значение не задано» | «намеренно пусто / нет объекта» |
| Тип | undefined | object (typeof bug для null) |
| JSON | ключ опускается | `"field": null` |
| Типичный источник | нет свойства, нет return, необъявленный параметр | API, БД, явное обнуление |

```javascript
const user = { name: "Ann" };
console.log(user.middleName); // undefined — свойства нет

const response = JSON.parse('{"discount":null}');
console.log(response.discount); // null — сервер явно сказал «нет скидки»

function greet(name) {
  console.log(name); // undefined если вызвать greet()
}
```

Современный дефолт: **`??`** (nullish coalescing) — [19-optional-nullish.md](19-optional-nullish.md). `user.middleName ?? ""` подставит `""` только для `null`/`undefined`, не для `0`.

## Symbol: уникальные ключи

```javascript
const id = Symbol("product");
const id2 = Symbol("product");
console.log(id === id2); // false — каждый Symbol уникален

const meta = {
  name: "Keyboard",
  [id]: { internalSku: "KB-INTERNAL" },
};
console.log(meta[id]); // { internalSku: "KB-INTERNAL" }
console.log(Object.keys(meta)); // ["name"] — Symbol не в keys
```

Используются для **well-known symbols** (`Symbol.iterator`, `Symbol.toStringTag`) и скрытых полей. В прикладном shop-коде реже строк; в библиотеках и фреймворках — часто.

## Примитив vs объект-обёртка

```javascript
"hello".toUpperCase(); // работает — temporary String object
```

Движок **autoboxing**: на мгновение оборачивает примитив, вызывает метод, отбрасывает обёртку. **Не делайте:**

```javascript
const s = new String("x"); // object, не primitive — антипаттерн
typeof s; // "object"
```

## Проверка типов в прикладном коде

```javascript
function formatPrice(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError("price must be finite number");
  }
  return value.toFixed(2);
}

const items = [{ id: 1 }, { id: 2 }];
Array.isArray(items);     // true — не typeof

const data = null;
data === null;            // единственный надёжный null-check
data === undefined;       // undefined check

// typeof для null бесполезен:
typeof null === "object"; // true — ловушка
```

Избегайте `instanceof String` для примитивов — вернёт false. TypeScript позже заменит часть runtime checks статикой.

## Парсинг строк в числа (мост к лабе 06)

```javascript
Number("42");       // 42
Number("");         // 0 — осторожно!
Number(" 42 ");     // 42
Number("42px");     // NaN
parseInt("42px", 10);  // 42 — всегда указывайте radix 10
parseFloat("3.14em");  // 3.14
```

Для query `?page=2` из URL shop — явный парсинг и проверка `Number.isFinite`, не надежда на `+page`.

## Как это связано с курсом

| Урок | Связь |
|------|-------|
| [02. Переменные](02-variables-strict.md) | `typeof`, литералы |
| [05. Coercion](05-coercion-comparison.md) | приведение string ↔ number |
| [06. Лаба: типы](06-lab-types.md) | parseAge, falsy quiz |
| [07. Объекты](07-objects.md) | примитив vs ссылка |
| [19. `??` и `?.`](19-optional-nullish.md) | null/undefined в API |
| [35. JSON, Date](35-regex-json-date.md) | сериализация типов |
| [`fastapi/04-pydantic`](../fastapi/04-pydantic-v2.md) | контракт типов на backend |

## Типичные ошибки

**`typeof x === "null"`.** Никогда не сработает. Используйте `x === null`.

**Сравнение float без epsilon для денег.** `0.1 + 0.2 === 0.3` — false. Округление, integer cents, decimal library в финтех.

**`if (array)` вместо `if (array.length)`.** `[]` truthy — пустой каталог пройдёт проверку.

**`parseInt("08")` без radix.** В ES5 было octal; сейчас `8`, но привычка `parseInt(s, 10)` обязательна.

**Смешивать BigInt и Number в арифметике.** Явное `Number(big)` или `BigInt(num)` осознанно.

**`isNaN(x)` вместо `Number.isNaN(x)`.** Первый приводит — `"hello"` станет NaN true.

**Хранить большие ID в number.** Выше `MAX_SAFE_INTEGER` — коллизии; BigInt или string ID.

## Резюме

Семь примитивов: **undefined, null, boolean, number, bigint, string, symbol**. Number — double (кроме BigInt); деньги и сравнения float требуют дисциплины. String immutable; falsy — восемь значений, всё остальное truthy. `null` — намеренная пустота в JSON; `undefined` — «нет значения». `typeof null === "object"` — помнить на собесах. Надёжные проверки: `=== null`, `Array.isArray`, `Number.isFinite`, `typeof` для string/boolean/undefined.

## Чек-лист

- [ ] Перечислите 7 примитивов без подсказки
- [ ] Назовите все falsy значения
- [ ] Почему `0.1 + 0.2 !== 0.3`?
- [ ] Когда нужен BigInt вместо number?
- [ ] Чем `null` отличается от `undefined` в ответе API?
- [ ] Как правильно проверить, что значение — `null`?
- [ ] Почему `typeof []` — `"object"`, а не `"array"`?

Следующий урок: [05. Приведение типов и сравнение](05-coercion-comparison.md).
