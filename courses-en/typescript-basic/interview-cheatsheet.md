# TypeScript Basic — Interview Cheatsheet

Test yourself **without peeking**, then open [32-interview-qa.md](32-interview-qa.md).

---

## Quick answers

### Basics

| Question | Answer |
|--------|-------|
| TS vs JS | types are compile-time only; the emit = JS |
| `interface` vs `type` | interface: merge, extends; type: union, primitives |
| Structural typing | the shape of fields, not the type name |
| `any` vs `unknown` | any disables checks; unknown requires narrowing |
| `"strict": true` | noImplicitAny, strictNullChecks, … (see lesson 23) |

### Null and narrowing

| Question | Answer |
|--------|-------|
| `find()` | `T \| undefined` — a check is mandatory |
| `?.` / `??` | optional chain; default only for null/undefined |
| Non-null `!` | an assertion without a runtime check — be careful |
| Discriminated union | a common `kind` + an exhaustive switch |
| `as T` vs Zod | as doesn't check the runtime; Zod parse does |

### Generics and utility

| Question | Answer |
|--------|-------|
| `Promise<T>` | the type of the fulfilled value |
| `Awaited<T>` | unwraps a Promise recursively |
| `Partial<T>` | all fields optional |
| `Pick` / `Omit` | a subset / without fields |
| `z.infer<typeof S>` | the TS type from a Zod schema |

### tsconfig

| Question | Answer |
|--------|-------|
| `target` | the JS level in the output (ES2022) |
| `module` | the module format (NodeNext, ESNext) |
| import `./x.js` | the runtime path under NodeNext |
| `paths` `@/*` | an alias for the IDE/bundler; tsc doesn't rewrite |
| `noEmit: true` | check only (Vite projects) |

### Modules and .d.ts

| Question | Answer |
|--------|-------|
| `import type` | erased in the emit |
| `.d.ts` | types without JS |
| `declare module "x"` | a stub for an untyped lib |
| `@types/node` | DefinitelyTyped for Node |

### Zod and I/O

| Question | Answer |
|--------|-------|
| Why Zod | runtime validation of JSON/API |
| `.parse` | throws a ZodError |
| `.safeParse` | `{ success, data \| error }` |
| Where to parse | the I/O boundary: fetch, file, env |
| TS + Zod | compile-time + runtime |

### Async and fetch

| Question | Answer |
|--------|-------|
| async return | always `Promise<T>` |
| Floating promise | a Promise without await — an ESLint error |
| `res.json()` | assign to `unknown`, not `any` |
| fetch + 404 | ok: false, not a reject |
| Pipeline | fetch → ok → json unknown → Zod → T |

### Migration

| Question | Answer |
|--------|-------|
| allowJs / checkJs | JS in the project + optionally types |
| Migration order | leaf modules → core → strict |
| ESLint vs tsc | they complement each other |
| `@ts-expect-error` | temporarily, with a ticket |

---

## Mini snippets

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

## Common pitfalls

1. `as Item[]` after `json()` — no runtime check
2. `find()` without a check — undefined at runtime
3. async without Promise in the return type annotation
4. `strict: false` "temporarily" for years
5. Duplicating an interface and a Zod schema
6. A path alias without a bundler/tsconfig-paths in Node
7. import without `.js` under NodeNext
8. Trusting HTTP 200 without Zod (wrong shape)
9. `@ts-ignore` instead of fixing strict errors
10. A floating `store.save()` without await

---

## Capstone checklist

- [ ] TaskSchema + TaskFileSchema for tasks.json
- [ ] strict: true, 0 tsc errors
- [ ] ShopClient for `:8090` with ItemSchema
- [ ] CLI task + shop commands
- [ ] README + Docker hint

See [33-capstone.md](33-capstone.md); JS source: [javascript-basic/39-capstone.md](../javascript-basic/39-capstone.md).

---

## What to learn next

| Topic | Course |
|------|------|
| HTTP server / BFF | nodejs-basic |
| UI + Query | react-basic |
| Vitest/MSW tests | javascript-testing |
| OpenAPI contracts | api-design |
| Advanced generics | nodejs-intermediate, react-intermediate |

---

[← README](README.md) · [32-interview-qa](32-interview-qa.md) · [33-capstone](33-capstone.md)
