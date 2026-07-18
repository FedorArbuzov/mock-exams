# TypeScript Basic — Interview Cheatsheet

Проверьте себя **без подглядывания**, затем откройте [32-interview-qa.md](32-interview-qa.md).

---

## Быстрые ответы

### Основы

| Вопрос | Ответ |
|--------|-------|
| TS vs JS | типы только compile-time; emit = JS |
| `interface` vs `type` | interface: merge, extends; type: union, primitives |
| Structural typing | форма полей, не имя типа |
| `any` vs `unknown` | any отключает проверки; unknown требует narrow |
| `"strict": true` | noImplicitAny, strictNullChecks, … (см. урок 23) |

### Null и narrowing

| Вопрос | Ответ |
|--------|-------|
| `find()` | `T \| undefined` — проверка обязательна |
| `?.` / `??` | optional chain; default только null/undefined |
| Non-null `!` | assertion без runtime check — осторожно |
| Discriminated union | общий `kind` + exhaustive switch |
| `as T` vs Zod | as не проверяет runtime; Zod parse — да |

### Generics и utility

| Вопрос | Ответ |
|--------|-------|
| `Promise<T>` | тип fulfilled value |
| `Awaited<T>` | unwrap Promise рекурсивно |
| `Partial<T>` | все поля optional |
| `Pick` / `Omit` | подмножество / без полей |
| `z.infer<typeof S>` | TS-тип из Zod schema |

### tsconfig

| Вопрос | Ответ |
|--------|-------|
| `target` | уровень JS на выходе (ES2022) |
| `module` | формат модулей (NodeNext, ESNext) |
| import `./x.js` | runtime path при NodeNext |
| `paths` `@/*` | alias для IDE/bundler; tsc не rewrite |
| `noEmit: true` | только check (Vite projects) |

### Modules и .d.ts

| Вопрос | Ответ |
|--------|-------|
| `import type` | стирается в emit |
| `.d.ts` | типы без JS |
| `declare module "x"` | stub для untyped lib |
| `@types/node` | DefinitelyTyped для Node |

### Zod и IO

| Вопрос | Ответ |
|--------|-------|
| Зачем Zod | runtime validation JSON/API |
| `.parse` | throw ZodError |
| `.safeParse` | `{ success, data \| error }` |
| Где parse | граница IO: fetch, file, env |
| TS + Zod | compile-time + runtime |

### Async и fetch

| Вопрос | Ответ |
|--------|-------|
| async return | всегда `Promise<T>` |
| Floating promise | Promise без await — ESLint error |
| `res.json()` | assign в `unknown`, не `any` |
| fetch + 404 | ok: false, не reject |
| Pipeline | fetch → ok → json unknown → Zod → T |

### Migration

| Вопрос | Ответ |
|--------|-------|
| allowJs / checkJs | JS в project + опционально типы |
| Порядок миграции | leaf modules → core → strict |
| ESLint vs tsc | дополняют друг друга |
| `@ts-expect-error` | временно, с ticket |

---

## Мини-сниппеты

```typescript
// unknown → Zod
const json: unknown = await res.json();
const items = ItemListSchema.parse(json);

// infer type from schema
type Task = z.infer<typeof TaskSchema>;

// exhaustive switch
function handle(cmd: Command): void {
  switch (cmd.kind) {
    case "add": /* ... */ break;
    case "list": /* ... */ break;
    default:
      assertNever(cmd);
  }
}

// async error
main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

// type-only import
import type { Task } from "./task.js";
```

---

## Частые ловушки

1. `as Item[]` после `json()` — нет runtime check
2. `find()` без проверки — undefined в runtime
3. async без Promise в return type annotation
4. `strict: false` «временно» на годы
5. Дублировать interface и Zod schema
6. Path alias без bundler/tsconfig-paths в Node
7. import без `.js` при NodeNext
8. Доверять HTTP 200 без Zod (неверная форма)
9. `@ts-ignore` вместо fix strict errors
10. Floating `store.save()` без await

---

## Capstone checklist

- [ ] TaskSchema + TaskFileSchema для tasks.json
- [ ] strict: true, 0 errors tsc
- [ ] ShopClient к `:8090` с ItemSchema
- [ ] CLI task + shop commands
- [ ] README + Docker hint

См. [33-capstone.md](33-capstone.md), JS исходник: [javascript-basic/39-capstone.md](../javascript-basic/39-capstone.md).

---

## Что учить дальше

| Тема | Курс |
|------|------|
| HTTP сервер / BFF | nodejs-basic |
| UI + Query | react-basic |
| Тесты Vitest/MSW | javascript-testing |
| OpenAPI контракты | api-design |
| Advanced generics | nodejs-intermediate, react-intermediate |

---

[← README](README.md) · [32-interview-qa](32-interview-qa.md) · [33-capstone](33-capstone.md)
