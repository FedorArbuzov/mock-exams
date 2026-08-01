# 32. Interview Q&A: top 30 TypeScript questions

## Intro: why this chapter

In an interview, TypeScript is tested not on the syntax of `interface`, but on **why** strict catches a bug, why `unknown` is better than `any`, how generics relate to an API, and when runtime validation is needed. This chapter is the detailed answers to [interview-cheatsheet.md](interview-cheatsheet.md).

**How to work through it:**

1. Read the question, answer out loud for 1–2 minutes.
2. Compare with the breakdown.
3. If you fail — go back to the lesson in "Where in the course."

---

## Block 1. Type basics

### 1. How does TypeScript differ from JavaScript?

**Answer.** TS is a **superset**: types are checked by the compiler and **erased** in the emit. The runtime is plain JS. TS catches a class of errors before running (incompatible arguments, null access). It doesn't replace JSON validation at the I/O boundary.

**Where in the course:** lessons 01–04, [26-zod-basics.md](26-zod-basics.md).

---

### 2. `interface` vs `type`?

**Answer.**

| | interface | type |
|---|-----------|------|
| Extension | `extends`, declaration merge | intersection `&`, union `\|` |
| Union | not directly | yes |
| Primitives | no | `type ID = string` |

For API objects, often `interface` or `z.infer`. For status unions — `type` or `z.enum`.

**Where in the course:** lessons 03–04.

---

### 3. What is structural typing?

**Answer.** TS compares the **shape** (fields and types), not the declaration name. If `{ name: string }` is expected, the object `{ name: "x", id: 1 }` may be assignable (extra fields are OK for a target object type in many cases). This is compile-time duck typing.

**Where in the course:** lesson 04.

---

### 4. `any` vs `unknown`?

**Answer.** `any` disables checks; `unknown` requires narrowing before use. At the `JSON.parse` / `res.json()` boundary — **unknown** + Zod/guard.

**Where in the course:** [23-strict-mode.md](23-strict-mode.md), [29-fetch-typed.md](29-fetch-typed.md).

---

### 5. What does `"strict": true` do?

