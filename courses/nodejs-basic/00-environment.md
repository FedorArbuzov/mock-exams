# 00. Окружение: npm, структура Node-проекта

## Введение: сценарий с работы

Понедельник, онбординг. Tech lead показывает репозиторий: «BFF лежит в `courses/nodejs-basic/examples`, поднимается через `npm run dev`, проксирует shop API на FastAPI `:8090`». Вы клонируете mock-exams, переходите в каталог и пишете `node src/index.js` — получаете `Error: Cannot find module 'express'`. Коллега из Python-трека спрашивает: «Почему не `pip install`?» DevOps в CI ругается: «Шаг `npm ci` падает — нет `package-lock.json`». Третий разработчик запускает лабу из корня репозитория и видит `ENOENT: no such file or directory` — потому что относительный путь `lab/01-argv.js` ищется не там.

На курсе [`javascript-basic`](../javascript-basic/00-environment.md) вы уже ставили Node LTS и запускали одиночные `.js` файлы из `javascript-basic/examples/` **без npm-пакетов**. **nodejs-basic** — следующий шаг: полноценный **Node-проект** с `package.json`, зависимостями, npm-скриптами и каталогом `examples/`, который со временем превратится в Express BFF. Без этого фундамента лабы по event loop, HTTP и прокси к [`deploy/fastapi`](../../deploy/fastapi/README.md) превращаются в хаос «пакет не найден» и «работает только у меня».

## Что вы узнаете

- Чем **nodejs-basic/examples** отличается от **javascript-basic/examples** (зависимости, скрипты, BFF).
- Как устроены **`package.json`**, **`package-lock.json`** и зачем нужен `npm install` / `npm ci`.
- Как читать и писать **npm scripts** (`dev`, `start`, `lab:*`).
- Почему фиксируют **Node.js LTS** и поле `"engines"`.
- Структура каталогов курса: `lab/`, `src/`, `solutions/`.
- Минимальный рабочий цикл: `cd examples` → `npm install` → `node lab/…` или `npm run dev`.

---

## От javascript-basic к nodejs-basic

| Аспект | javascript-basic | nodejs-basic |
|--------|------------------|--------------|
| Зависимости | только встроенные модули Node | Express, pino, dotenv и др. |
| Запуск | `node lab/file.js` | то же + `npm run dev` для сервера |
| Цель | язык JS, async, fetch | runtime Node, BFF, HTTP, libuv |
| API shop | опционально в конце курса | FastAPI `:8090` с главы 20 |
| Структура | `examples/lab/` | `examples/lab/` + `examples/src/` |

Вы **не повторяете** синтаксис `let`/`const`, Promises и `async/await` — это [`javascript-basic`](../javascript-basic/README.md). Здесь предполагается, что вы уже прошли уроки 24–30 (event loop обзорно, Promises, modules). Если нет — параллельно дочитайте [24-event-loop.md](../javascript-basic/24-event-loop.md) и [30-es-modules.md](../javascript-basic/30-es-modules.md).

---

## Node.js LTS и версия для курса

**LTS** (Long Term Support) — ветка Node с длительной поддержкой патчей безопасности. На момент курса целевые версии: **20.x** или **22.x**. Минимум — **Node 18+** (нативный `fetch`, стабильные ES modules).

```bash
node --version    # v22.x.x или v20.x.x
npm --version     # 10.x — идёт в комплекте с Node
```

Зафиксируйте версию в проекте — так CI и коллеги не расходятся с вами:

```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

Файл `.nvmrc` с одной строкой `20` или `22` — привычка из [`gitlab-basic`](../gitlab-basic/README.md): pipeline читает ту же версию, что и локальная машина.

---

## npm: менеджер пакетов Node

**npm** (Node Package Manager) ставит библиотеки из [registry.npmjs.org](https://www.npmjs.org/) в локальный каталог `node_modules/`. Аналог **`pip`** в Python-треке mock-exams или **`poetry add`** — но экосистема npm исторически «плоская»: тысячи мелких пакетов, lockfile обязателен.

| Команда | Назначение |
|---------|------------|
| `npm install` | установить зависимости из `package.json`; обновить lock при необходимости |
| `npm ci` | «чистая» установка строго по `package-lock.json` — стандарт CI |
| `npm install express` | добавить зависимость и записать в `package.json` |
| `npm run dev` | запустить скрипт из поля `"scripts"` |
| `npx eslint .` | разовой запуск CLI без глобальной установки |

**Не коммитьте** `node_modules/` — он огромен и воспроизводится из lockfile. В `.gitignore` репозитория mock-exams он уже исключён.

### package.json и package-lock.json

`package.json` — манифест проекта: имя, версия, зависимости, скрипты:

```json
{
  "name": "nodejs-basic-examples",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "lab:argv": "node lab/01-argv.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "dotenv": "^16.4.0",
    "pino": "^9.0.0"
  }
}
```

- **`"type": "module"`** — ES modules (`import`/`export`), как в javascript-basic.
- **`dependencies`** — нужны в runtime (Express для BFF).
- **`devDependencies`** — только для разработки (nodemon, eslint) — появятся позже в [`javascript-testing`](../javascript-path.md).
- **`^4.21.0`** — semver: npm может ставить патчи и минорные версии в пределах major.

`package-lock.json` фиксирует **точные** версии всего дерева зависимостей. Без него «у меня работает» на Node 22 с express 4.21.1, а в CI — express 4.19.0 и другой баг.

---

## Первый запуск examples/

```bash
cd courses/nodejs-basic/examples
npm install
node --version
npm run lab:argv    # если скрипт добавлен; иначе node lab/01-argv.js позже
```

После `npm install` появится `node_modules/` — там лежит Express и транзитивные зависимости. Импорт в коде:

```javascript
import express from "express";
// Node ищет "express" в node_modules/express
```

Встроенные модули подключают с префиксом **`node:`** (рекомендация с Node 16+):

```javascript
import { readFile } from "node:fs/promises";
import { argv, env } from "node:process";
```

---

## Структура каталога nodejs-basic

```text
courses/nodejs-basic/
├── README.md
├── 00-environment.md … 39-capstone.md
├── interview-cheatsheet.md
└── examples/
    ├── package.json
    ├── package-lock.json
    ├── .env.example          # шаблон — копируете в .env локально
    ├── lab/                  # лабы фаз 1–2: CLI, event loop, fs
    ├── src/                  # Express BFF — с лаб 23+
    │   └── index.js
    └── solutions/            # эталоны — после своей попытки
