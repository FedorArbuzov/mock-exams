# 02. Переменные: `let`, `const`, `var`, strict mode

## Введение: сценарий с работы

Code review пятницы. Senior оставляет три комментария в одном файле: «Зачем здесь `var`?», «Почему `const`, если ты потом делаешь `config = loadConfig()` во второй раз?», «ReferenceError: Cannot access 'token' before initialization — посмотри на строку 88». Автор MR — вы, после трёх часов дебага JWT refresh в Node BFF к FastAPI `:8090`. Оказывается, `let token` объявлен **ниже** первого `fetch`, а в strict mode (а ES modules **всегда** strict) доступ к `token` в TDZ бросает ошибку, а не даёт `undefined` как старый `var`.

Второй эпизод — классика собеседований и продакшена:

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 3, 3, 3 — а не 0, 1, 2
```

Интерviewer спрашивает: «Почему?» Вы помните «что-то про closure», но корень — **function scope** у `var` и одна общая переменная `i`. С `let` каждая итерация получает **свою** binding.

Третий — из UI shop-каталога: `const CART = []`, reviewer: «константа!» — но вы **push**-ите товары каждый клик. `const` запрещает **переприсвоить** имя `CART`, не запрещает менять **содержимое** массива. Путаница между «неизменяемая ссылка» и «глубоко immutable объект» ломает и code review, и React state.

Эта глава — не таблица «let vs const vs var», а **модель памяти и scope**, чтобы вы предсказывали поведение до запуска.

## Что вы узнаете

- Три способа объявить переменную: **`var`**, **`let`**, **`const`** — и когда какой использовать.
- **Блочную** vs **функциональную** область видимости.
- **Hoisting** и **Temporal Dead Zone (TDZ)** — почему `let` «ломается» до строки объявления.
- Что **`const`** на самом деле фиксирует (binding, не глубокую неизменяемость).
- Директиву **`"use strict"`** и почему в modules она уже включена.
- **`globalThis`**, стиль имён, базовые литералы и операторы (прелюдия к типам).

## Три способа объявить переменную

```javascript
var legacyCounter = 0;   // ES5, function scope — не используйте в новом коде
let retryCount = 0;      // block scope, можно переприсвоить
const API_BASE = "http://localhost:8090/api/v1";  // block scope, binding нельзя переприсвоить
```

| Ключевое слово | Область видимости | Переприсвоение binding | Hoisting |
|----------------|-------------------|------------------------|----------|
| `var` | функция или global | да | да, как `undefined` |
| `let` | блок `{ }` | да | TDZ до объявления |
| `const` | блок `{ }` | нет | TDZ до объявления |

**Binding** — связь имени с ячейкой памяти. `const x = obj` фиксирует, что **имя `x`** всегда указывает на **тот же объект** (пока живёт scope); свойства объекта могут меняться.

**Правило курса:** по умолчанию **`const`**. **`let`** — если нужно переприсвоение (`retryCount++`, `for (let i …)`). **`var`** — только при чтении легаси, не в новом коде.

## `const` не делает объект неизменяемым

Типичный объект пользователя shop:

```javascript
const user = { name: "Ann", role: "customer" };

user.name = "Bob";       // OK — меняем свойство
user.lastLogin = new Date();  // OK — добавляем свойство
// user = { name: "X" };  // TypeError: Assignment to constant variable

const cart = [];
cart.push({ sku: "KB-1", qty: 1 });  // OK
// cart = [];  // TypeError
```

Для **поверхностной** заморозки — `Object.freeze(user)` (не защищает вложенные объекты). Для React и reducers — **иммутабельные паттерны** (новый объект через spread) — [08-arrays.md](08-arrays.md), react-курс. `const` здесь значит: «это имя не будет указывать на другой массив/объект», а не «массив никогда не меняется».

## Блочная область: `let` и `const`

```javascript
if (true) {
  let discount = 0.1;
  const maxItems = 100;
  console.log(discount); // 0.1
}
// console.log(discount); // ReferenceError: discount is not defined
// console.log(maxItems);   // ReferenceError
```

Блоки `if`, `for`, `while`, `{ }` вокруг `try` — всё это **отдельные scope** для `let`/`const`. Это снижает «утечку» временных переменных наружу и делает рефакторинг безопаснее.

### Циклы и асинхронность: главное отличие `var` от `let`

```javascript
// Плохо: var — одна переменная i на весь цикл
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var", i), 0);
}
// var 3, var 3, var 3

// Хорошо: let — новая binding на каждой итерации
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log("let", j), 0);
}
// let 0, let 1, let 2
```

Почему так: к моменту выполнения колбэка `setTimeout` цикл с `var` уже завершился, `i === 3`. С `let` каждый колбэк «замыкает» **своё** значение `j`. Closures разберём в [12-closures.md](12-closures.md); здесь важно **scope** как причина.

## Почему `var` ещё встречается в легаси

**Function scope** — `var` видна во всей функции, даже если объявлена внутри `if`:

```javascript
function processOrder() {
  if (true) {
    var status = "pending";
  }
  console.log(status); // "pending" — var «протекла» из if
}
```

**Hoisting** — объявление `var` «поднимается» в начало функции, инициализация остаётся на месте:

```javascript
console.log(a); // undefined — не ReferenceError!
var a = 5;
// Движок conceptually: var a; console.log(a); a = 5;
```

С `let`/`const`:

```javascript
console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 5;
```

Зона от начала блока до строки `let b` — **Temporal Dead Zone**: имя уже в scope, но обращаться нельзя. Это **намеренно** ловит баги «использовал до объявления».

```javascript
let c = 1;
{
  // console.log(c); // OK, внешняя c
  let c = 2;        // другая c в inner block
  console.log(c); // 2
}
console.log(c);   // 1
```

## Имена, стиль и зарезервированные слова

```javascript
const userName = "ann";           // camelCase для переменных и функций
const MAX_RETRIES = 3;            // UPPER_SNAKE для true constants-config
const defaultPort = 8090;         // или const DEFAULT_PORT — команда решает

