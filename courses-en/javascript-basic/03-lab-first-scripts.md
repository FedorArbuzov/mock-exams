# 03. Lab: first scripts

## Why this lab

The theory in [00–02](00-environment.md) gave you the map: Node, `let`/`const`, strict mode, the first `console.log`. The **lab** turns this into **muscle memory**. At work and in CI you don't read the chapter about variables — you open `scripts/reindex-catalog.js`, run `node scripts/reindex-catalog.js`, look at stdout/stderr, fix, and commit. The same loop as a smoke test of [`deploy/fastapi`](../../deploy/fastapi/README.md) or the bash labs in [`linux-basic`](../linux-basic/02-lab-shell.md), only the runtime is V8.

The goal of the lab is **not** "learn the syntax from a task list." The goal is to get used to:

1. **A file as the unit of work** — versioned in git, reviewable, reproducible.
2. **The terminal as the source of truth** — output doesn't "flash" like a Windows Explorer window.
3. **Errors as learning material** — `ReferenceError`, a strange `"23"`, `var` vs `let` — you **see** them hands-on before production.

The **shop** domain (products, prices) shows up later in [09-lab-objects-arrays.md](09-lab-objects-arrays.md) and on `:8090`. Here — neutral numbers and names, but the same habits you'll need for a BFF to FastAPI.

## Prerequisites

- Node **LTS 20+** installed, terminal restarted after installation.
- Read [00. Environment](00-environment.md) and [02. Variables](02-variables-strict.md).
- You are in the **`courses/javascript-basic/examples/`** directory (not the repo root).

```bash
cd courses/javascript-basic/examples
node --version
```

[`package.json`](examples/package.json) specifies `"type": "module"`. This lab only needs plain `.js` files without `import` — but the directory is already ready for [30-es-modules.md](30-es-modules.md).

Reference solutions — [`examples/solutions/`](examples/solutions/) — open them **only after** your own attempt and a short stall (5–15 minutes).

---

## Task 1. Hello and the Node version

**Context:** in a CI pipeline the first step is often `node --version`, to avoid running migrations on Node 16. A local script duplicates this check for the logs.

Create `lab/01-hello.js`:

```javascript
console.log("Hello from lab 01");
console.log("Node version:", process.version);
console.log("Platform:", process.platform);
```

```bash
node lab/01-hello.js
```

**Success criterion:** three lines with no errors. `process.platform` is `win32`, `linux`, or `darwin`; useful in "can't reproduce" tickets.

---

## Task 2. Variables and template strings

**Context:** generating an invoice label in the shop — `firstName`, `lastName`, a template string instead of concatenating with `+` (fewer coercion surprises from [05-coercion-comparison.md](05-coercion-comparison.md)).

In `lab/02-variables.js`:

1. Declare `const firstName` and `const lastName`.
2. Build `fullName` via a **template literal** `` `${firstName} ${lastName}` ``.
3. Print on one line: `fullName`, `typeof fullName`, `typeof null`, `typeof undefined`.

**Example output:**

```text
Ann Smith
string object undefined
```

Hint: `typeof null === "object"` is a historical bug; note in a comment in one phrase "why it's like this."

---

## Task 3. Blocks and `let`

**Context:** deferred tasks (retry, analytics batch) in Node are queued with `setTimeout` / a queue. One loop variable for all callbacks is the classic `var` bug.

In `lab/03-blocks.js`:

```javascript
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log("tick", i), 10);
}
```

Run it. Then **intentionally** replace `let` with `var` and run again.

**In a comment in the file** (2–4 sentences): what the output is with `let`, what it is with `var`, and why (scope + closure — a preview of [12-closures.md](12-closures.md)).

---

## Task 4. A mini calculator and coercion

**Context:** the quantity from a form arrives as the string `"2"` — without `Number()`, addition glues values together.

`lab/04-calc.js`:

```javascript
function add(a, b) {
  return a + b;
}

console.log("2 + 3 =", add(2, 3));
console.log('"2" + 3 =', add("2", 3));
```

**In a comment:** why the second call gives `"23"`, not `5`. Mention the `+` and string rule from [05-coercion-comparison.md](05-coercion-comparison.md).

Optional: add `addStrict(a, b)` with `Number(a) + Number(b)` and a third `console.log` for `"2"` and `3`.

---

## Task 5. REPL and floats

**Context:** the sum of shop line items doesn't add up to the cent — IEEE 754 ([04-primitives.md](04-primitives.md)).

In the `node` terminal (REPL), without a file:

```javascript
const a = 0.1 + 0.2;
a === 0.3;
Math.abs(a - 0.3) < Number.EPSILON;
```

Write the results in a comment at the top of `lab/05-float.js`. On one line:

```javascript
console.log(a.toFixed(20));
```

**Success criterion:** you see `0.30000000000000004` (or similar) and understand why `=== 0.3` is false.

---

## Success criteria

- [ ] All files `01`–`05` run: `node lab/….js` from `examples/`
- [ ] `03-blocks.js` has a comment about `var` vs `let`
- [ ] `04-calc.js` explains the behavior of `"2" + 3`
- [ ] You understand why logging `process.version` in CI matters
- [ ] You used the REPL at least for task 5

## If something went wrong

| Symptom | Check |
|---------|----------|
| `Cannot find module` | Are you in `examples/`? Path `lab/01-hello.js` |
| `SyntaxError: Unexpected token` | UTF-8, quotes `"`/`'` paired, not "smart" ones from Word |
| Empty output from `setTimeout` | Wait ~50 ms; Node won't exit while timers are in the event loop |
| `ReferenceError: process is not defined` | Running in a browser, not Node — use the terminal |
| Cyrillic in the path breaks Node | Move the repo to an ASCII path or update Node |

## Course connection

| Next step | Why |
|--------------|-------|
| [04. Primitives](04-primitives.md) | typeof, number, float |
| [05. Coercion](05-coercion-comparison.md) | deeper dive into `+` and `===` |
| [06. Lab: types](06-lab-types.md) | predicting output before running |

Next lesson (theory): [04. Primitive types](04-primitives.md).
