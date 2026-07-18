# 25. Modules, ESM и `.d.ts`: ambient types

## Сценарий с работы

Вы подключаете библиотеку `left-pad` без типов — IDE молчит, `tsc` ругается. Коллега добавил `declare module "left-pad"` в `global.d.ts`, и ошибка исчезла. Через месяц API библиотеки сменился — типы **врут**, runtime падает. Второй кейс: `"type": "module"` в package.json, но старый конфиг с `"module": "CommonJS"` — в `dist` смешались `require` и `import`. Третий: импорт SVG как URL в Vite — нужен ambient declaration.

TypeScript понимает **модули** (файлы с import/export) и **declaration files** (`.d.ts`) — описание типов **без** emit JS.

## Что вы узнаете

- ESM в TypeScript: `import` / `export`, `import type`
- Разница `.ts`, `.mts`, `.cts` (обзор)
- Файлы `.d.ts`: declaration emit и hand-written
- Ambient declarations: `declare module`, `declare global`
- Типы для non-TS assets (`.json`, `.css`)
- `@types/*` и DefinitelyTyped

---

## ESM в TypeScript

Исходник:

```typescript
// src/format.ts
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export type Currency = "USD" | "EUR";
```

Потребитель:

```typescript
import { formatPrice, type Currency } from "./format.js";
```

### `import type` — только типы

```typescript
import type { Task } from "./task.js";
import { createTask, type CreateTaskOptions } from "./task.js";
```

При `importsNotUsedAsValues: "error"` (или `verbatimModuleSyntax: true`) смешанный import разделяют: value отдельно, type отдельно. **Type-only import стирается** при компиляции — в `.js` его не будет.

### Re-export типов

```typescript
export type { Task, TaskStatus } from "./task.js";
export { createTask } from "./task.js";
```

Barrel `index.ts`:

```typescript
export * from "./task.js";
export * from "./store.js";
```

Осторожно с `export *` — см. [javascript-basic/30-es-modules.md](../javascript-basic/30-es-modules.md).

---

## Конфиг для Node ESM

`package.json`:

```json
{
  "name": "task-cli",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/cli.js"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

После `tsc`:

```text
dist/
  format.js
  format.d.ts
  format.d.ts.map
```

`.d.ts.map` помогает IDE перейти к `.ts` из типов библиотеки.

---

## Что такое `.d.ts`

**Declaration file** — только типы, без реализации:

```typescript
// dist/format.d.ts (сгенерировано tsc)
export declare function formatPrice(cents: number): string;
export type Currency = "USD" | "EUR";
```

Hand-written для JS-библиотеки в репозитории:

```typescript
// types/legacy-cart.d.ts
export interface CartItem {
  sku: string;
  qty: number;
}

export function addToCart(item: CartItem): void;
```

Подключение через `include` в tsconfig или `"types"` в package.json библиотеки.

---

## `@types/*` и DefinitelyTyped

Для популярных JS-пакетов типы публикуют отдельно:

```bash
npm install -D @types/node @types/express
```

TypeScript автоматически подхватывает `@types` из `node_modules/@types`.

Если типов нет — три пути:

1. Написать свой `.d.ts` (локально или PR в DefinitelyTyped).
2. `declare module "pkg"` stub (временно).
3. Перейти на форк/альтернативу с типами.

---

## Ambient module declaration

```typescript
// src/types/shims.d.ts
declare module "untyped-logger" {
  export function log(msg: string): void;
  export function logError(msg: string, err?: unknown): void;
}
```

Файл **без** top-level `import`/`export` — **ambient** (глобальный для проекта). Если добавить `export {}`, файл становится модулем, scope уже.

**Риск:** stub не проверяет реальный API. Предпочитайте типы из npm или Zod на runtime.

---

## `declare global`

Расширение глобальных объектов:

```typescript
// env.d.ts
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_BASE: string;
      NODE_ENV: "development" | "production" | "test";
    }
  }
}
```

`export {}` обязателен, чтобы файл был модулем и `declare global` сработал.

Для браузера:

```typescript
interface Window {
  __APP_VERSION__: string;
}
```

---

## Non-code imports (Vite / bundler)

```typescript
// vite-env.d.ts
/// <reference types="vite/client" />

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.css" {
  const classes: Record<string, string>;
  export default classes;
}
```

`/// <reference types="..." />` — triple-slash directive, подключает типы пакета.

### JSON modules

```json
// tsconfig
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

```typescript
import data from "./data/products.json" with { type: "json" };
// или resolveJsonModule + import без assert в старых TS
```

---

## `.ts` vs `.mts` vs `.cts`

| Расширение | Формат при NodeNext |
|------------|---------------------|
| `.ts` | из `"type"` в package.json |
| `.mts` | всегда ESM |
| `.cts` | всегда CommonJS |

В mock-exams курсе достаточно `.ts` + `"type": "module"`.

---

## Публикация typed npm-пакета

`package.json` библиотеки:

```json
{
  "name": "@shop/task-types",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

Потребитель получает типы без отдельного `@types`.

---

## Связь с курсом

- JS ESM: [javascript-basic/30-es-modules.md](../javascript-basic/30-es-modules.md)
- tsconfig: [22-tsconfig.md](22-tsconfig.md)
- Zod schemas как runtime + inferred types: [26-zod-basics.md](26-zod-basics.md)
- Typed fetch responses: [29-fetch-typed.md](29-fetch-typed.md)

---

## Типичные ошибки

1. **`declare module` с неверной сигнатурой** — ложное чувство безопасности.

2. **Ambient файл с `import` без `export {}`** — unexpected global scope.

3. **Забыли `.js` в import** при NodeNext.

4. **`import type` используется как value** — TS1361.

5. **Дубли `@types/foo` и встроенных типов** — конфликт версий.

6. **Не включили `declaration`** — потребители библиотеки не видят API.

---

## Резюме

TypeScript modules = ESM/CJS + type-only imports. `.d.ts` описывает JS для компилятора; `tsc` генерирует их из `.ts` или вы пишете вручную. Ambient `declare module` — крайняя мера для untyped deps. `declare global` расширяет окружение. Для Node ESM: NodeNext + `.js` extensions + `"type": "module"`.

---

## Чек-лист

- Чем `import type` отличается от обычного `import` в emit?
- Когда нужен файл `.d.ts` вручную?
- Зачем `export {}` в файле с `declare global`?
- Где брать типы для `@types/node`?
- Почему stub `declare module` опасен?

Следующий урок: [26. Zod basics](26-zod-basics.md).
