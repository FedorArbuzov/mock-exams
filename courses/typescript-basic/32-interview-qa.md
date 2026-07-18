# 32. Interview Q&A: топ-30 вопросов по TypeScript

## Введение: зачем эта глава

На собеседовании TypeScript проверяют не синтаксис `interface`, а **почему** strict ловит баг, чем `unknown` лучше `any`, как generics связаны с API и когда нужен runtime validation. Эта глава — развёрнутые ответы к [interview-cheatsheet.md](interview-cheatsheet.md).

**Как работать:**

1. Прочитайте вопрос, ответьте вслух 1–2 минуты.
2. Сравните с разбором.
3. Провал — вернитесь к уроку из «Где в курсе».

---

## Блок 1. Основы типов

### 1. Чем TypeScript отличается от JavaScript?

**Ответ.** TS — **надстройка**: типы проверяются компилятором и **стираются** в emit. Runtime — обычный JS. TS ловит класс ошибок до запуска (несовместимые аргументы, null access). Не заменяет validation JSON на границе IO.

**Где в курсе:** уроки 01–04, [26-zod-basics.md](26-zod-basics.md).

---

### 2. `interface` vs `type`?

**Ответ.**

| | interface | type |
|---|-----------|------|
| Расширение | `extends`, declaration merge | intersection `&`, union `\|` |
| Union | нет напрямую | да |
| Примитивы | нет | `type ID = string` |

Для объектов API часто `interface` или `z.infer`. Для union статусов — `type` или `z.enum`.

**Где в курсе:** уроки 03–04.

---

### 3. Что такое structural typing?

**Ответ.** TS сравнивает **форму** (поля и типы), не имя декларации. Если `{ name: string }` ожидается, объект `{ name: "x", id: 1 }` может быть assignable (лишние поля OK при целевом object type в many cases). Это duck typing на этапе compile.

**Где в курсе:** урок 04.

---

### 4. `any` vs `unknown`?

**Ответ.** `any` отключает проверки; `unknown` требует narrowing перед использованием. На границе `JSON.parse` / `res.json()` — **unknown** + Zod/guard.

**Где в курсе:** [23-strict-mode.md](23-strict-mode.md), [29-fetch-typed.md](29-fetch-typed.md).

---

### 5. Что делает `"strict": true`?

