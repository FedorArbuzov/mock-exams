# 28. Async types: `Promise`, async functions

## Scenario from work

Code review of an async handler in a Node BFF:

```typescript
async function loadCatalog(): Promise<Item[]> { ... }
```

A colleague wrote `async function loadCatalog(): Item[]` — does TypeScript stay silent? No — it's an error: async **always** returns a Promise. In a second case you forgot `await store.save()` — the type is `Promise<void>`, the linter didn't catch it, and the data wasn't saved. In a generic `retry<T>` you forgot `await` inside — and returned `Promise<Promise<T>>`.

Async in TypeScript is the same Promises as in [javascript-basic/26-promises.md](../javascript-basic/26-promises.md); performance and the event loop are in [javascript-basic/27-async-await.md](../javascript-basic/27-async-await.md), but with **explicit** types at the boundaries.

## What you'll learn

- The `Promise<T>` type and what an `async function` returns
- Return type annotations for async
- The `Awaited<T>` utility type
- Typing `then` / `catch` / `finally`
- `Promise.all`, `allSettled`, `race` with generics
- Async iterators (overview)
- Common mistakes with a double Promise

---

## `Promise<T>`

```typescript
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchText(url: string): Promise<string> {
  return fetch(url).then((r) => r.text());
}
```

The generic parameter is the type of the **fulfilled value**, not Response and not Error.

---

## Async function return types

```typescript
async function getItem(id: number): Promise<Item> {
  const res = await fetch(`http://localhost:8090/api/v1/items/${id}`);
  const json: unknown = await res.json();
  return ItemSchema.parse(json);
}
```

**Rule:** if a function is `async`, the return type is **almost always** `Promise<...>`.

```typescript
// TS1064 error:
async function bad(): Item {
  return { id: 1, name: "x", price: 0, description: null };
}
// It actually returns Promise<Item>
```

You can omit the annotation — TS will infer `Promise<Item>`. An explicit annotation on the **public API** improves error messages.

### Sync throw vs async reject

```typescript
async function load(): Promise<Task[]> {
  throw new Error("disk full"); // → rejected Promise
  return [];
}
```

The type is the same: `Promise<Task[]>`.

---

## `Awaited<T>`

Recursively "unwraps" a Promise (TS 4.5+):

```typescript
type A = Awaited<Promise<string>>;           // string
type B = Awaited<Promise<Promise<number>>>;  // number
type C = Awaited<string | Promise<string>>;  // string
```

Useful in generic utilities:

```typescript
async function retry<T>(
  fn: () => Promise<T>,
  attempts = 3
): Promise<T> {
  // ...
}
type Result = Awaited<ReturnType<typeof loadCatalog>>;
```

---

## Thenable and union with Promise

```typescript
type MaybePromise<T> = T | Promise<T>;

async function ensure<T>(value: MaybePromise<T>): Promise<T> {
  return await value;
}
```

---

## Promise combinators

```typescript
const [health, items] = await Promise.all([
  getHealth(),
  listItems(),
] as const);
// health: Health, items: Item[] — a tuple needs as const or an overload
```

Typing `Promise.all`:

```typescript
function all<T extends readonly unknown[] | []>(
  values: T
): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }>;
```

`Promise.allSettled` — an array of `{ status: 'fulfilled' | 'rejected', ... }`.

`Promise.race` — the union type of the array's elements.

---

## Catch and unknown

```typescript
async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    await writeFile(path, JSON.stringify(tasks, null, 2));
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(`Save failed: ${err.message}`);
    }
    throw err;
  }
}
```

Don't type `catch (err: any)`.

---

## Async arrows and methods

```typescript
class TaskStore {
  async load(path: string): Promise<void> { ... }

  save = async (): Promise<void> => { ... }; // lexical this
}
```

The return type of class methods — explicitly `Promise<...>`.

---

## Double Promise anti-pattern

```typescript
// Bad:
async function wrap(): Promise<Promise<Item>> {
  return fetchItem(1); // forgot await — but does async wrap it again?
}
// Actually async + return Promise → flattens to Promise<Item>
```

```typescript
// Bad in a generic helper:
function identity<T>(x: T): T {
  return x;
}
const p = identity(Promise.resolve(1)); // T inferred as Promise<number>
```

An explicit `await` inside async usually flattens. The problem is more often a **forgotten await** at the caller:

```typescript
store.save(); // Promise<void> ignored — floating promise
void store.save(); // explicitly fire-and-forget
await store.save();
```

ESLint `@typescript-eslint/no-floating-promises` — [31-tooling-migration.md](31-tooling-migration.md).

---

## Async generators (overview)

```typescript
async function* readLines(path: string): AsyncGenerator<string, void, void> {
  // ...
}

for await (const line of readLines("data.log")) {
  console.log(line);
}
```

Node streams + `Readable`/`AsyncIterable` — more in **nodejs-intermediate**.

---

## Typing a callback API into a Promise

```typescript
function readJsonFile(path: string): Promise<unknown> {
  return readFile(path, "utf-8").then(
    (text) => JSON.parse(text) as unknown
  );
}
```

After the parse — Zod ([26-zod-basics.md](26-zod-basics.md)).

---

## Related courses

- JS Promises: [javascript-basic/26-promises.md](../javascript-basic/26-promises.md)
- async/await: [javascript-basic/27-async-await.md](../javascript-basic/27-async-await.md)
- Async lab: [javascript-basic/28-lab-async.md](../javascript-basic/28-lab-async.md)
- Typed fetch: [29-fetch-typed.md](29-fetch-typed.md)
- TaskStore save/load: [24-lab-strict.md](24-lab-strict.md), [33-capstone.md](33-capstone.md)

---

## Common mistakes

1. **A return type without Promise on an async function** — TS1064.

2. **A floating promise** — an un-awaited save/load.

3. **`map(async () => ...)` without Promise.all** — an array of Promises.

4. **`catch (e: any)`** — you lose strict catch.

5. **The type `Promise<Response>` instead of the data** — forgot json()+parse.

6. **A union T | Promise<T> without await** — the branches behave differently.

---

## Summary

Async functions return `Promise<T>`. Annotate the public API as `Promise<...>`. `Awaited` unwraps nested Promises. Combinators preserve generics with the right tuples. At the async I/O boundary — `unknown` + Zod. Control floating promises via await or void + lint.

---

## Checklist

- What is the return type of `async function f(): Promise<number>` vs a forgotten Promise?
- What does `Awaited<Promise<Promise<T>>>` do?
- Why is `store.save()` without await dangerous?
- What is the result type of `Promise.all([a(), b()])`?
- A reject in async — an exception or a return?

Next lesson: [29. Typed fetch](29-fetch-typed.md).
