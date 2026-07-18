# 30. ES modules: import / export

## Сценарий с работы

Файл `utils.js` вырос до **2400 строк**: форматирование цен, корзина, парсинг конфига, HTTP-хелперы. Code review: «разбейте на модули, иначе MR не мёржим». Коллега добавляет `require()` в файл с `"type": "module"` — CI падает с `ReferenceError: require is not defined`. На собеседовании: «чем named export от default?» и «что будет при циклическом import?»

ES modules (ESM) — **официальный** способ разбить программу на файлы с явными зависимостями. В Node с `"type": "module"` и в браузере с `<script type="module">` это стандарт курса и всех следующих треков (Node, React, TypeScript).

## Зачем модули, а не один файл

| Проблема монолита | Решение модулями |
|-------------------|------------------|
| Непонятно, кто от кого зависит | `import` / `export` — граф зависимостей виден |
| Случайные глобальные переменные | Каждый файл — своё scope |
| Сложно тестировать кусок логики | Импортируете только нужную функцию |
| Конфликты имён | Имена изолированы, конфликт решается alias |

Модули также включают **strict mode** автоматически — тот же режим, что вы видели в [02-variables-strict.md](02-variables-strict.md).

## Минимальный пример

`math.js` — только экспорт:

```javascript
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export const PI = 3.141592653589793;
```

`main.js` — импорт и использование:

```javascript
import { add, PI } from "./math.js";

console.log(add(2, 3)); // 5
console.log(PI);
```

Запуск из каталога `examples/`:

```bash
node main.js
```

**Важно для Node:** путь `./math.js` с **расширением `.js`**. Без расширения Node ESM выдаст `ERR_MODULE_NOT_FOUND`. В bundler (Vite, webpack) расширение часто опускают, но привычка писать `.js` спасает в чистом Node.

## Именованный экспорт (named export)

Несколько сущностей из одного файла — каждая со **своим именем**:

```javascript
// validators.js
export function isEmail(value) {
  return typeof value === "string" && value.includes("@");
}

export function isPositiveNumber(n) {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

const internalRegex = /^[^@]+@[^@]+$/; // не export — приватно для файла

export function isStrictEmail(value) {
  return isEmail(value) && internalRegex.test(value);
}
```

Импорт:

```javascript
import { isEmail, isPositiveNumber } from "./validators.js";

// alias при конфликте имён
import { isEmail as checkEmail } from "./validators.js";

// всё в namespace-объект
import * as validators from "./validators.js";
validators.isEmail("a@b.com");
```

| Синтаксис | Когда использовать |
|-----------|-------------------|
| `import { x } from "./m.js"` | Одна-две сущности, имя совпадает |
| `import { x as y }` | Конфликт имён или читаемость |
| `import * as ns` | Много экспортов, редкие вызовы |

**Правило рефакторинга:** именованные экспорты проще искать по IDE (`Find references`) и переименовывать, чем default.

## Default export

Один «главный» экспорт на файл:

```javascript
// app.js
export default class App {
  constructor(name) {
    this.name = name;
  }

  run() {
    console.log(`App ${this.name} started`);
  }
}
```

Импорт — **без фигурных скобок**, имя произвольное:

```javascript
import App from "./app.js";
import MyApplication from "./app.js"; // то же самое, другое локальное имя

const app = new App("shop");
app.run();
```

Комбинация default + named (допустимо, но в командах часто избегают):

```javascript
export default function createLogger() {
  return { log: console.log };
}

export const LOG_LEVEL = "info";
```

```javascript
import createLogger, { LOG_LEVEL } from "./logger.js";
```

| Named | Default |
|-------|---------|
| Много на файл | Один на файл |
| Имя фиксировано при export | Имя при import любое |
| Удобен для утилит | Удобен для «одного класса/функции на файл» |

## Re-export — публичный API пакета

Паттерн **barrel** — файл `index.js`, который собирает наружный API:

```javascript
// shop/index.js
export { Cart, CartItem } from "./cart.js";
export { loadProducts, filterByCategory } from "./catalog.js";
export { formatPrice } from "./format.js";

// внутренние хелперы из ./internal.js НЕ re-export
```

Потребитель:

```javascript
import { Cart, formatPrice } from "./shop/index.js";
```

**Осторожно:** re-export всего подряд (`export * from "./a.js"`) может случайно выставить наружу внутренние функции и **усилить циклические зависимости**. Экспортируйте только то, что нужно клиенту.

## Статический vs динамический import

**Статический** — в начале файла, анализируется до запуска:

```javascript
import { add } from "./math.js";
```

**Динамический** — `import()` как функция, возвращает Promise:

```javascript
async function loadLocale(lang) {
  const module = await import(`./locales/${lang}.js`);
  return module.default;
}

// условная загрузка
if (process.env.DEBUG) {
  const { debugTools } = await import("./debug.js");
  debugTools.enable();
}
```

Применения:

- lazy load тяжёлого модуля;
- code splitting в bundler;
- загрузка плагина по конфигу.

В Node динамический import работает и в CommonJS-файлах (legacy), статический `import` — только в ESM.

## `import.meta`

Метаинформация о **текущем** модуле:

```javascript
console.log(import.meta.url);
// file:///C:/Users/.../examples/lab/shop/index.js
```

