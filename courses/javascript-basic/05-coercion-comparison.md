# 05. Приведение типов и сравнение

## Введение: сценарий с работы

Инцидент в shop checkout. Фронт отправил `{ "quantity": "2", "price": "79.99" }` — строки из `<input type="text">`. Node BFF без валидации посчитал `total = body.quantity * body.price` — получил `159.98` (повезло). В другом заказе `quantity = "2"` и `sku = "10"` дали `"210"` где-то в конкатенации с `+`. Backend FastAPI на `:8090` с Pydantic отклонил бы тело с 422; JS-слой «на доверии» — нет.

На собеседовании показывают:

```javascript
[] == ![];  // true
```

И спрашивают «почему». Разбор занимает пять минут Abstract Equality Comparison — отличный фильтр, но в **вашем** коде такого быть не должно.

Code review:

```javascript
const port = config.port || 3000;
```

Reviewer: «Если port === 0, сломается». Автор: «Ноль же falsy!» — да, и **осознанный** порт 0 (редко, но в тестах и bind) сбрасывается на 3000. Fix: `config.port ?? 3000`.

Coercion — не «злой JavaScript». Это **явные правила**, которые движок применяет, когда вы используете `==`, `+` со string, или `if (value)`. Цель главы — **предсказывать** поведение и **писать код без сюрпризов**: `===`, явные `Number()`, `??`.

## Что вы узнаете

- **Неявное приведение (coercion)** — когда и почему срабатывает.
- **Явное приведение** — `Number`, `String`, `Boolean`, `parseInt`.
- **`===` vs `==`**, редкий паттерн `x == null`.
- **`Object.is`**, сравнение строк с локалью.
- **Логические операторы** `&&`, `||`, `??` — что они **возвращают**.
- **`switch`**, условия, типичные ловушки собеседований.

## Неявное приведение: движок «догадывается»

JavaScript **слабо типизирован**: операторы часто приводят операнды к общему типу.

### Сложение и `+`

`+` — особый: если **хотя бы один** операнд string (или Symbol), результат string (конкатенация):

```javascript
"5" + 1;      // "51" — number 1 → "1"
"5" + true;   // "5true"
"qty: " + 2;  // "qty: 2"
```

Если оба «числовые» — сложение:

```javascript
5 + 1;        // 6
"5" - 1;      // 4 — минус всегда тянет к number
"5" * "2";    // 10
"5" / 2;      // 2.5
true + 1;     // 2 — true → 1
"" + false;   // "false"
```

**Правило курса:** в коде форм, API и shop totals **не полагайтесь** на неявное приведение. Явно:

```javascript
const qty = Number(form.quantity);
const price = Number(form.price);
if (!Number.isFinite(qty) || !Number.isFinite(price)) {
  throw new Error("invalid numbers");
}
const total = qty * price;
```

### Странные края (знайте, не используйте)

```javascript
[] + [];        // "" — массивы → "" + ""
[] + {};        // "[object Object]"
{} + [];        // в expression statement может дать 0 — не полагайтесь
Number("");     // 0
Number(null);   // 0
Number(undefined); // NaN
```

## Явное приведение

```javascript
Number("42");       // 42
Number("");         // 0 — частая ловушка
Number("hello");    // NaN
Number(null);       // 0
Number(undefined);  // NaN
Number(false);      // 0
Number(true);       // 1

parseInt("42px", 10);   // 42 — radix 10 обязателен
parseFloat("3.14em");   // 3.14

String(42);         // "42"
String(null);       // "null"
Boolean(0);         // false
Boolean("0");       // true — непустая строка
```

`Number()` vs `parseInt`: для **чистой** строки `"42"` оба ок. Для `"42px"` — только `parseInt`/`parseFloat`. Для валидации пользователя — `Number` + `Number.isFinite`.

## Сравнение: `===` strict equality

**`===`** сравнивает **без** приведения типов:

```javascript
5 === 5;              // true
5 === "5";            // false
0 === false;          // false
null === undefined;   // false
NaN === NaN;          // false
```

**`!==`** — negation.

**Правило:** в новом коде **всегда** `===` и `!==`.

## Сравнение: `==` abstract equality

**`==`** приводит типы по алгоритму ECMA-262 (длинная таблица). Примеры:

```javascript
5 == "5";           // true — string → number
0 == false;         // true
"" == 0;            // true
null == undefined;  // true — единственная пара «равна» при ==
[] == false;        // true — [] → "" → 0, false → 0
```

**Допустимый** idiom:

```javascript
if (value == null) {
  // value === null || value === undefined
}
```

В TypeScript-era часто пишут явно `value === null || value === undefined` или `value ?? default`.

## `Object.is`

Как `===`, но:

