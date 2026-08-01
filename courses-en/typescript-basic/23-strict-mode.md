# 23. Strict mode: `strictNullChecks`, `noImplicitAny` and the flag family

## Scenario from work

A junior migrates a JS cart module to TypeScript with `"strict": false`. The PR is green. On staging: `Cannot read properties of undefined (reading 'price')` — `item` was `undefined` because `find` didn't locate the SKU. A senior turns on `strictNullChecks`: 847 errors. A week later — 40 meaningful edits and zero such NPEs in that module.

**TypeScript strict mode** — not to be confused with JavaScript's `"use strict"` ([javascript-basic/02-variables-strict.md](../javascript-basic/02-variables-strict.md)). It's a set of **compiler flags** that forbid implicit `any`, unsafe `null`/`undefined`, and other holes through which JS bugs slip "with a green type checkmark."

## What you'll learn

- What `"strict": true` enables
- `strictNullChecks` and working with `null` / `undefined`
- `noImplicitAny` and explicit typing
- `strictFunctionTypes`, `noImplicitThis`, `alwaysStrict`
- Additional "strict" flags outside `strict`
- A strategy for enabling strict in an existing project

---

## `"strict": true` — the umbrella

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Enables **all** the flags below (current for TS 5.x):

| Flag | Essence |
|------|------|
| `noImplicitAny` | error if a type is inferred as `any` |
| `strictNullChecks` | `null`/`undefined` — separate values in a union |
| `strictFunctionTypes` | contravariance of function parameters |
| `strictBindCallApply` | types for `bind`/`call`/`apply` |
| `strictPropertyInitialization` | class fields initialized in the constructor |
| `noImplicitThis` | `this` with an implicit `any` — error |
| `alwaysStrict` | emit `"use strict"` in every file |
| `useUnknownInCatchVariables` | `catch (e)` → `unknown`, not `any` |

**Course rule:** new projects — `"strict": true` from the first commit. Legacy — see [31-tooling-migration.md](31-tooling-migration.md) and the lab [24-lab-strict.md](24-lab-strict.md).

---

## `noImplicitAny`

Without the flag:

```typescript
function add(a, b) {
  return a + b;
}
// a, b: any — will glue strings and numbers together like JS
```

With `noImplicitAny`:

```typescript
function add(a: number, b: number): number {
  return a + b;
}
```

Explicit `any` is **allowed** if you write it deliberately:

```typescript
function legacyBridge(payload: any): void {
  // TODO: type after migration
}
```

But `any` **infects** the chain: the result of `legacyBridge` is `any` again. Minimize it; at API boundaries use `unknown` ([29-fetch-typed.md](29-fetch-typed.md)).

---

## `strictNullChecks`

Without the flag, `null` and `undefined` "stick" to all types (except `void` in older versions).

With the flag:

```typescript
type User = { name: string; email: string | null };

function sendWelcome(user: User) {
  console.log(user.email.toLowerCase());
  //              ~~~~~ Object is possibly 'null'
}
```

Fixes:

```typescript
if (user.email !== null) {
  console.log(user.email.toLowerCase());
}

console.log(user.email?.toLowerCase() ?? "no email");
```

### `find`, `[]`, optional properties

```typescript
const items = [{ id: "1", name: "Keyboard" }];
const item = items.find((i) => i.id === "999");
// item: { id: string; name: string } | undefined

if (!item) {
  throw new Error("Not found");
}
console.log(item.name);
```

Optional `?` ≠ "can be null":

```typescript
interface Task {
  dueDate?: string; // string | undefined
  tags: string[];   // required; [] if empty
}
```

For "may be absent or null" — `string | null | undefined` or normalization at the boundary (Zod — [26-zod-basics.md](26-zod-basics.md)).

---

## `strictFunctionTypes`

Forbids incompatible callbacks on assignment:

```typescript
type AnimalHandler = (animal: Animal) => void;

const dogHandler: AnimalHandler = (dog: Dog) => {
  console.log(dog.breed);
};
// Error: DogHandler is not assignable to AnimalHandler
// (parameters are contravariant — you can't narrow them)
```

In practice this surfaces more often with generic callbacks and event handlers. If you get stuck — simplify the signature or use an overload.

---

## `strictPropertyInitialization`

```typescript
class TaskStore {
  private tasks: Task[]; // Error: no initializer

  constructor() {
    this.tasks = [];
  }
}
```

Or a definite assignment assertion (carefully):

```typescript
private config!: AppConfig; // "I'll initialize later in init()"
```

Prefer initialization in the constructor or a field with a default.

---

## `useUnknownInCatchVariables`

```typescript
try {
  await saveTasks();
} catch (err) {
  // err: unknown
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error(String(err));
  }
}
```

Related to [javascript-basic/32-error-handling.md](../javascript-basic/32-error-handling.md).

---

## Flags outside `strict` (recommended)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  }
}
```

| Flag | Effect |
|------|--------|
| `noUncheckedIndexedAccess` | `arr[i]` → `T \| undefined` |
| `noImplicitOverride` | explicit `override` in subclasses |
| `exactOptionalPropertyTypes` | `{ x?: number }` doesn't accept an explicit `x: undefined` |

`noUncheckedIndexedAccess` is noisy but saves you from `tasks[id]` without a check — useful in the store capstone.

---

## Gradual enablement (legacy)

```json
{
  "compilerOptions": {
    "strict": false,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

Or a directive in a file (not recommended long-term):

```typescript
// @ts-nocheck — the whole file without checking (last resort)
// @ts-expect-error — the next line must produce an error (for tests)
```

Better: there is no `// @ts-strict`; use **eslint** `@typescript-eslint/strict` and the lab [24-lab-strict.md](24-lab-strict.md).

---

## Strict + runtime validation

TypeScript checks **at compile time**. JSON from `:8090` arrives **without types**:

```typescript
const raw = await res.json(); // any or unknown
```

Compile-time strict won't save you from `{ price: "79.99" }` instead of a number. At the boundary — Zod ([26-zod-basics.md](26-zod-basics.md)).

---

## Related courses

- Unions and narrowing — lessons 05–08.
- Optional chaining — [javascript-basic/19-optional-nullish.md](../javascript-basic/19-optional-nullish.md).
- tsconfig — [22-tsconfig.md](22-tsconfig.md).
- Error-fixing lab — [24-lab-strict.md](24-lab-strict.md).

---

## Common mistakes

1. **`as SomeType` instead of a check** — you muted strict, the bug remained.

2. **Non-null assertion `!` everywhere** — `user!.email!.slice()` — masking, not a solution.

3. **Confusing `?` and `| null`** — the API returned `null`, but the field is optional — `undefined`.

4. **Disabling strict in a monorepo package** — the weakest package drags quality down.

5. **Ignoring `unknown` in catch** — `err.message` without narrowing.

6. **Thinking strict = runtime safety** — you still need Zod on I/O.

---

## Summary

`strict: true` enables a family of flags against implicit `any`, unsafe null, and weak function signatures. `strictNullChecks` is the main source of "new" errors during migration and the main reliability win. Additional flags (`noUncheckedIndexedAccess`) strengthen protection. Strict doesn't replace JSON validation — combine it with Zod.

---

## Checklist

- What does `"strict": true` enable?
- How does `T | undefined` differ from an optional property `x?: T`?
- Why does `find()` require a check after the call?
- Why `unknown` instead of `any` in catch?
- Does strict catch a `JSON.parse` error with the wrong shape?

Next lesson: [24. Lab: strict](24-lab-strict.md).
