# TypeScript — Basic

A deeply detailed **TypeScript** course on top of [`javascript-basic`](../javascript-basic/README.md): annotations and inference, union/intersection, generics, `strict`, `tsconfig`, Zod, typed `fetch`. **34 lessons** + capstone + interview cheatsheet.

> Start of the JS track: [`javascript-path.md`](../javascript-path.md). **Prerequisite** — completed or confidently read [`javascript-basic`](../javascript-basic/README.md). Next — [`nodejs-basic`](../javascript-path.md), [`react-basic`](../react-basic/README.md).

**Prerequisite:** Node.js **LTS** (20 or 22), completed or in-parallel javascript-basic (types, functions, modules, `fetch`, errors).

**Locally:** Node.js LTS on the host. Lab code — the [`examples/`](examples/package.json) directory.

```bash
cd courses/typescript-basic/examples
npm install
npx tsc --version          # 5.x
npm run typecheck
npx tsx lab/01-hello.ts    # after lab 03
```

Optional: [nvm](https://github.com/nvm-sh/nvm) / [nvm-windows](https://github.com/coreybutler/nvm-windows). The [`deploy/fastapi`](../../deploy/fastapi/README.md) `:8090` sandbox — for labs 27, 30 and the capstone (Docker, not required before chapter 27).

## How to read the chapters

Each lesson is a **full textbook chapter**, like in javascript-basic: **a scenario from work** → concepts → code → common mistakes → checklist.

1. **Theory** — reinforce the checklist in your own words before the lab.
2. **Lab** — hands-on in [`examples/`](examples/package.json): `npx tsx lab/….ts` or `npm run build` + `node dist/…`. Reference solutions — [`solutions/`](examples/solutions/) only after your own attempt.
3. After block 32 — [`interview-cheatsheet.md`](interview-cheatsheet.md) **without peeking** at the chapters.
4. [33-capstone.md](33-capstone.md) — **4–6 hours**: typed Task Tracker + Shop API client.

**Time:** **~50–70 minutes** per «theory + lab» pair. The whole course — **~12–16 hours**; the capstone separately.

## Curriculum (34 lessons)

### Phase 1. Environment and first types (00–03)

| # | Lesson |
|---|------|
| 00 | [Environment: tsc, tsx, tsconfig](00-environment.md) |
| 01 | [Landscape: TS vs JS, compilation](01-landscape.md) |
| 02 | [Annotations and inference](02-annotations-inference.md) |
| 03 | [Lab: first `.ts` files](03-lab-first-ts.md) |

### Phase 2. Type system basics (04–09)

| 04 | [Primitives and literal types](04-primitives-literals.md) |
| 05 | [Union and intersection](05-unions-intersections.md) |
| 06 | [Lab: unions in the shop domain](06-lab-unions.md) |
| 07 | [Interfaces and objects](07-interfaces-objects.md) |
| 08 | [Narrowing and control flow](08-narrowing.md) |
| 09 | [Lab: typed catalog](09-lab-objects.md) |

### Phase 3. Functions, arrays, generics (10–15)

| 10 | [Function types and overloads](10-functions.md) |
| 11 | [Arrays, tuples, `as const`](11-arrays-tuples.md) |
| 12 | [Lab: typed helpers](12-lab-functions.md) |
| 13 | [Generics](13-generics.md) |
| 14 | [Utility types](14-utility-types.md) |
| 15 | [Lab: generic repository](15-lab-generics.md) |

### Phase 4. Classes and advanced types (16–21)

| 16 | [Classes with types](16-classes.md) |
| 17 | [Enum, const assertions, `satisfies`](17-enums-const.md) |
| 18 | [Lab: Product hierarchy](18-lab-classes.md) |
| 19 | [Type guards](19-type-guards.md) |
| 20 | [Discriminated unions](20-discriminated-unions.md) |
| 21 | [Lab: API result types](21-lab-discriminated.md) |

### Phase 5. tsconfig and modules (22–25)

| 22 | [tsconfig.json](22-tsconfig.md) |
| 23 | [Strict mode](23-strict-mode.md) |
| 24 | [Lab: fix strict errors](24-lab-strict.md) |
| 25 | [Modules and declaration files](25-modules-declarations.md) |

### Phase 6. Zod and typed HTTP (26–30)

| 26 | [Zod: runtime validation](26-zod-basics.md) |
| 27 | [Lab: Zod + FastAPI :8090](27-lab-zod.md) |
| 28 | [Async and Promise types](28-async-types.md) |
| 29 | [Typed fetch](29-fetch-typed.md) |
| 30 | [Lab: fetch + Zod](30-lab-fetch.md) |

### Phase 7. Tooling and finale (31–33)

| 31 | [ESLint, JS → TS migration](31-tooling-migration.md) |
| 32 | [Interview Q&A (top-30)](32-interview-qa.md) |
| 33 | [Capstone: Typed Shop CLI](33-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## What you should end up with

- You write **strict TypeScript** with inference, union, generics — without mass `any`.
- You configure **`tsconfig.json`** and explain the `strict`, `noUncheckedIndexedAccess` flags.
- You build **discriminated unions** and **type guards** for API results.
- You validate JSON at the boundary via **Zod** (`z.infer` — the single source of types).
- You do **typed `fetch`** to FastAPI `:8090` with separation of HTTP / schema errors.
- You migrate a JS module to TS **gradually** (allowJs, JSDoc).
- You're ready for **nodejs-basic** (Express/Fastify typed) and **react-basic** (`.tsx`, props).

## Related courses

| Course | Relation |
|------|-------|
| [`javascript-basic`](../javascript-basic/README.md) | required foundation: syntax, modules, async, fetch |
| [`nodejs-basic`](../javascript-path.md) | typed BFF to `:8090` |
| [`react-basic`](../react-basic/README.md) | `.tsx` components, props, hooks |
| [`fastapi`](../../deploy/fastapi/README.md) | API contract for Zod/fetch labs |
| [`api-design`](../api-design/README.md) | OpenAPI, 422/404 errors |
| [`javascript-testing`](../javascript-path.md) | Vitest + typed mocks |

## Examples

| Path | Purpose |
|------|------------|
| [`examples/package.json`](examples/package.json) | `"type": "module"`, typescript, tsx, zod |
| [`examples/tsconfig.json`](examples/tsconfig.json) | `strict: true`, NodeNext |
| [`examples/lab/`](examples/lab/) | labs 03–21 |
| [`examples/lab-strict/`](examples/lab-strict/) | lab 24 — fix strict |
| [`examples/lab-zod/`](examples/lab-zod/) | lab 27 — Zod + API |
| [`examples/lab-fetch/`](examples/lab-fetch/) | lab 30 — typed client |
| [`examples/capstone/`](examples/capstone/) | capstone start |
| [`examples/solutions/`](examples/solutions/) | reference solutions (after your attempt) |
