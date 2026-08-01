# 30. ES modules: import / export

## A scenario from work

The file `utils.js` has grown to **2400 lines**: price formatting, the cart, config parsing, HTTP helpers. Code review: "split it into modules, otherwise we won't merge the MR". A colleague adds `require()` to a file with `"type": "module"` — CI fails with `ReferenceError: require is not defined`. In an interview: "how does a named export differ from a default?" and "what happens with a circular import?"

ES modules (ESM) are the **official** way to split a program into files with explicit dependencies. In Node with `"type": "module"` and in the browser with `<script type="module">` this is the standard for the course and all the following tracks (Node, React, TypeScript).

## Why modules and not a single file

| Monolith problem | Modules solution |
|-------------------|------------------|
| Unclear who depends on whom | `import` / `export` — the dependency graph is visible |
| Accidental global variables | Each file has its own scope |
| Hard to test a piece of logic | You import only the needed function |
| Name conflicts | Names are isolated, a conflict is resolved with an alias |

Modules also enable **strict mode** automatically — the same mode you saw in [02-variables-strict.md](02-variables-strict.md).

## A minimal example

`math.js` — export only:

```javascript
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export const PI = 3.141592653589793;
```

`main.js` — import and use:

```javascript
import { add, PI } from "./math.js";

console.log(add(2, 3)); // 5
console.log(PI);
```

Running from the `examples/` directory:

```bash
node main.js
```

**Important for Node:** the path `./math.js` with the **`.js` extension**. Without an extension, Node ESM gives `ERR_MODULE_NOT_FOUND`. In a bundler (Vite, webpack) the extension is often omitted, but the habit of writing `.js` saves you in plain Node.

## Named export

Several entities from one file — each with its **own name**:

```javascript
// validators.js
export function isEmail(value) {
  return typeof value === "string" && value.includes("@");
}

export function isPositiveNumber(n) {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

const internalRegex = /^[^@]+@[^@]+$/; // not exported — private to the file

export function isStrictEmail(value) {
  return isEmail(value) && internalRegex.test(value);
}
```

Import:

```javascript
import { isEmail, isPositiveNumber } from "./validators.js";

// alias on a name conflict
import { isEmail as checkEmail } from "./validators.js";

// everything into a namespace object
import * as validators from "./validators.js";
validators.isEmail("a@b.com");
```

| Syntax | When to use |
|-----------|-------------------|
| `import { x } from "./m.js"` | One or two entities, matching names |
| `import { x as y }` | Name conflict or readability |
| `import * as ns` | Many exports, rare calls |

**Refactoring rule:** named exports are easier to find with the IDE (`Find references`) and rename than default.

## Default export

One "main" export per file:

```javascript
// app.js
export default class App {
  constructor(name) {
    this.name = name;
  }

  run() {
    console.log(`App ${this.name} started`);
  }
}
```

Import — **without curly braces**, the name is arbitrary:

```javascript
import App from "./app.js";
import MyApplication from "./app.js"; // the same thing, a different local name

const app = new App("shop");
app.run();
```

A combination of default + named (allowed, but teams often avoid it):

```javascript
export default function createLogger() {
  return { log: console.log };
}

export const LOG_LEVEL = "info";
```

```javascript
import createLogger, { LOG_LEVEL } from "./logger.js";
```

| Named | Default |
|-------|---------|
| Many per file | One per file |
| Name fixed at export | Name arbitrary at import |
| Handy for utilities | Handy for "one class/function per file" |

## Re-export — the package's public API

The **barrel** pattern — an `index.js` file that assembles the outward API:

```javascript
// shop/index.js
export { Cart, CartItem } from "./cart.js";
export { loadProducts, filterByCategory } from "./catalog.js";
export { formatPrice } from "./format.js";

// internal helpers from ./internal.js are NOT re-exported
```

Consumer:

```javascript
import { Cart, formatPrice } from "./shop/index.js";
```

**Careful:** re-exporting everything (`export * from "./a.js"`) can accidentally expose internal functions and **worsen circular dependencies**. Export only what the client needs.

## Static vs dynamic import

**Static** — at the top of the file, analyzed before running:

```javascript
import { add } from "./math.js";
```

**Dynamic** — `import()` as a function, returns a Promise:

```javascript
async function loadLocale(lang) {
  const module = await import(`./locales/${lang}.js`);
  return module.default;
}

// conditional loading
if (process.env.DEBUG) {
  const { debugTools } = await import("./debug.js");
  debugTools.enable();
}
```

Uses:

- lazy loading of a heavy module;
- code splitting in a bundler;
- loading a plugin based on config.

In Node, dynamic import works in CommonJS files too (legacy); the static `import` — only in ESM.

## `import.meta`

Meta information about the **current** module:

```javascript
console.log(import.meta.url);
// file:///C:/Users/.../examples/lab/shop/index.js
```

In Node it's often needed for paths relative to the file:

