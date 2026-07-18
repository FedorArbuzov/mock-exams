# 00. Окружение: Node.js, REPL, редактор

## Введение: сценарий с работы

Пятница, 17:42. В Slack приходит сообщение от DevOps: «CI падает на шаге `node scripts/migrate-users.js` — у вас локально работает?» Вы открываете ноутбук, запускаете тот же файл — и получаете `SyntaxError: Cannot use import statement outside a module`. На вашей машине Node 22, в пайплайне — Node 16. Коллега из другой команды присылает скриншот: «у меня вообще `node: command not found`». Третий разработчик клянётся, что «скрипт ничего не печатает», хотя вы видите вывод в терминале — оказывается, он запускает файл двойным кликом в проводнике Windows, окно мгновенно закрывается.

Три разных симптома — одна корневая причина: **окружение не настроено и не зафиксировано**. На курсе [`linux-basic`](../linux-basic/README.md) вы учились проверять `whoami`, версию ОС и пути к бинарникам. Для JavaScript аналог — `node --version`, каталог запуска, `"type": "module"` в `package.json`. Без этого фундамента каждый следующий урок (типы, замыкания, `fetch` к FastAPI на `:8090`) превращается в угадайку «почему у меня не так».

В mock-exams backend-трек живёт в Docker (`deploy/fastapi`, порт **8090**), а **javascript-basic** намеренно стартует **на хосте**: один файл, один терминал, никаких контейнеров. Так же вы будете писать утилиты миграции, pre-commit хуки и одноразовые скрипты в CI — до того как дойдёте до [`nodejs-basic`](../javascript-path.md) и полноценного BFF.

## Что вы узнаете

- Почему для обучения JavaScript удобнее **Node.js**, а не браузер с HTML на первых неделях.
- Как установить **Node.js LTS**, проверить версию и не попасть в ловушку «старый Node в CI».
- Цикл разработки: **файл → `node script.js` → читать вывод → править**.
- Что такое **REPL** и когда он полезен, а когда — вреден.
- Структура каталога **`examples/`**, `"type": "module"` и отличия **Node vs браузер**.
- Минимальная настройка **редактора** (ESLint, Prettier) без перегруза.

## Зачем Node на курсе «базового JavaScript»

JavaScript родился в **браузере** — там он управляет DOM, реагирует на клики и ходит на API. Но **язык** и **среда выполнения** — разные вещи. **Node.js** — это среда на движке **V8** (тот же, что в Chrome), которая выполняет JavaScript **вне браузера**: в терминале, в CI, на сервере.

Для обучения Node даёт три практических преимущества:

1. **Минимальный цикл обратной связи.** Создали `hello.js`, написали `node hello.js` — увидели результат. Не нужны HTML, bundler, dev-server и разбор CORS, пока вы ещё не знаете, что такое `const`.
2. **Тот же синтаксис переносится дальше.** Код из урока 02 (`let`, `const`) и урока 29 (`fetch`) одинаково понятен и в браузере, и в Node 18+ (где `fetch` встроен).
3. **Связь с экосистемой mock-exams.** Позже [`nodejs-basic`](../javascript-path.md) поднимет BFF, который проксирует запросы на FastAPI `:8090`; [`react-basic`](../javascript-path.md) нарисует UI к тому же shop-домену. Сейчас вы закладываете привычку запускать `.js` файлы так же уверенно, как в [`linux-basic`](../linux-basic/README.md) запускаете `bash script.sh`.

Браузер и **DevTools** вернутся в уроках про отладку ([36-debugging.md](36-debugging.md)) и HTTP ([29-fetch.md](29-fetch.md)). Пока — терминал и редактор.

## Установка Node.js LTS

**LTS** (Long Term Support) — ветка с предсказуемыми обновлениями безопасности. На момент написания курса рекомендуется **20.x** или **22.x**. Минимум для курса — **Node 18+** (нативный `fetch`, стабильные ES modules).

### Linux и macOS (nvm)

Менеджер версий **nvm** позволяет держать несколько версий Node и переключаться per-project — аналог `pyenv` в Python-треке:

```bash
# Установка nvm — см. https://github.com/nvm-sh/nvm
nvm install --lts
nvm use --lts

node --version    # v22.x.x или v20.x.x
npm --version     # менеджер пакетов, идёт в комплекте
```

### Windows