В Node часто нужно для путей относительно файла:

```javascript
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataPath = join(__dirname, "data", "products.json");
const raw = await readFile(dataPath, "utf8");
const products = JSON.parse(raw);
```

В браузере `import.meta.url` — URL модуля; bundler подставляет свои значения.

## Top-level await

В ES modules можно `await` **на верхнем уровне** файла (не внутри функции):

```javascript
// config.js
const response = await fetch("https://example.com/config.json");
const config = await response.json();

export default config;
```

```javascript
// main.js
import config from "./config.js"; // main ждёт, пока config.js загрузится
console.log(config);
```

Ограничение: файл с top-level await **блокирует** цепочку импортов, пока Promise не завершится. Для тяжёлой инициализации иногда лучше явная async-функция `init()`.

## `package.json` и режим ESM в Node

В `examples/package.json`:

```json
{
  "type": "module"
}
```

Все `.js` в пакете трактуются как ESM. Альтернативы:

| Способ | Файлы |
|--------|-------|
| `"type": "module"` | `.js` = ESM, `.cjs` = CommonJS |
| `"type": "commonjs"` (default) | `.js` = CJS, `.mjs` = ESM |
| Без поля | как commonjs |

Курс использует `"type": "module"` — `import`/`export` без флагов.

## CommonJS vs ESM

Легаси Node:

```javascript
// math.cjs
function add(a, b) {
  return a + b;
}
module.exports = { add };
```

```javascript
// main.cjs
const { add } = require("./math.cjs");
```

| | CommonJS | ESM |
|---|----------|-----|
| Синтаксис | `require`, `module.exports` | `import`, `export` |
| Загрузка | синхронная | асинхронная (спецификация) |
| `this` на верхнем уровне | `module.exports` | `undefined` |
| Tree-shaking в bundler | хуже | лучше |
| Top-level await | нет | да (в modules) |

**Не смешивайте** в одном `.js` файле `require` и `import` без понимания interop. В новом коде mock-exams — только ESM.

Импорт CommonJS из ESM в Node:

```javascript
import pkg from "legacy-package"; // default = module.exports
```

## Циклические импорты

```text
a.js  ──imports──►  b.js
  ▲                    │
  └──────imports───────┘
```

`a.js`:

```javascript
import { bFn } from "./b.js";
export function aFn() {
  return "a" + bFn();
}
```

`b.js`:

```javascript
import { aFn } from "./a.js";
export function bFn() {
  return "b";
}
export function useA() {
  return aFn(); // может сработать, если вызов ПОСЛЕ инициализации
}
```

На этапе загрузки экспорты из «ещё не до конца выполненного» модуля могут быть **`undefined`**. Лечение:

1. Вынести общее в **третий** модуль `shared.js`.
2. Не вызывать функции соседа на **верхнем уровне** при import.
3. Передавать зависимости аргументом (dependency injection), а не import.

Запах: два файла импортируют друг друга — почти всегда повод рефакторить.

## Модули в браузере

```html
<script type="module" src="./main.js"></script>
```

Отличия от обычного `<script>`:

- defer по умолчанию;
- strict mode;
- CORS: файл с другого origin без заголовков — ошибка;
- относительные пути `./utils.js` обязательны.

```html
<!-- не сработает как module -->
<script src="./utils.js"></script>
<script>
  import { x } from "./utils.js"; // SyntaxError в inline без type=module
</script>
```

Для `fetch` к API — [29-fetch.md](29-fetch.md); CORS — [`api-design`](../api-design/README.md).

## JSON и статический import

Node (17+) и современные bundler:

```javascript
import products from "./data/products.json" with { type: "json" };
// или legacy синтаксис: assert { type: "json" }
```

Альтернатива без import attributes — `readFile` + `JSON.parse` (см. лабу [31-lab-modules.md](31-lab-modules.md)).

## Связь с предыдущими уроками

| Урок | Связь |
|------|-------|
| [12-closures.md](12-closures.md) | IIFE-модули до ESM |
| [22-lab-oop.md](22-lab-oop.md) | `Cart`, `CartItem` — разнесёте по файлам |
| [27-async-await.md](27-async-await.md) | top-level await, dynamic import |
| [29-fetch.md](29-fetch.md) | `api.js` как отдельный модуль |

## Типичные ошибки

- **Забыли `.js` в пути** — `ERR_MODULE_NOT_FOUND` в Node.
- **`require` в ESM-файле** — `ReferenceError: require is not defined`.
- **Default + named путаница** — `import { App }` вместо `import App` для default.
- **Циклический import + вызов на top-level** — `TypeError: fn is not a function`.
- **Barrel, экспортирующий всё** — медленная сборка, скрытые циклы.
- **Мutation экспортированного объекта** — `export const state = {}` можно менять снаружи; для константности экспортируйте функции или freeze.

## Чек-лист

- Чем **named export** отличается от **default**?
- Зачем писать `./math.js` с расширением в Node ESM?
- Что вернёт `import.meta.url` и как получить `__dirname`?
- Что такое **динамический** `import()` и когда он нужен?
- Почему циклические import опасны на этапе инициализации?
- Какое поле `package.json` включает ESM для всех `.js`?

Следующий урок: [31. Лаба: модули](31-lab-modules.md).
