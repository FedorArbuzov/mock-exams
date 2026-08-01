# 00. Environment: TypeScript, tsc, editor

## Intro: a scenario from work

Monday, 10:15 AM. You've finished [`javascript-basic`](../javascript-basic/README.md) and open your first `.ts` file in shop-BFF. CI fails: `error TS2307: Cannot find module './types'`. Locally in VS Code everything's green — turns out you were running **tsx** directly, while the pipeline calls **`tsc --noEmit`** and **`node dist/index.js`**. A colleague writes: "I get `tsc: command not found`" — TypeScript is installed globally on one machine and only in `devDependencies` on another. A third developer swears "the types don't work," but really just saved a file as `script.js` instead of `script.ts`.

Three symptoms, one cause: **the TypeScript environment isn't set up and pinned**. In [`javascript-basic/00-environment`](../javascript-basic/00-environment.md) you learned to check `node --version` and run scripts from `examples/`. Here we add the chain **`.ts` → compiler → `.js` → `node`**, plus an editor that highlights errors **before** you run anything.

In mock-exams the backend lives in Docker ([`deploy/fastapi`](../../deploy/fastapi/README.md), port **8090**), but **typescript-basic** — like javascript-basic — runs **on the host**: one terminal, the `examples/` directory, no containers. Later, [`nodejs-basic`](../javascript-path.md) will build a typed BFF against that same shop API; for now you're building the habit: **compile, read the TS errors, don't ignore red squiggles in the IDE**.

## What you'll learn

- Why TypeScript exists **on top of** the JavaScript you already know.
- Installing **TypeScript** via `npm` (locally in the project, not just globally).
- The **`tsc`**, **`tsx`** / ts-node commands — when to use which.
- A minimal **`tsconfig.json`** for the course labs.
- The **`examples/`** structure and the **write → tsc → node** cycle.
- Setting up **VS Code / Cursor** for TypeScript without overloading it.

## Prerequisites

The **typescript-basic** course comes **right after** [`javascript-basic`](../javascript-basic/README.md). Expected:

- Node.js **LTS 20+** (18 minimum), `node --version` with no surprises.
- Comfort with `let`/`const`, functions, objects, ES modules ([`30-es-modules`](../javascript-basic/30-es-modules.md)).
- The `courses/javascript-basic/examples/` directory — you already know how to `cd` there and run `node lab/….js`.

If your JavaScript is still shaky, go back to [02–07](../javascript-basic/02-variables-strict.md) in javascript-basic first, then come here.

## Installing TypeScript in a project

TypeScript is an **npm package** with the `tsc` CLI. A **local** install in `examples/` is recommended:

```bash
cd courses/typescript-basic/examples
npm init -y
npm install --save-dev typescript
npx tsc --version
```

| Approach | Pro | Con |
|--------|------|-------|
| `devDependencies` in the project | one version for the whole team and CI | needs `npx tsc` |
| `npm install -g typescript` | short `tsc` command | versions drift between machines |
| `npx typescript@5 tsc` | one-off version | slower in CI |

In GitLab CI, per [`gitlab-basic`](../gitlab-basic/README.md), it's written out explicitly:

```bash
npm ci
npx tsc --noEmit
```

That way "works on my machine" can't diverge from the pipeline.

## First file and compilation

Create `examples/hello.ts`:

```typescript
// hello.ts — first TypeScript file in the course
const shopApiBase = "http://localhost:8090/api/v1";
const greeting: string = "Hello, TypeScript!";

console.log(greeting);
console.log("Shop API:", shopApiBase);
console.log("Node:", process.version);
```

Compile and run it:

```bash
npx tsc hello.ts
node hello.js
```

**What happened:** `tsc` read the `.ts` file, checked the types, and generated **`hello.js`** (plain JavaScript for Node). Node **doesn't understand** the `: string` annotation — the compiler ate it.

A type error **before** you even run anything:

```typescript
const port: number = "8090"; // error TS2322: Type 'string' is not assignable to type 'number'
```

`tsc` exits with a non-zero code — in CI that blocks the merge. In plain JavaScript, the same bug would only surface at runtime when you did `port + 1`.

## tsconfig.json for the course

One file for the whole `examples/` directory:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": ".",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

Run it:

```bash
npx tsc
node dist/hello.js
```

| Option | Why it matters for the course |
|-------|----------------|
| `strict: true` | catches `null`, implicit `any`, extra fields |
| `module: NodeNext` | matches `"type": "module"` in package.json |
| `outDir: dist` | keeps `.ts` sources separate from `.js` build artifacts |
| `target: ES2022` | matches Node 20+ from javascript-basic |

We'll go deep on `strict` and all the flags in later chapters; for now **don't turn `strict` off** just "to make it green."

## tsx and ts-node: running without manual tsc

For **labs**, a **one-step** run is more convenient:

```bash
npm install --save-dev tsx
npx tsx lab/03-first.ts
```

**tsx** (or the older **ts-node**) compiles in memory and runs immediately. In **production** and CI, mock-exams prefers an explicit `tsc` → `node dist/` — a reproducible artifact, the same idea as a wheel/sdist in the Python track.