Установщик с [nodejs.org](https://nodejs.org/) или **nvm-windows**. После установки **перезапустите терминал** — PATH обновляется только в новых сессиях.

### Проверка «как в CI»

Добавьте в корень своих pet-проектов файл `.nvmrc` или поле `"engines"` в `package.json`:

```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

Тогда «работает у меня» не разойдётся с пайплайном GitLab из [`gitlab-basic`](../gitlab-basic/README.md).

| Инструмент | Назначение | Когда понадобится |
|------------|------------|-------------------|
| `node` | Запуск `.js` файлов и REPL | каждый урок |
| `npm` | Установка пакетов | `nodejs-basic`, `react-basic` |
| `npx` | Разовый запуск CLI без глобальной установки | ESLint, Vitest |

## Первый запуск: файл и вывод

Создайте файл `hello.js` в любом каталоге:

```javascript
// hello.js — ваш первый исполняемый скрипт на курсе
console.log("Hello, JavaScript!");
console.log("Node version:", process.version);
console.log("Platform:", process.platform);
```

Запуск:

```bash
node hello.js
```

**Что увидите:**

```text
Hello, JavaScript!
Node version: v22.11.0
Platform: win32
```

`console.log` — главный «прибор» первых недель. Он пишет в **stdout** (стандартный вывод), тот же поток, куда попадает результат команд в shell. В production Node чаще используют структурированные логи (**pino**, **winston**) с уровнями `info`/`error` и JSON-форматом для ELK — это тема [`nodejs-basic`](../javascript-path.md) и [`observability-basic`](../observability-basic/README.md).

Объект **`process`** — мост между вашим скриптом и операционной системой: версия Node, платформа, переменные окружения (`process.env.PORT`), код выхода (`process.exit(1)`). Скрипты деплоя в mock-exams часто начинаются с проверки `process.version`, чтобы не мигрировать данные на Node 16.

### Типичная ошибка первого дня

```bash
node hello     # без расширения .js
```

В старых версиях Node искал модуль `hello` в `node_modules`. **Всегда** указывайте `hello.js` или полный путь. В CI пишут явно: `node scripts/hello.js`.

## REPL — интерактивная консоль

**REPL** (Read-Eval-Print Loop) — режим, где Node читает строку, вычисляет выражение и печатает результат:

```bash
node
```

```javascript
> 2 + 2
4
> typeof "hello"
'string'
> const x = [1, 2, 3]
undefined          // присваивание не возвращает значение в REPL
> x.map(n => n * 2)
[ 2, 4, 6 ]
> 0.1 + 0.2
0.30000000000000004
```

Выход: `.exit`, Ctrl+D (на Windows в PowerShell иногда Ctrl+D дважды или `.exit` надёжнее).

REPL идеален для **экспериментов** с типами, однострочниками и «что вернёт `typeof null`?». Для лабораторных работ — **отдельные файлы** в `examples/lab/`: их можно версионировать, запускать в CI и делиться с коллегой. Не копируйте 200 строк лабы из истории REPL — через неделю не воспроизведёте.

## Структура каталога курса

```text
courses/javascript-basic/
├── README.md
├── 00-environment.md … 39-capstone.md
├── interview-cheatsheet.md
└── examples/
    ├── package.json      # "type": "module"
    ├── lab/              # ваши решения лаб
    └── solutions/        # эталоны — только после своей попытки
```

Перейдите в каталог examples и убедитесь, что путь совпадает:

```bash
cd courses/javascript-basic/examples
node --version
ls lab/          # Linux/macOS
dir lab\         # Windows PowerShell
```

Если репозиторий клонирован в `C:\Users\you\mock-exams`, полный путь к лабам: `mock-exams/courses/javascript-basic/examples/lab/`. Запуск **всегда из `examples/`**, иначе относительные пути вроде `lab/data/products.json` (урок 09) не найдутся.

## Редактор и расширения

Подойдёт **VS Code**, **Cursor**, WebStorm, Neovim — anything with JS syntax highlighting. Для курса достаточно:

| Расширение / настройка | Зачем |
|------------------------|-------|
| ESLint | подсветка ошибок до запуска `node` |
| Prettier | единое форматирование в команде |
| Format on save | меньше diff-ов «пробелы vs табы» |

Не тратьте первую неделю на темы и шрифты. Тратьте на цикл **написал → запустил → прочитал ошибку**. `SyntaxError: Unexpected token` на строке 14 — это нормальный учебный материал, не повод переустанавливать IDE.

### Кодировка на Windows

Сохраняйте файлы в **UTF-8**. Если в комментариях кириллица, а в терминале «кракозябры» — проверьте кодировку терминала (`chcp 65001` в cmd) или используйте Windows Terminal. Путь с кириллицей иногда ломает старые инструменты — для учебных проектов лучше ASCII-пути.

## `package.json` и ES modules

В [`examples/package.json`](examples/package.json):

```json
{
  "name": "javascript-basic-labs",
  "type": "module",
  "private": true
}
```

Поле **`"type": "module"`** говорит Node: файлы с расширением `.js` — **ES modules**. Можно писать:

```javascript
import { readFileSync } from "node:fs";
export function helper() {}
```

Без этой настройки (или без расширения `.mjs`) `import` в `.js` файле вызовет ошибку, которую вы видели в сценарии из начала главы.

**Не смешивайте** в одном проекте `require()` (CommonJS) и `import` (ESM) без понимания границ — подробно в [30-es-modules.md](30-es-modules.md). Правило курса: только **`import` / `export`**.

Префикс **`node:`** в `node:fs` — явное указание встроенного модуля Node (рекомендация с Node 16+). Так отличить `node:fs` от npm-пакета с похожим именем.

## Node vs браузер: что общего и что нет

Один и тот же фрагмент:

```javascript
const sum = (a, b) => a + b;
console.log(sum(2, 3));
```

Работает и в Node, и в консоли DevTools браузера. Но **глобальные API** различаются:

| Возможность | Браузер | Node.js |
|-------------|---------|---------|
| `document`, DOM | да | нет |
| `window` | да | нет (`globalThis`) |
| `fetch` | да | да (Node 18+) |
| `fs`, `path`, `process` | нет | да (`node:fs`, …) |
| CORS | ограничивает запросы | не применяется |

На этом курсе **~90%** учебного кода переносится между средами без изменений. Отличия помечаем явно: «только Node» или «только браузер». Когда в [`react-basic`](../javascript-path.md) вы вызовете `fetch('http://localhost:8090/api/v1/items')`, CORS настроит backend ([`fastapi/23-middleware-cors`](../fastapi/23-middleware-cors.md)); в Node-скрипте CORS не мешает.

```javascript
// Работает в Node 18+ и в браузере
const url = "http://localhost:8090/health";
// const res = await fetch(url);  // await — позже, урок 27
```

## Как это связано с курсом

| Соседний материал | Связь |
|-------------------|-------|
| [01. Ландшафт](01-landscape.md) | ECMAScript, движки, где крутится ваш `node hello.js` |
| [03. Лаба: первые скрипты](03-lab-first-scripts.md) | закрепление цикла файл → node → вывод |
| [30. ES modules](30-es-modules.md) | углубление `"type": "module"`, `import` JSON |
| [`linux-basic` 02–03](../linux-basic/02-shell-redirection.md) | терминал, пути, перенаправление stdout |
| [`fastapi` deploy :8090](../../deploy/fastapi/README.md) | цель для `fetch` в конце курса |

## Типичные ошибки

**«Node не найден» после установки.** Терминал не перезапущен; Node не в PATH; установлен только через snap без classic mode. Проверка: `which node` (Linux/macOS) или `Get-Command node` (PowerShell).

**Скрипт «молчит» или окно мигает.** Запуск двойным кликом на Windows закрывает консоль после `console.log`. Запускайте из терминала или добавьте `readline` / `pause` только для отладки — в CI этого не будет.

**`import` без `"type": "module"`.** Либо добавьте поле в `package.json`, либо переименуйте файл в `.mjs`. Не добавляйте `"use strict"` в надежде «починить import» — это разные механизмы.

**Разные версии Node у команды.** Зафиксируйте LTS в README и CI; используйте `engines` или `.nvmrc`. Node 16 EOL — не целевая версия курса.

**Запуск не из того каталога.** `node lab/09-load.js` ищет `lab/data/products.json` относительно **текущей рабочей директории**, не относительно файла скрипта. `cd examples` перед запуском — обязательная привычка.

## Резюме

Окружение javascript-basic — **Node.js LTS на хосте**, терминал и редактор. Вы запускаете `.js` файлы командой `node path/to/file.js`, экспериментируете в REPL, работаете в каталоге `examples/` с ES modules. `console.log` и `process.version` — первые инструменты диагностики; позже к ним добавятся типы, модули и HTTP к shop-API на `:8090`. Потратьте час на стабильную установку — сэкономите дни на «у меня не воспроизводится».

## Чек-лист

- [ ] `node --version` показывает **20.x или 22.x** (минимум 18)
- [ ] `npm --version` отвечает без ошибки
- [ ] Файл `hello.js` с `console.log` запускается и печатает строку
- [ ] REPL: `typeof 42` → `'number'`
- [ ] Открыт каталог `courses/javascript-basic/examples/`, виден `package.json` с `"type": "module"`
- [ ] Понимаете, почему лабы запускают из `examples/`, а не из корня репозитория
- [ ] Можете объяснить коллеге разницу «Node не установлен» vs «Node 16 vs 22»

Следующий урок: [01. Ландшафт JavaScript](01-landscape.md).
