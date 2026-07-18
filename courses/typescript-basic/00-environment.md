# 00. Окружение: TypeScript, tsc, редактор

## Введение: сценарий с работы

Понедельник, 10:15. Вы закончили [`javascript-basic`](../javascript-basic/README.md) и открываете первый `.ts` файл в shop-BFF. CI падает: `error TS2307: Cannot find module './types'`. Локально в VS Code всё зелёное — оказывается, вы запускали **tsx** напрямую, а пайплайн вызывает **`tsc --noEmit`** и **`node dist/index.js`**. Коллега пишет: «У меня `tsc: command not found`» — TypeScript установлен глобально у одного и только в `devDependencies` у другого. Третий разработчик клянётся, что «типы не работают», хотя просто сохранил файл как `script.js` вместо `script.ts`.

Три симптома — одна причина: **окружение TypeScript не настроено и не зафиксировано**. На курсе [`javascript-basic/00-environment`](../javascript-basic/00-environment.md) вы учились проверять `node --version` и запускать скрипты из `examples/`. Здесь добавляется цепочка **`.ts` → компилятор → `.js` → `node`**, плюс редактор, который подсвечивает ошибки **до** запуска.

В mock-exams backend живёт в Docker ([`deploy/fastapi`](../../deploy/fastapi/README.md), порт **8090**), а **typescript-basic** — как javascript-basic — стартует **на хосте**: один терминал, каталог `examples/`, без контейнеров. Позже [`nodejs-basic`](../javascript-path.md) соберёт typed BFF к тому же shop API; сейчас вы закладываете привычку: **компилировать, читать ошибки TS, не игнорировать красное в IDE**.

## Что вы узнаете

- Зачем TypeScript нужен **поверх** JavaScript, который вы уже знаете.
- Установка **TypeScript** через `npm` (локально в проект, не только глобально).
- Команды **`tsc`**, **`tsx`** / **ts-node** — когда что использовать.
- Минимальный **`tsconfig.json`** для лаб курса.
- Структура **`examples/`** и цикл **написал → tsc → node**.
- Настройка **VS Code / Cursor** для TypeScript без перегруза.

## Предварительные требования

Курс **typescript-basic** идёт **сразу после** [`javascript-basic`](../javascript-basic/README.md). Ожидается:

- Node.js **LTS 20+** (минимум 18), `node --version` без сюрпризов.
- Понимание `let`/`const`, функций, объектов, модулей ES ([`30-es-modules`](../javascript-basic/30-es-modules.md)).
- Каталог `courses/javascript-basic/examples/` — вы уже умеете `cd` и `node lab/….js`.

Если JavaScript ещё «плывёт» — вернитесь к [02–07](../javascript-basic/02-variables-strict.md) javascript-basic, затем сюда.

## Установка TypeScript в проект

TypeScript — **npm-пакет** с CLI `tsc`. Рекомендуется **локальная** установка в `examples/`:

```bash
cd courses/typescript-basic/examples
npm init -y
npm install --save-dev typescript
npx tsc --version
```

| Способ | Плюс | Минус |
|--------|------|-------|
| `devDependencies` в проекте | одна версия у всей команды и CI | нужен `npx tsc` |
| `npm install -g typescript` | короткая команда `tsc` | версии расходятся между машинами |
| `npx typescript@5 tsc` | разовая версия | медленнее в CI |

В GitLab CI из [`gitlab-basic`](../gitlab-basic/README.md) пишут явно:

```bash
npm ci
npx tsc --noEmit
```

Так «работает у меня» не разойдётся с пайплайном.

## Первый файл и компиляция

Создайте `examples/hello.ts`:

```typescript
// hello.ts — первый TypeScript на курсе
const shopApiBase = "http://localhost:8090/api/v1";
const greeting: string = "Hello, TypeScript!";

console.log(greeting);
console.log("Shop API:", shopApiBase);
console.log("Node:", process.version);
```

Скомпилируйте и запустите:

```bash
npx tsc hello.ts
node hello.js
```

**Что произошло:** `tsc` прочитал `.ts`, проверил типы, сгенерировал **`hello.js`** (обычный JavaScript для Node). Node **не понимает** аннотации `: string` — их съел компилятор.

Ошибка типов **до** запуска:

```typescript
const port: number = "8090"; // error TS2322: Type 'string' is not assignable to type 'number'
```

`tsc` завершится с ненулевым кодом — в CI это блокирует merge. В JavaScript тот же баг проявился бы только в runtime при `port + 1`.

## tsconfig.json для курса

Один файл на каталог `examples/`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": ".",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

Запуск:

```bash
npx tsc
node dist/hello.js
```

| Опция | Зачем на курсе |
|-------|----------------|
| `strict: true` | ловит `null`, неявный `any`, лишние поля |
| `module: NodeNext` | согласовано с `"type": "module"` в package.json |
| `outDir: dist` | исходники `.ts` отдельно от артефактов `.js` |
| `target: ES2022` | совпадает с Node 20+ из javascript-basic |

Подробный разбор `strict` и всех флагов — в поздних главах курса; сейчас **не отключайте** `strict` «чтобы стало зелёным».

## tsx и ts-node: запуск без ручного tsc

Для **лаб** удобен **одношаговый** запуск:

```bash
npm install --save-dev tsx
npx tsx lab/03-first.ts
```

**tsx** (или устаревший **ts-node**) компилирует в памяти и сразу выполняет. В **production** и CI mock-exams предпочитают явный `tsc` → `node dist/` — воспроизводимый артефакт, как wheel/sdist в Python-треке.

