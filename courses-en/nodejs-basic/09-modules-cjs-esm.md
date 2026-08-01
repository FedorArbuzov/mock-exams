# 09. CommonJS and ESM in Node.js

## A scenario from work

You cloned the internal npm package "shop-utils" and added the line `const { formatPrice } = require("./format.js")` to the BFF. CI on Node 22 fails: `ReferenceError: require is not defined`. `package.json` has `"type": "module"`, while half the repo is legacy `.cjs` from 2019. A colleague suggests "just add `"type": "commonjs"`", but then the labs with `import` break. In code review you're asked: "where's `__dirname` in ESM?" and "why write `node:fs` instead of `fs`?"

Node.js has **two** official module formats: **CommonJS (CJS)** — the historical standard with `require`/`module.exports`, and **ES modules (ESM)** — `import`/`export`, as in the browser and in [`javascript-basic`](../javascript-basic/30-es-modules.md). The mock-exams course uses ESM; you need to understand CJS to read others' code and npm dependencies.

## What you'll learn

- When Node chooses CJS or ESM for a file
- The `"type"` field in `package.json` and the `.mjs` / `.cjs` extensions
- How to import built-in modules with the `node:` prefix
- How to get `__dirname` and `__filename` in ESM via `import.meta.url`
- Interop: importing CJS from ESM and vice versa
- Common mistakes when mixing styles

---

## Two worlds: CJS and ESM

| | CommonJS | ES modules |
|---|----------|------------|
| Syntax | `require()`, `module.exports` | `import`, `export` |
| Loading | synchronous (historically) | asynchronous per the spec |
| `__dirname`, `__filename` | available globally | not available — need `import.meta.url` |
| Top-level await | no | yes (in `.js` with `"type": "module"`) |
| Default extension | `.js` with `"type": "commonjs"` | `.js` with `"type": "module"` |

**CommonJS — example:**

```javascript
// utils.cjs
function joinPath(...parts) {
  return parts.filter(Boolean).join("/");
}

module.exports = { joinPath };
module.exports.defaultVersion = "1.0";
```

```javascript
// main.cjs
const { joinPath } = require("./utils.cjs");
console.log(joinPath("data", "catalog.json"));
```

**ESM — example:**

```javascript
// utils.js (in a package with "type": "module")
export function joinPath(...parts) {
  return parts.filter(Boolean).join("/");
}

export const VERSION = "1.0";
```

```javascript
// main.js
import { joinPath, VERSION } from "./utils.js";
console.log(joinPath("data", "catalog.json"), VERSION);
```

---

## `package.json` and the `"type"` field

Node determines the format **by the nearest** `package.json` in the directory tree:

```json
{
  "name": "shop-bff-examples",
  "type": "module",
  "private": true
}
```

| Configuration | File `app.js` | File `legacy.cjs` | File `modern.mjs` |
|--------------|---------------|-------------------|-------------------|
| `"type": "module"` | ESM | CJS | ESM |
| `"type": "commonjs"` (default) | CJS | CJS | ESM |
| no field | CJS | CJS | ESM |

**Rule for the course:** in `courses/nodejs-basic/examples` — `"type": "module"`. All new `.js` files — only `import`/`export`.

Overriding for a single file:

- `config.cjs` — always CommonJS, even in an ESM package.
- `worker.mjs` — always ESM, even in a CJS package.

---

## The `node:` prefix for built-in modules

Node ships **built-in** modules: `fs`, `path`, `http`, `url`, `stream` and others. Since Node 14+ the explicit prefix is recommended:

```javascript
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
```

| Import | Why `node:` |
|--------|---------------|
| `node:fs` | unambiguously a built-in module, not the npm package `fs` |
| `node:fs/promises` | the Promise API over fs |
| `node:path` | cross-platform paths |
| `node:url` | `fileURLToPath`, `URL` |