| Scenario | Tool |
|----------|------------|
| Quick lab, REPL-like loop | `tsx lab/file.ts` |
| CI, deployment, code review diff | `tsc` + `node dist/` |
| Type checking only, no emit | `tsc --noEmit` |

## package.json and ES modules

```json
{
  "name": "typescript-basic-labs",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "lab": "tsx"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "tsx": "^4.19.0"
  }
}
```

The **`"type": "module"`** field — same as in [`javascript-basic/examples`](../javascript-basic/examples/package.json) — means `import`/`export` in both the `.ts` and the generated `.js`. The `node:` prefix for built-in modules still applies.

## Course directory structure

```text
courses/typescript-basic/
├── README.md
├── 00-environment.md … (this course)
├── interview-cheatsheet.md   # later
└── examples/
    ├── package.json
    ├── tsconfig.json
    ├── lab/              # your solutions
    ├── solutions/        # reference answers — check after your own attempt
    └── dist/             # generated JS (in .gitignore)
```

Move into `examples/` and double check the path:

```bash
cd courses/typescript-basic/examples
node --version
npx tsc --version
```

Always run things **from `examples/`** — otherwise `tsconfig.json` and relative imports like `lab/data/…` won't resolve. Same discipline as in [javascript-basic/00](../javascript-basic/00-environment.md).

## VS Code / Cursor

Built-in TypeScript support is enough (the language server ships with the editor):

| Setting / action | Why |
|---------------------|-------|
| Open the `examples/` folder as workspace root | `tsconfig` gets picked up automatically |
| Problems panel (Ctrl+Shift+M) | list of TS errors without running `tsc` in the terminal |
| "TypeScript: Go to Source Definition" | jump into the built-in `.d.ts` types |
| Format on save + Prettier | consistent style with javascript-basic |

Don't spend a week tweaking IDE settings. Spend it on the cycle: **red underline → read the TSxxxx code → fix it → `npx tsc`**.

### TypeScript version in the editor

Command Palette → **TypeScript: Select TypeScript Version** → **Use Workspace Version**. Otherwise the editor might show one thing while `npx tsc` in CI shows another.

## Connection to javascript-basic and FastAPI :8090

You already wrote this in JS:

```javascript
const shopApiBase = "http://localhost:8090/api/v1";
// const res = await fetch(`${shopApiBase}/items`);
```

In TypeScript, that same URL becomes a **typed contract** — first by hand (`interface Item`), later via OpenAPI codegen against [`fastapi`](../fastapi/README.md). For now it's enough to know: **the shop API stand on :8090** is the target for nodejs/react; typescript-basic prepares the **data models** and **compile-time checks** before your first `fetch` in a typed BFF.

## How this connects to the course

| Material | Connection |
|----------|-------|
| [01. The landscape](01-landscape.md) | TS vs JS, the compilation pipeline |
| [03. Lab: first TS](03-lab-first-ts.md) | reinforcing tsc and type errors |
| [`javascript-basic/00`](../javascript-basic/00-environment.md) | Node, examples/, ES modules |
| [`javascript-path`](../javascript-path.md) | where typescript-basic sits in the track |
| [`deploy/fastapi` :8090](../../deploy/fastapi/README.md) | the future API contract |

## Common mistakes

**`tsc: command not found`.** TypeScript isn't on PATH — use `npx tsc` or `npm run build` after a local install.

**Editor is green, CI is red.** Different TS versions; wrong `tsconfig`; wrong directory in CI. Fix with workspace version + `cd examples`.

**Running `.ts` files with `node file.ts`.** Node runs JS; `.ts` needs `tsc`/`tsx` or an emit step into `dist/` first.

**Committing `dist/` and `node_modules/`.** In the course repo, `dist/` belongs in `.gitignore`; CI does `npm ci && npm run build`.

**Turning off `strict` on day one.** Just postpones the pain; the course is built around `strict: true`.

**Mixing CommonJS and ESM.** With `"type": "module"` you get only `import`/`export`; keep it consistent with `module: NodeNext`.

## Summary

The typescript-basic environment is **Node LTS + a local TypeScript install in `examples/`**, a `tsconfig.json` with `strict` on, and the cycle **`.ts` → tsc → `.js` → node**. For labs, use **tsx**; for CI, use **`tsc --noEmit`** and an explicit build. The editor surfaces errors before runtime does. The course builds on javascript-basic and prepares typed models for the shop API on **:8090**.

## Checklist

- [ ] `node --version` — 20.x or 22.x (18 minimum)
- [ ] `npm install` in `courses/typescript-basic/examples/` completed without errors
- [ ] `npx tsc --version` shows 5.x
- [ ] `hello.ts` compiles; `node dist/hello.js` (or `node hello.js`) prints the string
- [ ] A deliberate type error (`const n: number = "x"`) is caught by `tsc`
- [ ] The `examples/` folder is open; workspace TypeScript version is selected
- [ ] You understand the difference between `tsx` (lab) and `tsc` + `node dist/` (CI)

Next lesson: [01. The TypeScript landscape](01-landscape.md).
