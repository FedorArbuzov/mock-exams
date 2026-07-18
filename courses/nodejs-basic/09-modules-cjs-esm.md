# 09. CommonJS и ESM в Node.js

## Сценарий с работы

Вы клонировали внутренний npm-пакет «shop-utils» и добавили в BFF строку `const { formatPrice } = require("./format.js")`. CI на Node 22 падает: `ReferenceError: require is not defined`. В `package.json` стоит `"type": "module"`, а половина репозитория — legacy `.cjs` из 2019 года. Коллега советует «просто добавить `"type": "commonjs"`», но тогда ломаются лабы с `import`. На code review спрашивают: «где `__dirname` в ESM?» и «зачем писать `node:fs` вместо `fs`?»

В Node.js **два** официальных формата модулей: **CommonJS (CJS)** — исторический стандарт с `require`/`module.exports`, и **ES modules (ESM)** — `import`/`export`, как в браузере и в [`javascript-basic`](../javascript-basic/30-es-modules.md). Курс mock-exams использует ESM; CJS нужно понимать для чтения чужого кода и npm-зависимостей.

## Что вы узнаете

- Когда Node выбирает CJS или ESM для файла
- Поле `"type"` в `package.json` и расширения `.mjs` / `.cjs`
- Как импортировать встроенные модули с префиксом `node:`
- Как получить `__dirname` и `__filename` в ESM через `import.meta.url`
- Interop: импорт CJS из ESM и наоборот
- Типичные ошибки при смешивании стилей

---

## Два мира: CJS и ESM

| | CommonJS | ES modules |
|---|----------|------------|
| Синтаксис | `require()`, `module.exports` | `import`, `export` |
| Загрузка | синхронная (исторически) | асинхронная по спецификации |
| `__dirname`, `__filename` | есть глобально | нет — нужен `import.meta.url` |
| Top-level await | нет | да (в `.js` с `"type": "module"`) |
| Расширение по умолчанию | `.js` при `"type": "commonjs"` | `.js` при `"type": "module"` |

**CommonJS — пример:**

```javascript
// utils.cjs
function joinPath(...parts) {
  return parts.filter(Boolean).join("/");
}

module.exports = { joinPath };
module.exports.defaultVersion = "1.0";
```

```javascript
// main.cjs
const { joinPath } = require("./utils.cjs");
console.log(joinPath("data", "catalog.json"));
```

**ESM — пример:**

```javascript
// utils.js (в пакете с "type": "module")
export function joinPath(...parts) {
  return parts.filter(Boolean).join("/");
}

export const VERSION = "1.0";
```

```javascript
// main.js
import { joinPath, VERSION } from "./utils.js";
console.log(joinPath("data", "catalog.json"), VERSION);
```

---

## `package.json` и поле `"type"`

Node определяет формат **по ближайшему** `package.json` в дереве каталогов:

```json
{
  "name": "shop-bff-examples",
  "type": "module",
  "private": true
}
```

| Конфигурация | Файл `app.js` | Файл `legacy.cjs` | Файл `modern.mjs` |
|--------------|---------------|-------------------|-------------------|
| `"type": "module"` | ESM | CJS | ESM |
| `"type": "commonjs"` (default) | CJS | CJS | ESM |
| без поля | CJS | CJS | ESM |

**Правило курса:** в `courses/nodejs-basic/examples` — `"type": "module"`. Все новые `.js` — только `import`/`export`.

Переопределение для одного файла:

- `config.cjs` — всегда CommonJS, даже в ESM-пакете.
- `worker.mjs` — всегда ESM, даже в CJS-пакете.

---

## Префикс `node:` для встроенных модулей

Node поставляет **встроенные** модули: `fs`, `path`, `http`, `url`, `stream` и др. С Node 14+ рекомендуется явный префикс:

```javascript
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
```

| Импорт | Зачем `node:` |
|--------|---------------|
| `node:fs` | однозначно встроенный модуль, не npm-пакет `fs` |
| `node:fs/promises` | Promise-API поверх fs |
| `node:path` | кроссплатформенные пути |
| `node:url` | `fileURLToPath`, `URL` |

