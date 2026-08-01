# 03. Lab: your first TypeScript files

## Why this lab

The theory in [00–02](00-environment.md) gave you `tsc`, `tsconfig` and annotation rules. The **lab** turns this into muscle memory: open a `.ts`, see **TSxxxx** in the terminal, fix it, run `tsc` again. At work and in CI you don't read the chapter on inference — you fix `error TS2322` in `scripts/sync-catalog.ts` before deploying the BFF to FastAPI **:8090**.

The goal is to get used to:

1. **`.ts` as the unit of work** — next to the future `.js` in `dist/` or emitted alongside.
2. **A compiler error as study material** — not `@ts-ignore` on day one.
3. **The difference between `tsc` and `tsx`** — as in [00-environment.md](00-environment.md).

The shop domain will appear later ([06-lab-unions.md](06-lab-unions.md)); here — neutral names and ports, but the same habits as in [`javascript-basic/03-lab-first-scripts`](../javascript-basic/03-lab-first-scripts.md).

## Prerequisites

- Read [00](00-environment.md) and [02](02-annotations-inference.md).
- Directory: `courses/typescript-basic/examples/`.
- `npm install` done (typescript, tsx).

```bash
cd courses/typescript-basic/examples
npx tsc --version
```

Reference solutions — `solutions/` — only **after** your own attempt.

---

## Task 1. Hello TypeScript

**Context:** a smoke script in CI before integration tests against `:8090`.

Create `lab/01-hello.ts`:

```typescript
const message: string = "Hello from TypeScript lab 01";
const apiPort: number = 8090;

console.log(message);
console.log("FastAPI stand port:", apiPort);
console.log("Node:", process.version);
```

```bash
npx tsc lab/01-hello.ts --outDir dist
node dist/lab/01-hello.js
```

Or with a shared `tsconfig`: `npx tsc` and `node dist/lab/01-hello.js`.

**Success criteria:** three lines with no runtime errors.

---

## Task 2. An intentional type error

**Context:** the reviewer catches a port type mismatch before merge.

In `lab/02-type-error.ts`, **first** write code with an error:

```typescript
const port: number = "8090";
console.log(port);
```

Run `npx tsc lab/02-type-error.ts`. Copy the **full text** of `TS2322` (or equivalent) into a comment in the file.

Fix it: `const port: number = 8090;` or `Number("8090")` with a comment on when a string from env is acceptable.

Rebuild — **exit code 0**.

---

## Task 3. Inference vs annotation

`lab/03-inference.ts`:

1. `const shopName = "Mock Shop";` — **without** an annotation; hover the cursor in the IDE — what's the type?
2. `const prices = [79.99, 29.99];` — the array type?
3. Function `double(n: number): number { return n * 2; }` — call it with `double(21)`.
4. Add the line `double("21");` — record the error code in a comment, then **comment out** the line.

```bash
npx tsx lab/03-inference.ts
```

---

## Task 4. A function with a contract

**Context:** a price-formatting utility for BFF logs (before the React UI).

`lab/04-format-price.ts`:

```typescript
function formatPrice(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`;
}

console.log(formatPrice(79.99, "USD"));
// TODO: uncomment one at a time and record the TS error:
// console.log(formatPrice("79.99", "USD"));
// console.log(formatPrice(79.99));
```

**Success criteria:** a working call; in the comment — two errors for the invalid calls.

---

## Task 5. The `any` trap

`lab/05-any-trap.ts`:

```typescript
function parseConfig(raw: string): any {
  return JSON.parse(raw);
}

const cfg = parseConfig('{"port":"8090"}');
const port: number = cfg.port; // compiles!
console.log("Port + 1 =", port + 1);
```

Run it via `tsx`. **In a comment:** what `port + 1` prints and why (connection to [`javascript-basic/05-coercion`](../javascript-basic/05-coercion-comparison.md)).

Rewrite the return to `unknown` and show that `cfg.port` without narrowing is a **TS error**. Leave the `console.log` line commented out for now — narrowing is in [08-narrowing.md](08-narrowing.md).

---

## Success criteria

- [ ] `01-hello` builds and runs
- [ ] `02-type-error` has the TS error text before the fix
- [ ] `03-inference` — TS2345 documented for `double("21")`
- [ ] `04-format-price` — two call-error types described
- [ ] `05-any-trap` — runtime behavior explained and switch to `unknown`

## If something went wrong

| Symptom | Check |
|---------|----------|
| `Cannot find module` | Are you in `examples/`? Path `lab/01-hello.ts` |
| `tsc` doesn't create `dist/` | `--outDir dist` or `outDir` in tsconfig |
| `node lab/01-hello.ts` fails | Node doesn't run TS — `tsc` or `tsx` first |
| No errors on `port: number = "8090"` | `strict` is off — turn it on in tsconfig |
| IDE and `tsc` disagree | Workspace TypeScript version |

## Related courses

| Next | Why |
|--------|-------|
| [04. Primitives and literals](04-primitives-literals.md) | literal types |
| [08. Narrowing](08-narrowing.md) | safe `unknown` |
| [`javascript-basic/03`](../javascript-basic/03-lab-first-scripts.md) | the same «file → run» cycle |

Next lesson (theory): [04. Primitives and literal types](04-primitives-literals.md).
