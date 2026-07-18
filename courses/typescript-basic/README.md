# TypeScript — Basic

Мега-подробный курс **TypeScript** поверх [`javascript-basic`](../javascript-basic/README.md): аннотации и inference, union/intersection, generics, `strict`, `tsconfig`, Zod, typed `fetch`. **34 урока** + capstone + interview cheatsheet.

> Старт JS-маршрута: [`javascript-path.md`](../javascript-path.md). **Предварительно** — пройден или уверенно читан [`javascript-basic`](../javascript-basic/README.md). Дальше — [`nodejs-basic`](../javascript-path.md), [`react-basic`](../react-basic/README.md).

**Предварительно:** Node.js **LTS** (20 или 22), завершённый или параллельный javascript-basic (типы, функции, модули, `fetch`, ошибки).

**Локально:** Node.js LTS на хосте. Код лаб — каталог [`examples/`](examples/package.json).

```bash
cd courses/typescript-basic/examples
npm install
npx tsc --version          # 5.x
npm run typecheck
npx tsx lab/01-hello.ts    # после лабы 03
```

Опционально: [nvm](https://github.com/nvm-sh/nvm) / [nvm-windows](https://github.com/coreybutler/nvm-windows). Стенд [`deploy/fastapi`](../../deploy/fastapi/README.md) `:8090` — для лаб 27, 30 и capstone (Docker, не обязателен до главы 27).

## Как читать главы

Каждый урок — **полноценная глава учебника**, как в javascript-basic: **сценарий с работы** → концепции → код → типичные ошибки → чек-лист.

1. **Теория** — закрепляйте чек-лист своими словами до лабы.
2. **Лаба** — hands-on в [`examples/`](examples/package.json): `npx tsx lab/….ts` или `npm run build` + `node dist/…`. Эталоны — [`solutions/`](examples/solutions/) только после своей попытки.
3. После блока 32 — [`interview-cheatsheet.md`](interview-cheatsheet.md) **без подглядывания** в главы.
4. [33-capstone.md](33-capstone.md) — **4–6 часов**: typed Task Tracker + Shop API client.

**Время:** **~50–70 минут** на пару «теория + лаба». Весь курс — **~12–16 часов**; capstone отдельно.

## Программа (34 урока)

### Фаза 1. Среда и первые типы (00–03)

| # | Урок |
|---|------|
| 00 | [Окружение: tsc, tsx, tsconfig](00-environment.md) |
| 01 | [Ландшафт: TS vs JS, компиляция](01-landscape.md) |
| 02 | [Аннотации и inference](02-annotations-inference.md) |
| 03 | [Лаба: первые `.ts` файлы](03-lab-first-ts.md) |

### Фаза 2. Основы системы типов (04–09)

| 04 | [Примитивы и literal types](04-primitives-literals.md) |
| 05 | [Union и intersection](05-unions-intersections.md) |
| 06 | [Лаба: union в домене shop](06-lab-unions.md) |
| 07 | [Interfaces и объекты](07-interfaces-objects.md) |
| 08 | [Narrowing и control flow](08-narrowing.md) |
| 09 | [Лаба: типизированный каталог](09-lab-objects.md) |

### Фаза 3. Функции, массивы, generics (10–15)

| 10 | [Типы функций и overloads](10-functions.md) |
| 11 | [Массивы, tuples, `as const`](11-arrays-tuples.md) |
| 12 | [Лаба: typed helpers](12-lab-functions.md) |
| 13 | [Generics](13-generics.md) |
| 14 | [Utility types](14-utility-types.md) |
| 15 | [Лаба: generic repository](15-lab-generics.md) |

### Фаза 4. Классы и продвинутые типы (16–21)

| 16 | [Классы с типами](16-classes.md) |
| 17 | [Enum, const assertions, `satisfies`](17-enums-const.md) |
| 18 | [Лаба: иерархия Product](18-lab-classes.md) |
| 19 | [Type guards](19-type-guards.md) |
| 20 | [Discriminated unions](20-discriminated-unions.md) |
| 21 | [Лаба: API result types](21-lab-discriminated.md) |

### Фаза 5. tsconfig и модули (22–25)

| 22 | [tsconfig.json](22-tsconfig.md) |
| 23 | [Strict mode](23-strict-mode.md) |
| 24 | [Лаба: исправить strict-ошибки](24-lab-strict.md) |
| 25 | [Modules и declaration files](25-modules-declarations.md) |

### Фаза 6. Zod и typed HTTP (26–30)

| 26 | [Zod: runtime validation](26-zod-basics.md) |
| 27 | [Лаба: Zod + FastAPI :8090](27-lab-zod.md) |
| 28 | [Async и Promise types](28-async-types.md) |
| 29 | [Typed fetch](29-fetch-typed.md) |
| 30 | [Лаба: fetch + Zod](30-lab-fetch.md) |

### Фаза 7. Tooling и финал (31–33)

| 31 | [ESLint, миграция JS → TS](31-tooling-migration.md) |
| 32 | [Interview Q&A (топ-30)](32-interview-qa.md) |
| 33 | [Capstone: Typed Shop CLI](33-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## Что должно получиться

- Пишете **strict TypeScript** с inference, union, generics — без массового `any`.
- Настраиваете **`tsconfig.json`** и объясняете флаги `strict`, `noUncheckedIndexedAccess`.
- Строите **discriminated unions** и **type guards** для API-результатов.
- Валидируете JSON на границе через **Zod** (`z.infer` — единственный источник типов).
- Делаете **typed `fetch`** к FastAPI `:8090` с разделением HTTP / schema ошибок.
- Мигрируете JS-модуль на TS **постепенно** (allowJs, JSDoc).
- Готовы к **nodejs-basic** (Express/Fastify typed) и **react-basic** (`.tsx`, props).

## Связь с курсами

| Курс | Связь |
|------|-------|
| [`javascript-basic`](../javascript-basic/README.md) | обязательная база: синтаксис, модули, async, fetch |
| [`nodejs-basic`](../javascript-path.md) | typed BFF к `:8090` |
| [`react-basic`](../react-basic/README.md) | компоненты `.tsx`, props, hooks |
| [`fastapi`](../../deploy/fastapi/README.md) | контракт API для Zod/fetch лаб |
| [`api-design`](../api-design/README.md) | OpenAPI, ошибки 422/404 |
| [`javascript-testing`](../javascript-path.md) | Vitest + typed mocks |

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/package.json`](examples/package.json) | `"type": "module"`, typescript, tsx, zod |
| [`examples/tsconfig.json`](examples/tsconfig.json) | `strict: true`, NodeNext |
| [`examples/lab/`](examples/lab/) | лабы 03–21 |
| [`examples/lab-strict/`](examples/lab-strict/) | лаба 24 — исправить strict |
| [`examples/lab-zod/`](examples/lab-zod/) | лаба 27 — Zod + API |
| [`examples/lab-fetch/`](examples/lab-fetch/) | лаба 30 — typed client |
| [`examples/capstone/`](examples/capstone/) | старт capstone |
| [`examples/solutions/`](examples/solutions/) | эталоны (после попытки) |