| Сценарий | Инструмент |
|----------|------------|
| Быстрая лаба, REPL-подобный цикл | `tsx lab/file.ts` |
| CI, деплой, code review diff | `tsc` + `node dist/` |
| Только проверка типов без emit | `tsc --noEmit` |

## package.json и ES modules

```json
{
  "name": "typescript-basic-labs",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "lab": "tsx"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "tsx": "^4.19.0"
  }
}
```

Поле **`"type": "module"`** — как в [`javascript-basic/examples`](../javascript-basic/examples/package.json): `import`/`export` в `.ts` и сгенерированном `.js`. Префикс `node:` для встроенных модулей сохраняется.

## Структура каталога курса

```text
courses/typescript-basic/
├── README.md
├── 00-environment.md … (этот курс)
├── interview-cheatsheet.md   # позже
└── examples/
    ├── package.json
    ├── tsconfig.json
    ├── lab/              # ваши решения
    ├── solutions/        # эталоны — после своей попытки
    └── dist/             # сгенерированный JS (в .gitignore)
```

Перейдите в `examples/` и проверьте путь:

```bash
cd courses/typescript-basic/examples
node --version
npx tsc --version
```

Запуск **всегда из `examples/`**, иначе `tsconfig.json` и относительные импорты `lab/data/…` не найдутся — та же дисциплина, что в [javascript-basic/00](../javascript-basic/00-environment.md).

## VS Code / Cursor

Достаточно встроенной поддержки TypeScript (языковой сервер идёт с редактором):

| Настройка / действие | Зачем |
|---------------------|-------|
| Открыть папку `examples/` как workspace root | `tsconfig` подхватится автоматически |
| Problems panel (Ctrl+Shift+M) | список TS-ошибок без `tsc` в терминале |
| «TypeScript: Go to Source Definition» | прыжок в `.d.ts` встроенных типов |
| Format on save + Prettier | единый стиль с javascript-basic |

Не тратьте неделю на темы IDE. Тратьте на цикл **красное подчёркивание → прочитать TSxxxx → исправить → `npx tsc`**.

### Версия TypeScript в редакторе

Command Palette → **TypeScript: Select TypeScript Version** → **Use Workspace Version**. Иначе редактор может показывать одно, а `npx tsc` в CI — другое.

## Связь с javascript-basic и FastAPI :8090

Вы уже писали на JS:

```javascript
const shopApiBase = "http://localhost:8090/api/v1";
// const res = await fetch(`${shopApiBase}/items`);
```

В TypeScript тот же URL станет **типизированным контрактом** — сначала вручную (`interface Item`), позже через OpenAPI codegen к [`fastapi`](../fastapi/README.md). Пока достаточно знать: **стенд shop API на :8090** — цель для nodejs/react; typescript-basic готовит **модели данных** и **compile-time проверки** до первого `fetch` в typed BFF.

## Как это связано с курсом

| Материал | Связь |
|----------|-------|
| [01. Ландшафт](01-landscape.md) | TS vs JS, pipeline компиляции |
| [03. Лаба: первый TS](03-lab-first-ts.md) | закрепление tsc и ошибок типов |
| [`javascript-basic/00`](../javascript-basic/00-environment.md) | Node, examples/, ES modules |
| [`javascript-path`](../javascript-path.md) | место typescript-basic в ветке |
| [`deploy/fastapi` :8090](../../deploy/fastapi/README.md) | будущий контракт API |

## Типичные ошибки

**`tsc: command not found`.** TypeScript не в PATH — используйте `npx tsc` или `npm run build` после локальной установки.

**Редактор зелёный, CI красный.** Разные версии TS; не тот `tsconfig`; в CI не тот каталог. Workspace version + `cd examples`.

**Запускают `.ts` через `node file.ts`.** Node выполняет JS; для `.ts` нужен `tsc`/`tsx` или предварительный emit в `dist/`.

**Коммитят `dist/` и `node_modules/`.** В учебном репо `dist/` в `.gitignore`; в CI — `npm ci && npm run build`.

**Отключают `strict` в первый день.** Откладывает боль; курс построен на `strict: true`.

**Смешивают CommonJS и ESM.** С `"type": "module"` — только `import`/`export`; согласуйте с `module: NodeNext`.

## Резюме

Окружение typescript-basic — **Node LTS + локальный TypeScript в `examples/`**, `tsconfig.json` со `strict`, цикл **`.ts` → tsc → `.js` → node`**. Для лаб — **tsx**; для CI — **`tsc --noEmit`** и явный build. Редактор показывает ошибки раньше runtime. Курс опирается на javascript-basic и готовит typed модели к shop API на **:8090**.

## Чек-лист

- [ ] `node --version` — 20.x или 22.x (минимум 18)
- [ ] `npm install` в `courses/typescript-basic/examples/` прошёл без ошибок
- [ ] `npx tsc --version` показывает 5.x
- [ ] `hello.ts` компилируется; `node dist/hello.js` (или `node hello.js`) печатает строку
- [ ] Намеренная ошибка типа (`const n: number = "x"`) ловится `tsc`
- [ ] Открыта папка `examples/`; workspace TypeScript version выбрана
- [ ] Понимаете разницу `tsx` (лаба) и `tsc` + `node dist/` (CI)

Следующий урок: [01. Ландшафт TypeScript](01-landscape.md).