```javascript
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataPath = join(__dirname, "data", "products.json");
const raw = await readFile(dataPath, "utf8");
const products = JSON.parse(raw);
```

In the browser `import.meta.url` is the module's URL; a bundler substitutes its own values.

## Top-level await

In ES modules you can `await` at the **top level** of a file (not inside a function):

```javascript
// config.js
const response = await fetch("https://example.com/config.json");
const config = await response.json();

export default config;
```

```javascript
// main.js
import config from "./config.js"; // main waits until config.js loads
console.log(config);
```

Limitation: a file with top-level await **blocks** the import chain until the Promise settles. For heavy initialization an explicit async `init()` function is sometimes better.

## `package.json` and ESM mode in Node

In `examples/package.json`:

```json
{
  "type": "module"
}
```

All `.js` in the package are treated as ESM. Alternatives:

| Approach | Files |
|--------|-------|
| `"type": "module"` | `.js` = ESM, `.cjs` = CommonJS |
| `"type": "commonjs"` (default) | `.js` = CJS, `.mjs` = ESM |
| No field | like commonjs |

The course uses `"type": "module"` — `import`/`export` without flags.

## CommonJS vs ESM

Legacy Node:

```javascript
// math.cjs
function add(a, b) {
  return a + b;
}
module.exports = { add };
```

```javascript
// main.cjs
const { add } = require("./math.cjs");
```

| | CommonJS | ESM |
|---|----------|-----|
| Syntax | `require`, `module.exports` | `import`, `export` |
| Loading | synchronous | asynchronous (by spec) |
| `this` at the top level | `module.exports` | `undefined` |
| Tree-shaking in a bundler | worse | better |
| Top-level await | no | yes (in modules) |

**Don't mix** `require` and `import` in one `.js` file without understanding interop. In new mock-exams code — ESM only.

Importing CommonJS from ESM in Node:

```javascript
import pkg from "legacy-package"; // default = module.exports
```

## Circular imports

```text
a.js  ──imports──►  b.js
  ▲                    │
  └──────imports───────┘
```

`a.js`:

```javascript
import { bFn } from "./b.js";
export function aFn() {
  return "a" + bFn();
}
```

`b.js`:

```javascript
import { aFn } from "./a.js";
export function bFn() {
  return "b";
}
export function useA() {
  return aFn(); // may work if the call is AFTER initialization
}
```

At load time, exports from a "not-yet-fully-executed" module may be **`undefined`**. Remedies:

1. Move the shared code into a **third** module `shared.js`.
2. Don't call a neighbor's functions at the **top level** during import.
3. Pass dependencies as an argument (dependency injection) rather than via import.

Smell: two files importing each other — almost always a reason to refactor.

## Modules in the browser

```html
<script type="module" src="./main.js"></script>
```

Differences from a regular `<script>`:

- defer by default;
- strict mode;
- CORS: a file from another origin without headers — an error;
- relative paths `./utils.js` are required.

```html
<!-- won't work as a module -->
<script src="./utils.js"></script>
<script>
  import { x } from "./utils.js"; // SyntaxError in inline without type=module
</script>
```

For `fetch` to the API — [29-fetch.md](29-fetch.md); CORS — [`api-design`](../api-design/README.md).

## JSON and static import

Node (17+) and modern bundlers:

```javascript
import products from "./data/products.json" with { type: "json" };
// or legacy syntax: assert { type: "json" }
```

An alternative without import attributes — `readFile` + `JSON.parse` (see the lab [31-lab-modules.md](31-lab-modules.md)).

## Relation to previous lessons

| Lesson | Relationship |
|------|-------|
| [12-closures.md](12-closures.md) | IIFE modules before ESM |
| [22-lab-oop.md](22-lab-oop.md) | `Cart`, `CartItem` — you'll split into files |
| [27-async-await.md](27-async-await.md) | top-level await, dynamic import |
| [29-fetch.md](29-fetch.md) | `api.js` as a separate module |

## Common mistakes

- **Forgot `.js` in the path** — `ERR_MODULE_NOT_FOUND` in Node.
- **`require` in an ESM file** — `ReferenceError: require is not defined`.
- **Default + named confusion** — `import { App }` instead of `import App` for a default.
- **Circular import + a call at the top level** — `TypeError: fn is not a function`.
- **A barrel exporting everything** — a slow build, hidden cycles.
- **Mutation of an exported object** — `export const state = {}` can be changed from outside; for constancy, export functions or freeze.

## Checklist

- How does a **named export** differ from a **default**?
- Why write `./math.js` with the extension in Node ESM?
- What does `import.meta.url` return and how do you get `__dirname`?
- What is a **dynamic** `import()` and when do you need it?
- Why are circular imports dangerous at initialization time?
- Which `package.json` field enables ESM for all `.js`?

Next lesson: [31. Lab: modules](31-lab-modules.md).
