# 01. Landscape: TypeScript, JavaScript and compilation

## Intro: a scenario from work

Sprint planning. Product: «Let's rewrite checkout in TypeScript — fewer bugs». The backend on FastAPI `:8090` already serves OpenAPI; the frontend on React with `.tsx`. A junior asks: «Is TypeScript a new language? Do I need a separate browser?» The senior answers: «It's JS with type checking at build time». An hour later in Slack: «I still get `undefined is not a function` at runtime» — because the types were **erased** during compilation, while the logic bug remained.

In code review you see `// @ts-ignore` on the line with `price` from the API. In [`javascript-basic/04-primitives`](../javascript-basic/04-primitives.md) you already caught `price` coming in as a string from a form; TypeScript should have stopped this **before** merge. The reviewer refers to **structural typing**: «An object with a `title` field fits where a `Product` is expected — and that's a feature, not a bug».

Without a map of the landscape people confuse the **language**, the **compiler**, the **type system** and the **bundler** (Vite, esbuild). In the Python track of mock-exams you distinguished the Python runtime from mypy's static hints ([`fastapi/04-pydantic`](../fastapi/04-pydantic-v2.md)); here — the TypeScript compiler versus what V8 actually executes.

## What you'll learn

- How **TypeScript** differs from **JavaScript** (a superset, not a runtime replacement).
- The **compile pipeline** chain: `.ts` → AST → type checking → emit `.js`.
- Why types **disappear** at runtime and what follows from that.
- An overview of **structural typing** (duck typing) vs nominal typing in other languages.
- Where this course sits after [`javascript-basic`](../javascript-basic/README.md) and before `nodejs-basic`.
- The relation to the shop domain and FastAPI contracts on **:8090**.

## JavaScript and TypeScript: one runtime, two stages

**JavaScript** — a language executed by an **engine** (V8 in Node and Chrome). **TypeScript** — a **superset** of JS syntax: the same `const`, `async/await`, `fetch`, plus type annotations, `interface`, `enum`, generics.

```typescript
// product.ts — TypeScript
interface Product {
  id: number;
  title: string;
  price: number;
}

const item: Product = {
  id: 1,
  title: "Keyboard",
  price: 79.99,
};
```

After `tsc`, `product.js` keeps roughly:

```javascript
const item = {
  id: 1,
  title: "Keyboard",
  price: 79.99,
};
```

**The `Product` interface does not exist at runtime.** There is no `instanceof Product`. The check happens only at compile time (and in the IDE). Analogy: a Pydantic model in FastAPI validates at the HTTP input; TS validates at the **compiler** input — but does not replace runtime validation of external JSON (Zod later handles that).

| Question | JavaScript | TypeScript |
|--------|------------|------------|
| Who runs the code? | Node / browser | The same Node / browser |
| Where are the types? | Dynamically in your head and tests | Statically + emitted JS |
| Is a build needed? | Optional (esbuild) | Yes, `tsc` or a bundler with TS |
| Error `price: string` | At runtime during calculation | TS2322 during `tsc` |

## The compilation pipeline

```text
Sources .ts / .tsx
        │
        ▼
   Parser → AST (shared with JS + TS nodes)
        │
        ├── Type checking (type checker)
        │         │
        │         ├── errors → exit code ≠ 0 (CI fail)
        │         └── OK
        ▼
   Emit JavaScript (.js / .mjs)
        │
        ▼
   Node / browser (V8) — JS only
```

Tools along the way:

| Tool | Role |
|------------|------|
| **tsc** | The official compiler; typecheck + emit |
| **esbuild / swc** | Fast transpile; types often separate via `tsc --noEmit` |
| **Vite** | Dev server + bundling for react-basic |
| **IDE (TS language service)** | The same rules as `tsc`, in real time |

In mock-exams **nodejs-basic** it's often: `tsc` for types, **tsx** for dev, **esbuild** for the prod bundle. For typescript-basic, **`tsc`** from [00-environment.md](00-environment.md) is enough.

## What TypeScript catches — and what it doesn't

**Catches (compile-time):**

```typescript
function lineTotal(price: number, qty: number): number {
  return price * qty;
}

lineTotal("79.99", 2); // TS2345: string is not number
```

**Does not catch without extra effort:**

```typescript
const data = JSON.parse('{"price":"79.99"}') as { price: number };
lineTotal(data.price, 1); // compiles; at runtime price is a string
```

`JSON.parse` returns **`any`** or an imprecise type — a classic hole. The backend on `:8090` with Pydantic serves correct types in JSON, but the **network boundary** still requires validation (Zod, manual guards) — topics of later chapters.

**Logic errors:**

```typescript
function discount(price: number, percent: number): number {
  return price - percent; // TS is happy; the business logic is wrong
}
```