**Ответ.** Umbrella: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`, `useUnknownInCatchVariables`.

**Где в курсе:** [23-strict-mode.md](23-strict-mode.md).

---

## Блок 2. Null и narrowing

### 6. Зачем `strictNullChecks`?

**Ответ.** Без него `null`/`undefined` неявно в каждом типе. С ним — явные union `T | null | undefined`, ошибка при `.prop` без проверки. Главный ROI при миграции.

**Где в курсе:** [23-strict-mode.md](23-strict-mode.md), [24-lab-strict.md](24-lab-strict.md).

---

### 7. Чем `?.` и `??` отличаются от JS?

**Ответ.** Поведение runtime то же ([javascript-basic/19-optional-nullish.md](../javascript-basic/19-optional-nullish.md)). TS **сужает** тип после `?.` и понимает, что `??` отсекает только null/undefined.

---

### 8. Что вернёт `Array.find` по типам?

**Ответ.** `T | undefined`. Обязательна проверка или throw перед использованием. Non-null assertion `!` — только если доказали логически.

**Где в курсе:** [24-lab-strict.md](24-lab-strict.md).

---

### 9. Type narrowing — какие механизмы?

**Ответ.** `typeof`, `instanceof`, `in`, discriminated union (`kind`), user-defined type predicates (`value is T`), assertion functions, control flow analysis после `if (!x) return`.

**Где в курсе:** уроки 06–08.

---

### 10. `as` vs type guard?

**Ответ.** `as` — **assertion без проверки** runtime. Guard / Zod — проверка + narrow. На IO предпочитайте parse, не `as Item[]`.

---

## Блок 3. Generics и utility types

### 11. Зачем generics?

**Ответ.** Переиспользуемый код с сохранением типа: `function first<T>(arr: T[]): T | undefined`, `Promise<T>`, `z.infer<typeof S>`. Без generics — `any` или дублирование overloads.

**Где в курсе:** уроки 11–14.

---

### 12. `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`?

**Ответ.** Mapped/conditional utility types из stdlib:

- `Partial<Task>` — все поля optional (patch updates).
- `Pick<Task, "id" | "title">` — подмножество.
- `Omit<Task, "id">` — для create DTO.

**Где в курсе:** [14-utility-types.md](14-utility-types.md).

---

### 13. Что такое `Awaited<T>`?

**Ответ.** Разворачивает Promise рекурсивно. `Awaited<Promise<Promise<string>>>` → `string`. Полезно с `ReturnType` async функций.

**Где в курсе:** [28-async-types.md](28-async-types.md).

---

### 14. Variance (кратко): почему `(dog: Dog) => void` не assignable к `(animal: Animal) => void`?

**Ответ.** При `strictFunctionTypes` параметры **contravariant** — нельзя сужать тип параметра callback. Иначе вызов с `Animal` сломает функцию, ожидающую `Dog`.

**Где в курсе:** [23-strict-mode.md](23-strict-mode.md).

---

## Блок 4. tsconfig и modules

### 15. `target` vs `module`?

**Ответ.** `target` — синтаксис **выходного** JS (ES2022). `module` — система модулей emit (ESM/CJS/NodeNext). Разные оси.

**Где в курсе:** [22-tsconfig.md](22-tsconfig.md).

---

### 16. Почему import `./file.js` при исходнике `.ts`?

**Ответ.** Node ESM резолвит runtime paths. TS не переписывает extensions; import должен совпадать с будущим `.js` на диске.

**Где в курсе:** [22-tsconfig.md](22-tsconfig.md), [25-modules-declarations.md](25-modules-declarations.md).

---

### 17. `import type` — зачем?

**Ответ.** Импорт только для типов — **стирается** в emit. Нужен при `verbatimModuleSyntax`, избегает циклических runtime deps.

**Где в курсе:** [25-modules-declarations.md](25-modules-declarations.md).

---

### 18. Что такое `.d.ts`?

**Ответ.** Declaration file — типы без JS. Генерируется `tsc --declaration` или пишется для JS-библиотек / ambient modules.

**Где в курсе:** [25-modules-declarations.md](25-modules-declarations.md).

---

## Блок 5. Runtime и Zod

### 19. TS защищает от неверного JSON с API?

**Ответ.** **Нет** — типы исчезают в runtime. Нужен Zod/class-validator на границе. Compile-time + runtime = defense in depth.

**Где в курсе:** [26-zod-basics.md](26-zod-basics.md), [27-lab-zod.md](27-lab-zod.md).

---

### 20. `z.infer` vs дублирующий interface?

**Ответ.** Single source of truth — schema. Interface вручную + Zod расходятся. Infer синхронизирует автоматически.

---

### 21. `.parse` vs `.safeParse`?

**Ответ.** `parse` throws `ZodError`. `safeParse` returns `{ success, data | error }` — удобно в HTTP handlers без try/catch.

---

## Блок 6. Async и fetch

### 22. Return type async function?

**Ответ.** Всегда `Promise<T>`, даже если `return 5` — оборачивается. Аннотация `async (): T` без Promise — ошибка.

**Где в курсе:** [28-async-types.md](28-async-types.md).

---

### 23. Floating promise — что это?

**Ответ.** Promise создан, но не awaited и не voided — ошибка reject может стать unhandled. ESLint `@typescript-eslint/no-floating-promises`.

**Где в курсе:** [31-tooling-migration.md](31-tooling-migration.md).

---

### 24. Типобезопасный fetch pipeline?

**Ответ.** `fetch` → check `ok` → `json(): unknown` → `Schema.parse` → `T`. Не `as T`.

**Где в курсе:** [29-fetch-typed.md](29-fetch-typed.md), [30-lab-fetch.md](30-lab-fetch.md).

---

### 25. Reject ли fetch на HTTP 404?

**Ответ.** **Нет** — только network/abort. 404 — `ok: false`, нужна ручная проверка ([javascript-basic/29-fetch.md](../javascript-basic/29-fetch.md)).

---

## Блок 7. Migration и tooling

### 26. Стратегия JS → TS в легаси?

**Ответ.** allowJs + checkJs → migrate leaves → strict per package → Zod on boundaries. Не big-bang strict на весь repo.

**Где в курсе:** [31-tooling-migration.md](31-tooling-migration.md).

---

### 27. ESLint vs tsc?

**Ответ.** tsc — типы. ESLint — стиль, некоторые логические ошибки; type-aware eslint дополняет, не заменяет tsc.

---

### 28. Когда `@ts-expect-error` допустим?

**Ответ.** Временно, с ticket, когда знаете exact line error. Не массовая замена strict. Prefer fix или narrow type.

---

## Блок 8. Design и capstone

### 29. Discriminated union для CLI команд?

**Ответ.** Общее поле `kind: literal` + switch exhaustive + `assertNever`. TS проверяет полноту веток.

**Где в курсе:** [24-lab-strict.md](24-lab-strict.md), урок 08.

---

### 30. Как связаны JS capstone, TS capstone и FastAPI?

**Ответ.** Один домен **tasks** / **shop items**: JS CLI + JSON file ([javascript-basic/39-capstone.md](../javascript-basic/39-capstone.md)) → TS + strict + Zod ([33-capstone.md](33-capstone.md)) → HTTP `:8090` ([30-lab-fetch.md](30-lab-fetch.md)) → nodejs/react клиенты. Сквозная линия mock-exams.

---

## Блок 9. Бонус (если осталось время)

### enum vs union of literals?

**Ответ.** Union `"todo" | "done"` — zero runtime, предпочтительно в modern TS. `enum` генерирует JS object — осторожно с bundle и reverse mapping. Zod: `z.enum([...])`.

---

## После главы

1. Пройдите [interview-cheatsheet.md](interview-cheatsheet.md) без подглядывания.
2. Сделайте [33-capstone.md](33-capstone.md).
3. Следующий курс: **nodejs-basic** или углубление generics в advanced материалах.

---

[← 31-tooling](31-tooling-migration.md) · [interview-cheatsheet](interview-cheatsheet.md) · [33-capstone](33-capstone.md)