Without the prefix, `import fs from "fs"` **still** works, but linters (eslint-plugin-n) and the Node documentation require `node:`. In mock-exams — **always** with the prefix.

---

## `__dirname` in ESM

In CommonJS:

```javascript
const path = require("node:path");
const dataFile = path.join(__dirname, "data", "products.json");
```

In ESM there are **no** global `__dirname` and `__filename`. The standard pattern:

```javascript
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataFile = join(__dirname, "data", "products.json");
```

`import.meta.url` is the URL of the current module, for example `file:///C:/Users/.../catalog.js`. `fileURLToPath` turns it into an OS path (important on Windows with `%20` and drive letters).

**Mistake:** hardcoding `"./data/products.json"` relative to the process's **cwd**, not the file. After `cd lab` the script looks in the wrong directory. Always anchor to `__dirname` or `import.meta.url`.

---

## Importing npm packages and CJS interop

ESM imports an npm package by name:

```javascript
import express from "express";
import { z } from "zod";
```

An old CJS package with `module.exports = fn`:

```javascript
import legacy from "some-old-package";
// default import = module.exports
```

A named import from CJS sometimes does **not** work — it depends on how the package is exported. Then:

```javascript
import pkg from "some-old-package";
const { namedFn } = pkg;
```

**Dynamic import** is the only way to `import()` in a CJS file and for conditional loading:

```javascript
async function loadPlugin(name) {
  const mod = await import(`./plugins/${name}.js`);
  return mod.default;
}
```

In an ESM package a static `import` must be at the top of the file (or top-level await); dynamic imports go inside functions.

---

## Mixing CJS and ESM in one project

A typical migration:

```text
project/
├── package.json          # "type": "module"
├── src/
│   ├── server.js         # ESM — new code
│   └── legacy/
│       └── parser.cjs    # CJS — not touching it yet
└── scripts/
    └── migrate-data.cjs  # a one-off script
```

From ESM you **cannot** call `require()` without `createRequire`:

```javascript
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const legacy = require("./legacy/parser.cjs");
```

Use it rarely — it's better to rewrite the module in ESM or wrap it in an async API.

---

## Link to previous lessons

| Lesson | Link |
|------|-------|
| [javascript-basic/30-es-modules](../javascript-basic/30-es-modules.md) | `import`/`export` syntax, `import.meta` |
| [08-async-io-patterns.md](08-async-io-patterns.md) | `import` from `node:fs/promises` |
| [10-fs-path.md](10-fs-path.md) | `__dirname` + `path.join` for the catalog JSON |

---

## Common mistakes

| Symptom | Cause | Fix |
|---------|---------|---------|
| `require is not defined` | an ESM file with `require` | `import` or `.cjs` |
| `ERR_MODULE_NOT_FOUND` | a path without `.js` in ESM | `./utils.js`, not `./utils` |
| `Cannot use import outside a module` | `import` in a CJS `.js` | `"type": "module"` or `.mjs` |
| Wrong path to JSON | cwd instead of `__dirname` | `fileURLToPath(import.meta.url)` |
| `Named export not found` | a CJS package without named exports | default import + destructuring |

---

## Summary

- Node supports **CJS** and **ESM**; the format is set by `"type"` in `package.json` and the `.cjs`/`.mjs` extension.
- The mock-exams course: **`"type": "module"`**, imports with the **`node:`** prefix.
- In ESM, **`__dirname`** is recovered via `import.meta.url` and `fileURLToPath`.
- Don't mix `require` and `import` in one `.js` without understanding interop.

## Checklist

- How does **CJS** differ from **ESM** in syntax and loading?
- What does `"type": "module"` in `package.json` do?
- Why write `import ... from "node:fs/promises"`?
- How do you get `__dirname` in an ESM file?
- Why does `import "./utils"` without `.js` fail in Node ESM?
- When do you need `createRequire`?

Next lesson: [10. `fs` and `path`](10-fs-path.md).