function calculateTotal(items) {  // глагол + существительное
  return items.reduce((s, i) => s + i.price, 0);
}
```

Зарезервированные слова нельзя как идентификаторы: `class`, `return`, `await` (в modules на top level). Полный список — MDN «Lexical grammar».

Допустимы `$`, `_`, буквы Unicode; в командных проектах mock-exams обычно **ASCII** для совместимости с CI и grep.

## `"use strict"` — строгий режим ES5

Директива в **начале файла** или **тела функции**:

```javascript
"use strict";

function leak() {
  mistyped = 1; // ReferenceError в strict — нет случайных globals
}
```

В **ES modules** (`"type": "module"` в [examples/package.json](examples/package.json)) и в **телах классов** strict включён **автоматически**. Писать `"use strict"` в каждом файле лаб не обязательно.

| Без strict (sloppy) | Со strict |
|---------------------|-----------|
| `mistyped = 1` создаёт global | ReferenceError |
| дублирующие имена параметров `function f(a,a)` | SyntaxError |
| `delete` несвойственных имён | ошибка или no-op в strict |
| `this` в обычной функции без контекста | `undefined` (не `globalThis` в browser как window) |

Strict не делает JS «строго типизированным» — только **строже** к части footguns. Статика — TypeScript позже.

## `globalThis`

Единая ссылка на глобальный объект:

```javascript
console.log(globalThis === global);  // true в Node
// в браузере: globalThis === window (или self в worker)
```

**Не засоряйте global** `globalThis.myHelper = …` — конфликты в больших приложениях. В modules экспортируйте явно ([30-es-modules.md](30-es-modules.md)).

## Литералы и базовые операторы (мост к урокам 04–05)

```javascript
const count = 42;                    // number
const price = 79.99;
const title = "Keyboard";            // string
const greeting = `Item: ${title}`;   // template literal
const inStock = true;                // boolean
const missing = null;                // намеренное «нет значения»
let notSet;                          // undefined

// Операторы — детали в 05-coercion-comparison.md
5 + 3;      // 8
"5" + 3;    // "53" — слабая типизация
5 === "5";  // false — используйте ===
5 == "5";   // true — избегайте в новом коде
```

## Комментарии и документирование

```javascript
// Однострочный — почему, не что (если код не self-explanatory)

/*
  Многострочный — редко; для временного отключения блока
*/

/**
 * Парсит query-параметр page в число.
 * @param {string} raw — из URL
 * @returns {number|null}
 */
function parsePage(raw) {
  // ...
}
```

JSDoc пригодится до TypeScript и для подсказок в IDE.

## Как это связано с курсом

| Урок | Связь |
|------|-------|
| [03. Лаба: первые скрипты](03-lab-first-scripts.md) | `let` vs `var` в цикле, шаблонные строки |
| [04. Примитивы](04-primitives.md) | `typeof`, `null`, `undefined` |
| [05. Coercion](05-coercion-comparison.md) | `===`, `"5" + 3` |
| [11. Scope и hoisting](11-scope-hoisting.md) | TDZ, вложенные scope, closures |
| [12. Closures](12-closures.md) | `for (let i)` + setTimeout |
| [14. this](14-this.md) | strict меняет `this` в plain call |
| [30. ES modules](30-es-modules.md) | implicit strict, `import` |

## Типичные ошибки

**`const` для значения, которое переприсваиваете.** Счётчик попыток login — `let retries = 0`, не `const` с последующим `retries = 1`.

**Думать, что `const obj` запрещает `obj.field = x`.** Запрещено только `obj = otherObject`. Для immutability — новый объект, `structuredClone`, или библиотеки.

**`var` в циклах с `setTimeout` / Promises.** Классический баг «все колбэки видят последнее i». Замена на `let` или IIFE в легаси.

**Обращение к `let`/`const` до строки объявления.** Copy-paste блока кода вверх файла — TDZ ReferenceError. С `var` был бы тихий `undefined`.

**Shadowing внешней переменной без намерения.** `let data` внутри `if` и снаружи — разные; легко перепутать при отладке fetch response.

**Случайные globals в sloppy script.** Без strict и modules `typo = 1` создаёт property на global — трудноуловимые баги. Modules + strict решают.

## Резюме

Современный JS: **`const` по умолчанию**, **`let` при переприсвоении**, **`var` — не писать**. `let`/`const` живут в **блоках** и попадают в **TDZ** до объявления — это лучше, чем hoisting `var` с `undefined`. `const` фиксирует **имя**, не deep freeze объекта. ES modules уже в **strict mode**. Эти правила — база для типов, функций и async к shop API.

## Чек-лист

- [ ] Когда `const`, когда `let`? Приведите пример каждого из shop-домена
- [ ] Чем `let` отличается от `var` в `for` + `setTimeout`?
- [ ] Что такое TDZ и что выведет `console.log(x); let x = 1`?
- [ ] Почему `const arr = []; arr.push(1)` легально?
- [ ] Нужно ли `"use strict"` в файлах `examples/lab/*.js`?
- [ ] Что такое `globalThis` и зачем не плодить globals?

Следующий урок: [03. Лаба: первые скрипты](03-lab-first-scripts.md).