Без префикса `import fs from "fs"` **пока** работает, но линтеры (eslint-plugin-n) и документация Node требуют `node:`. В mock-exams — **всегда** с префиксом.

---

## `__dirname` в ESM

В CommonJS:

```javascript
const path = require("node:path");
const dataFile = path.join(__dirname, "data", "products.json");
```

В ESM глобальных `__dirname` и `__filename` **нет**. Стандартный паттерн:

```javascript
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataFile = join(__dirname, "data", "products.json");
```

`import.meta.url` — URL текущего модуля, например `file:///C:/Users/.../catalog.js`. `fileURLToPath` превращает его в путь ОС (важно на Windows с `%20` и дисками).

**Ошибка:** хардкод `"./data/products.json"` относительно **cwd** процесса, а не файла. После `cd lab` скрипт ищет не тот каталог. Всегда якорьтесь на `__dirname` или `import.meta.url`.

---

## Импорт npm-пакетов и CJS interop

ESM импортирует npm-пакет по имени:

```javascript
import express from "express";
import { z } from "zod";
```

Старый CJS-пакет с `module.exports = fn`:

```javascript
import legacy from "some-old-package";
// default import = module.exports
```

Named import из CJS иногда **не** работает — зависит от того, как пакет экспортирован. Тогда:

```javascript
import pkg from "some-old-package";
const { namedFn } = pkg;
```

**Dynamic import** — единственный способ `import()` в CJS-файле и для условной загрузки:

```javascript
async function loadPlugin(name) {
  const mod = await import(`./plugins/${name}.js`);
  return mod.default;
}
```

В ESM-пакете статический `import` должен быть в начале файла (или top-level await); dynamic — внутри функций.

---

## Смешивание CJS и ESM в одном проекте

Типичная миграция:

```text
project/
├── package.json          # "type": "module"
├── src/
│   ├── server.js         # ESM — новый код
│   └── legacy/
│       └── parser.cjs    # CJS — не трогаем пока
└── scripts/
    └── migrate-data.cjs  # одноразовый скрипт
```

Из ESM **нельзя** вызвать `require()` без `createRequire`:

```javascript
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const legacy = require("./legacy/parser.cjs");
```

Используйте редко — лучше переписать модуль на ESM или обернуть в async API.

---

## Связь с предыдущими уроками

| Урок | Связь |
|------|-------|
| [javascript-basic/30-es-modules](../javascript-basic/30-es-modules.md) | синтаксис `import`/`export`, `import.meta` |
| [08-async-io-patterns.md](08-async-io-patterns.md) | `import` из `node:fs/promises` |
| [10-fs-path.md](10-fs-path.md) | `__dirname` + `path.join` для JSON каталога |

---

## Типичные ошибки

| Симптом | Причина | Решение |
|---------|---------|---------|
| `require is not defined` | ESM-файл с `require` | `import` или `.cjs` |
| `ERR_MODULE_NOT_FOUND` | путь без `.js` в ESM | `./utils.js`, не `./utils` |
| `Cannot use import outside a module` | `import` в CJS `.js` | `"type": "module"` или `.mjs` |
| Неверный путь к JSON | cwd вместо `__dirname` | `fileURLToPath(import.meta.url)` |
| `Named export not found` | CJS-пакет без named exports | default import + деструктуризация |

---

## Резюме

- Node поддерживает **CJS** и **ESM**; формат задаёт `"type"` в `package.json` и расширение `.cjs`/`.mjs`.
- Курс mock-exams: **`"type": "module"`**, импорты с префиксом **`node:`**.
- В ESM **`__dirname`** восстанавливают через `import.meta.url` и `fileURLToPath`.
- Не смешивайте `require` и `import` в одном `.js` без понимания interop.

## Чек-лист

- Чем **CJS** отличается от **ESM** по синтаксису и загрузке?
- Что делает `"type": "module"` в `package.json`?
- Зачем писать `import ... from "node:fs/promises"`?
- Как получить `__dirname` в ESM-файле?
- Почему `import "./utils"` без `.js` падает в Node ESM?
- Когда нужен `createRequire`?

Следующий урок: [10. `fs` и `path`](10-fs-path.md).