**Answer.** An umbrella: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`, `useUnknownInCatchVariables`.

**Where in the course:** [23-strict-mode.md](23-strict-mode.md).

---

## Block 2. Null and narrowing

### 6. Why `strictNullChecks`?

**Answer.** Without it, `null`/`undefined` are implicitly in every type. With it — explicit unions `T | null | undefined`, and an error on `.prop` without a check. The main ROI during migration.

**Where in the course:** [23-strict-mode.md](23-strict-mode.md), [24-lab-strict.md](24-lab-strict.md).

---

### 7. How do `?.` and `??` differ from JS?

**Answer.** The runtime behavior is the same ([javascript-basic/19-optional-nullish.md](../javascript-basic/19-optional-nullish.md)). TS **narrows** the type after `?.` and understands that `??` only cuts off null/undefined.

---

### 8. What does `Array.find` return by type?

**Answer.** `T | undefined`. A check or throw before use is mandatory. Non-null assertion `!` — only if you've proven it logically.

**Where in the course:** [24-lab-strict.md](24-lab-strict.md).

---

### 9. Type narrowing — what mechanisms are there?

**Answer.** `typeof`, `instanceof`, `in`, discriminated union (`kind`), user-defined type predicates (`value is T`), assertion functions, control flow analysis after `if (!x) return`.

**Where in the course:** lessons 06–08.

---

### 10. `as` vs a type guard?

**Answer.** `as` is an **assertion without a runtime check**. A guard / Zod is a check + narrow. At I/O prefer parse, not `as Item[]`.

---

## Block 3. Generics and utility types

### 11. Why generics?

**Answer.** Reusable code that preserves the type: `function first<T>(arr: T[]): T | undefined`, `Promise<T>`, `z.infer<typeof S>`. Without generics — `any` or duplicated overloads.

**Where in the course:** lessons 11–14.

---

### 12. `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`?

**Answer.** Mapped/conditional utility types from the stdlib:

- `Partial<Task>` — all fields optional (patch updates).
- `Pick<Task, "id" | "title">` — a subset.
- `Omit<Task, "id">` — for a create DTO.

**Where in the course:** [14-utility-types.md](14-utility-types.md).

---

### 13. What is `Awaited<T>`?

**Answer.** Unwraps a Promise recursively. `Awaited<Promise<Promise<string>>>` → `string`. Useful with `ReturnType` of async functions.

**Where in the course:** [28-async-types.md](28-async-types.md).

---

### 14. Variance (briefly): why is `(dog: Dog) => void` not assignable to `(animal: Animal) => void`?

**Answer.** Under `strictFunctionTypes`, parameters are **contravariant** — you can't narrow a callback's parameter type. Otherwise a call with `Animal` would break a function expecting `Dog`.

**Where in the course:** [23-strict-mode.md](23-strict-mode.md).

---

## Block 4. tsconfig and modules

### 15. `target` vs `module`?

**Answer.** `target` — the syntax of the **output** JS (ES2022). `module` — the module system in the emit (ESM/CJS/NodeNext). Different axes.

**Where in the course:** [22-tsconfig.md](22-tsconfig.md).

---

### 16. Why import `./file.js` when the source is `.ts`?

**Answer.** Node ESM resolves runtime paths. TS doesn't rewrite extensions; the import must match the future `.js` on disk.

**Where in the course:** [22-tsconfig.md](22-tsconfig.md), [25-modules-declarations.md](25-modules-declarations.md).

---

### 17. `import type` — why?

**Answer.** A types-only import — **erased** in the emit. Needed with `verbatimModuleSyntax`; avoids cyclic runtime deps.

**Where in the course:** [25-modules-declarations.md](25-modules-declarations.md).

---

### 18. What is `.d.ts`?

**Answer.** A declaration file — types without JS. Generated by `tsc --declaration` or written for JS libraries / ambient modules.

**Where in the course:** [25-modules-declarations.md](25-modules-declarations.md).

---

## Block 5. Runtime and Zod

### 19. Does TS protect against invalid JSON from an API?

**Answer.** **No** — types disappear at runtime. You need Zod/class-validator at the boundary. Compile-time + runtime = defense in depth.

**Where in the course:** [26-zod-basics.md](26-zod-basics.md), [27-lab-zod.md](27-lab-zod.md).

---

### 20. `z.infer` vs a duplicated interface?

**Answer.** A single source of truth — the schema. A hand-written interface + Zod diverge. Infer synchronizes them automatically.

---

### 21. `.parse` vs `.safeParse`?

**Answer.** `parse` throws a `ZodError`. `safeParse` returns `{ success, data | error }` — convenient in HTTP handlers without try/catch.

---

## Block 6. Async and fetch

### 22. Return type of an async function?

**Answer.** Always `Promise<T>`, even if `return 5` — it gets wrapped. An annotation `async (): T` without Promise is an error.

**Where in the course:** [28-async-types.md](28-async-types.md).

---

### 23. Floating promise — what is it?

**Answer.** A Promise is created but not awaited and not voided — a reject error can become unhandled. ESLint `@typescript-eslint/no-floating-promises`.

**Where in the course:** [31-tooling-migration.md](31-tooling-migration.md).

---

### 24. A type-safe fetch pipeline?

**Answer.** `fetch` → check `ok` → `json(): unknown` → `Schema.parse` → `T`. Not `as T`.

**Where in the course:** [29-fetch-typed.md](29-fetch-typed.md), [30-lab-fetch.md](30-lab-fetch.md).

---

### 25. Does fetch reject on HTTP 404?

**Answer.** **No** — only on network/abort. 404 — `ok: false`, needs a manual check ([javascript-basic/29-fetch.md](../javascript-basic/29-fetch.md)).

---

## Block 7. Migration and tooling

### 26. Strategy for JS → TS in legacy?

**Answer.** allowJs + checkJs → migrate leaves → strict per package → Zod on boundaries. Not a big-bang strict on the whole repo.

**Where in the course:** [31-tooling-migration.md](31-tooling-migration.md).

---

### 27. ESLint vs tsc?

**Answer.** tsc — types. ESLint — style, some logical errors; type-aware eslint complements, doesn't replace tsc.

---

### 28. When is `@ts-expect-error` acceptable?

**Answer.** Temporarily, with a ticket, when you know the exact line error. Not a mass replacement for strict. Prefer a fix or narrowing the type.

---

## Block 8. Design and the capstone

### 29. A discriminated union for CLI commands?

**Answer.** A common `kind: literal` field + an exhaustive switch + `assertNever`. TS checks the completeness of the branches.

**Where in the course:** [24-lab-strict.md](24-lab-strict.md), lesson 08.

---

### 30. How are the JS capstone, TS capstone, and FastAPI connected?

**Answer.** One domain — **tasks** / **shop items**: JS CLI + JSON file ([javascript-basic/39-capstone.md](../javascript-basic/39-capstone.md)) → TS + strict + Zod ([33-capstone.md](33-capstone.md)) → HTTP `:8090` ([30-lab-fetch.md](30-lab-fetch.md)) → nodejs/react clients. The through-line of mock-exams.

---

## Block 9. Bonus (if time is left)

### enum vs a union of literals?

**Answer.** A union `"todo" | "done"` — zero runtime, preferred in modern TS. `enum` generates a JS object — be careful with the bundle and reverse mapping. Zod: `z.enum([...])`.

---

## After the chapter

1. Go through [interview-cheatsheet.md](interview-cheatsheet.md) without peeking.
2. Do [33-capstone.md](33-capstone.md).
3. Next course: **nodejs-basic** or deepening generics in the advanced materials.

---

[← 31-tooling](31-tooling-migration.md) · [interview-cheatsheet](interview-cheatsheet.md) · [33-capstone](33-capstone.md)