```

**Правило курса:** команды `node lab/…` и `npm run …` выполняйте из **`examples/`**, не из корня `mock-exams`. Относительные пути в лабах (`./data/config.json`, `../.env`) привязаны к текущей рабочей директории shell — та же ловушка, что в [javascript-basic/00-environment.md](../javascript-basic/00-environment.md).

---

## npm scripts: зачем не только `node file.js`

Скрипты — **контракт** для команды и CI:

```json
"scripts": {
  "dev": "nodemon src/index.js",
  "start": "node src/index.js"
}
```

| Преимущество | Пример |
|--------------|--------|
| Единая команда для всех | `npm run dev` вместо «запомни флаги» |
| Переменные окружения | `"dev": "NODE_ENV=development node src/index.js"` (на Windows — cross-env) |
| Цепочки | `"test": "vitest run && node lab/smoke.js"` |
| CI | `npm ci && npm run start` |

Флаг **`--watch`** (Node 20+) перезапускает процесс при изменении файлов — альтернатива nodemon на первых лабах. В `examples/package.json` курса используется **nodemon** для удобства.

---

## Связь со стендом FastAPI :8090

Пока Express-сервер в `src/` — заготовка; полноценный прокси к shop API появится в главах 20 и 34. Стенд [`deploy/fastapi`](../../deploy/fastapi/README.md) на порту **8090** поднимают отдельно (Docker или локально):

```bash
# из deploy/fastapi — см. README стенда
curl http://localhost:8090/health
```

nodejs-basic учит **Node-слой** между React (`react-basic`, порт ~5173) и Python API. Контракты REST — [`api-design`](../api-design/README.md). TypeScript-типы для клиента — позже [`typescript-basic`](../typescript-basic/README.md).

---

## Отличие от «просто Node на хосте»

javascript-basic намеренно **без** Docker и без лишних пакетов — один V8, один терминал. nodejs-basic добавляет:

1. **Зависимости** — HTTP-фреймворк, логгер, dotenv.
2. **Долгоживущий процесс** — сервер слушает порт, обрабатывает сигналы ([02-process.md](02-process.md)).
3. **Event loop в глубину** — libuv, не только браузерная модель ([04-event-loop-libuv.md](04-event-loop-libuv.md)).
4. **Интеграция** с Python backend — BFF-паттерн ([32-bff-pattern.md](32-bff-pattern.md)).

---

## Типичные ошибки

**`npm install` забыли после clone.** Симптом: `Cannot find module 'express'`. Решение: `cd examples && npm install`.

**Запуск не из `examples/`.** Симптом: `ENOENT` для `lab/01-argv.js`. Решение: `cd courses/nodejs-basic/examples` перед `node`.

**Коммит `node_modules`.** Раздувает репозиторий; review невозможен. Только `package.json` + lockfile.

**Node 16 в CI при `"engines": ">=20"`.** Падает на `fetch`, `--watch`, новых API. Обновите образ в pipeline.

**Смешение CommonJS и ESM.** `require()` в проекте с `"type": "module"` — ошибка. Курс на **`import`/`export`** ([09-modules-cjs-esm.md](09-modules-cjs-esm.md)).

**Секреты в `package.json`.** API keys не в scripts и не в репозитории — только `.env` локально, `.env.example` в git ([28-env-config.md](28-env-config.md)).

---

## Резюме

Окружение nodejs-basic — **Node LTS**, каталог **`examples/`**, **`npm install`**, **`package.json`** с `"type": "module"` и npm scripts. Lockfile фиксирует версии для CI. Структура `lab/` + `src/` готовит к BFF на Express и прокси к FastAPI `:8090`. От javascript-basic вы переносите привычку запускать `.js` из правильной директории; добавляете npm-экосистему и серверный runtime.

## Чек-лист

- [ ] `node --version` — **20.x или 22.x**
- [ ] Выполнены `cd courses/nodejs-basic/examples` и `npm install` без ошибок
- [ ] Понимаете разницу `npm install` и `npm ci`
- [ ] Видите `node_modules/` и не планируете коммитить его
- [ ] Знаете, где `lab/`, `src/`, `solutions/`
- [ ] Можете объяснить, чем nodejs-basic/examples шире javascript-basic/examples
- [ ] Знаете порт FastAPI стенда mock-exams (**8090**)

Следующий урок: [01. Ландшафт Node.js и BFF](01-landscape.md).