TS does not replace tests and code review — it complements them, like mypy for Python.

## Structural typing

TypeScript compares types **by the shape** of their fields, not by class name:

```typescript
type Product = { id: number; title: string; price: number };

function printProduct(p: Product): void {
  console.log(p.title, p.price);
}

const fromApi = {
  id: 42,
  title: "Mouse",
  price: 29.99,
  inStock: true, // extra field — OK on assignment
};

printProduct(fromApi); // OK — has the required fields
```

An object **with additional** properties is compatible where a **smaller** type is expected (the **excess property check** rule fires on **literal** assignment, not always through a variable — a nuance in [07-interfaces-objects.md](07-interfaces-objects.md)).

Compared to **nominal** typing (Java, C#): there `class USD` and `class EUR` are different types even with the same `number` inside. In TS, without branded types, `type UserId = number` and `type OrderId = number` are **interchangeable** — covered in advanced patterns.

For integration with FastAPI this is convenient: an API response with fields `id`, `title`, `price` **structurally** fits your `interface Item` without codegen — until the contract drifts apart.

## Versions and ECMAScript compatibility

TypeScript **does not fix** the JS version — it's set by `target` in `tsconfig`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"]
  }
}
```

New JS features (optional chaining, `??`) come first to ECMAScript, then to TS as syntax. TS 5.x supports modern JS from [`javascript-basic/01-landscape`](../javascript-basic/01-landscape.md). The **Node version** in CI must understand the **emit** (ES2022 on Node 20+ is fine).

## The mock-exams ecosystem

```text
javascript-basic  →  typescript-basic  →  nodejs-basic  →  react-basic
       │                    │                  │
       └────────────────────┴──────────────────┴── shop API FastAPI :8090
```

| Layer | Course | Role of types |
|------|------|------------|
| JS language | javascript-basic | `typeof`, dynamics |
| Static | **typescript-basic** | interfaces, unions, narrowing |
| Server | nodejs-basic | typed routes, env, client to :8090 |
| UI | react-basic | `.tsx`, props types |

For now — **without React and Express**. Only the compiler, types and local shop models (product, status, catalog).

## TypeScript vs JSDoc vs Zod (overview)

| Approach | When |
|--------|-------|
| **`.ts` annotations** | new code, this course |
| **JSDoc `@param`** | gradual migration of `.js` |
| **Zod / Valibot** | runtime parse of JSON from :8090 |
| **OpenAPI codegen** | client from the FastAPI spec |

Pydantic on the backend and TypeScript on the BFF are a **mirror** discipline of contracts; drift is caught by integration tests against `:8090`.

## How this connects to the course

| Lesson | Relation |
|------|-------|
| [00. Environment](00-environment.md) | `tsc`, tsconfig |
| [02. Annotations and inference](02-annotations-inference.md) | first type practice |
| [07. Interfaces](07-interfaces-objects.md) | structural typing in depth |
| [08. Narrowing](08-narrowing.md) | narrowing after `JSON.parse` |
| [`javascript-basic/01`](../javascript-basic/01-landscape.md) | JS vs ECMAScript vs TS |
| [`fastapi/01-landscape`](../fastapi/01-landscape.md) | parallel to the backend stack |

## Common mistakes in understanding

**«TypeScript = safe JavaScript».** Safer at development time; the runtime is the same JS. `as`, `any`, wrong trust in the API — holes.

**«You have to learn a second language from scratch».** 95% of the syntax is your JS from javascript-basic; types and `interface` were added.

**«tsc optimizes code like Rust».** The main work is **type checking** and **transpile**; minification is the bundler's job.

**«An interface exists at runtime».** No — only in dev and in `.d.ts` for libraries.

**«Structural typing = any object is always OK».** Excess property checks, exactOptionalPropertyTypes — there are limits.

**«You can skip TS and go straight to React».** In the mock-exams branch, react-basic assumes typescript-basic.

## Summary

TypeScript is a **superset over JavaScript**: the compiler checks types and emits JS for V8. Types are **erased** at runtime; network boundaries and logic are a separate responsibility. **Structural typing** matches objects by fields — natural for a JSON shop API. The course comes after javascript-basic and prepares the typed layer before the Node BFF to **:8090**.

## Checklist

- [ ] Explain in one sentence: TS vs JS vs the Node runtime
- [ ] Draw the chain `.ts` → tsc → `.js` → node
- [ ] Why does `interface Product` not work with `instanceof`?
- [ ] What is structural typing, using the `fromApi` example with an extra field
- [ ] Name one thing that TS does **not** catch
- [ ] Where is typescript-basic in the [`javascript-path`](../javascript-path.md) scheme

Next lesson: [02. Annotations and type inference](02-annotations-inference.md).