```javascript
Object.is(NaN, NaN);  // true
Object.is(+0, -0);    // false (+0 === -0 даёт true)
Object.is(5, "5");    // false
```

React использует `Object.is` для сравнения state (Strict Mode). В прикладном коде реже `===`.

## Сравнение строк

```javascript
"a" < "b";                    // true — UTF-16 code units
"2" < "10";                   // true — строковое сравнение!
"ä".localeCompare("z", "de"); // locale-aware sort
```

Для сортировки имён клиентов shop — **`localeCompare`**, не `<`. Для sort чисел как строк — bug; comparator `(a,b) => a - b` — [08-arrays.md](08-arrays.md).

## Логические операторы: не только true/false

`&&` и `||` возвращают **один из операндов**, не обязательно boolean:

```javascript
true && "yes";    // "yes"
false && "yes";   // false
null ?? "default";  // "default" — nullish coalescing
0 ?? "default";     // 0 — только null/undefined
0 || "default";     // "default" — 0 falsy!
"" || "guest";      // "guest"
```

Паттерны:

```javascript
// Короткое замыкание — side effect
user && sendEmail(user.email);

// Дефолт — осторожно с 0 и ""
const port = config.port || 3000;   // ломает port: 0
const portOk = config.port ?? 3000; // OK для 0

const name = user?.name ?? "Guest"; // optional chaining + nullish — урок 19
```

Разница **`||` vs `??`** критична для конфигов BFF (port, timeout `0`, пустая строка как valid value).

## Приведение в условиях

```javascript
if (items.length) { /* есть товары */ }
if (user?.email) { /* email задан и truthy */ }
if (discount != null) { /* не null и не undefined */ }
```

Пустой массив **`[]` truthy** — проверяйте `.length`. Строка `"0"` truthy — не путать с number 0.

## `switch` использует `===`

```javascript
const status = "1";
switch (status) {
  case 1:
    console.log("number one"); // не выполнится
    break;
  case "1":
    console.log("string one"); // выполнится
    break;
}
```

HTTP status из fetch — string в headers иногда; приводите осознанно.

## Coercion в JSON и API

JSON не знает `undefined` — ключ опускается при `stringify`. `null` сохраняется. FastAPI `:8090` отдаёт строгие типы; JS-клиент должен **не** смешивать `"79.99"` и `79.99` в одной формуле.

```javascript
const body = JSON.parse('{"price":79.99}');
typeof body.price; // "number" — JSON numbers

const bad = JSON.parse('{"price":"79.99"}');
typeof bad.price; // "string" — контракт нарушен на backend или middleware
```

## Как это связано с курсом

| Урок | Связь |
|------|-------|
| [04. Примитивы](04-primitives.md) | falsy, typeof, Number |
| [06. Лаба: типы](06-lab-types.md) | predict, parseAge, getPort |
| [16. Control flow](16-control-flow.md) | if, switch, циклы |
| [19. `??` и `?.`](19-optional-nullish.md) | безопасные дефолты |
| [32. Errors](32-error-handling.md) | валидация ввода |
| [`fastapi/04-pydantic`](../fastapi/04-pydantic-v2.md) | coercion на входе API |

## Типичные ошибки

**`==` «для краткости».** Экономия ноль символов, цена — час дебага `"5" == 5`.

**`||` для дефолта числового порта/таймаута.** Используйте `??` когда `0` valid.

**`+"42"` как единственная валидация.** `+"42abc"` → NaN; проверяйте `Number.isFinite`.

**Сравнение float без округления.** Деньги — integer cents или decimal lib.

**Truthiness пустого массива/объекта.** `if (users)` true для `[]`; нужен `users.length`.

**Разбор `[] == ![]` в проде.** Academic exercise; в коде — `===`.

**Забыть radix в `parseInt`.** Всегда `parseInt(s, 10)`.

## Резюме

Coercion — автоматическое приведение при `==`, `+`, `if`. В прикладном коде: **`===`**, явные **`Number`/`String`**, **`??`** вместо `||` где falsy valid. `||` и `&&` возвращают операнды — это feature для дефолтов и guards. `switch` — strict `===`. Понимание coercion объясняет баги форм и конфигов; дисциплина coding style их предотвращает.

## Чек-лист

- [ ] Результат `"3" + 2` и `"3" - 2`?
- [ ] Когда `==` допустим (один idiom)?
- [ ] Чем `||` отличается от `??` для `port: 0`?
- [ ] Почему `Number("") === 0`?
- [ ] `NaN === NaN`? Как проверить NaN?
- [ ] `[]` в `if ([])` — true или false?
- [ ] Напишите безопасный `parsePrice(input)` → number | null

Следующий урок: [06. Лаба: типы и сравнение](06-lab-types.md).
