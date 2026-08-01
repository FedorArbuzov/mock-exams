# JavaScript — Basic

A deeply detailed course on **plain JavaScript** without frameworks: types, scope, closures, `this`, prototypes, Promises, `async/await`, ES modules, `fetch`, error handling. **40 lessons** + capstone + interview cheatsheet.

> Start of the JS track: [`javascript-path.md`](../javascript-path.md). Next — [`typescript-basic`](../typescript-basic/README.md), [`nodejs-basic`](../nodejs-basic/README.md), [`react-basic`](../react-basic/README.md).

**Prerequisites:** basic terminal ([`linux-basic`](../linux-basic/README.md) chapters 02–03). HTTP at the level of "what is GET/POST" — [`api-design`](../api-design/README.md) chapter 01 is helpful.

**Locally:** Node.js **LTS** (20 or 22) on the host. Lab code lives in the [`examples/`](examples/package.json) directory.

```bash
cd courses/javascript-basic/examples
node --version          # v20.x or v22.x
node 01-hello.js        # first run
```

Optional: [nvm](https://github.com/nvm-sh/nvm) (Linux/macOS) or [nvm-windows](https://github.com/coreybutler/nvm-windows) for switching Node versions.

A browser (Chrome/Firefox) — for the lessons on DevTools and `fetch` to public APIs. The mock-exams backend stands are **not required** at this stage; later `fetch` will connect to [`deploy/fastapi`](../../deploy/fastapi/README.md) `:8090`.

## How to read the chapters

Each lesson is a **full textbook chapter**, not a cheat sheet or a one-page reference. Read them in order: the author leads from a **real working scenario** (a ticket, a code review, a bug in prod) to concepts, code, and common mistakes — like a technical book with a narrative, not an API reference.

1. **Theory** (01, 02, 04, 30…) — "A scenario from work" → explanation → code examples → "Common mistakes" → "Checklist". Reinforce the checklist **in your own words** before moving on to the lab.
2. **Lab** (03, 06, 31…) — hands-on in [`examples/`](examples/package.json): `node lab/….js`, success criteria, a "if something went wrong" table. The lab **continues the story** of the theory rather than duplicating it as a list of APIs.
3. After block 38 — [`interview-cheatsheet.md`](interview-cheatsheet.md) **without peeking** into the chapters.
4. [39-capstone.md](39-capstone.md) — **4–6 hours**, a "Task Tracker" CLI utility; it pulls together modules, errors, and collections from chapters 30–37.

**Time:** budget **~50–70 minutes** for each "theory + lab" pair (reading, experiments in the REPL, the lab up to the criteria). The whole course — **~14–18 hours**; the capstone separately.

## Curriculum (40 lessons)

### Phase 1. Environment and first programs (00–03)

| # | Lesson |
|---|------|
| 00 | [Environment: Node.js, REPL, editor](00-environment.md) |
| 01 | [Landscape: JS, ECMAScript, browser and Node](01-landscape.md) |
| 02 | [Variables, `let`/`const`, strict mode](02-variables-strict.md) |
| 03 | [Lab: first scripts](03-lab-first-scripts.md) |

### Phase 2. Types and data structures (04–09)

| 04 | [Primitive types](04-primitives.md) |
| 05 | [Type coercion and comparison](05-coercion-comparison.md) |
| 06 | [Lab: types and comparison](06-lab-types.md) |
| 07 | [Objects: properties, references, copying](07-objects.md) |
| 08 | [Arrays and higher-order methods](08-arrays.md) |
| 09 | [Lab: objects and arrays](09-lab-objects-arrays.md) |

### Phase 3. Functions, scope, `this` (10–15)

| 10 | [Functions: declaration, expression, arrow](10-functions.md) |
| 11 | [Scope, hoisting, TDZ](11-scope-hoisting.md) |
| 12 | [Closures](12-closures.md) |
| 13 | [Lab: closures and modules within functions](13-lab-closures.md) |
| 14 | [`this`, call, apply, bind](14-this.md) |
| 15 | [Lab: the `this` context](15-lab-this.md) |

### Phase 4. Control flow and modern syntax (16–19)

| 16 | [Conditionals, loops, `switch`](16-control-flow.md) |
| 17 | [Destructuring, spread, rest](17-destructuring-spread.md) |
| 18 | [Lab: modern syntax](18-lab-modern-syntax.md) |
| 19 | [Optional chaining, nullish coalescing](19-optional-nullish.md) |

### Phase 5. Prototypes and classes (20–23)

| 20 | [Prototypes and the `[[Prototype]]` chain](20-prototypes.md) |
| 21 | [ES6 classes](21-classes.md) |
| 22 | [Lab: domain model](22-lab-oop.md) |
| 23 | [Iterators, `for...of`, generators](23-iterators-generators.md) |

### Phase 6. Asynchrony (24–29)

| 24 | [Event loop: browser and Node](24-event-loop.md) |
| 25 | [Callbacks and callback hell](25-callbacks.md) |
| 26 | [Promises: then, catch, finally](26-promises.md) |
| 27 | [`async`/`await`](27-async-await.md) |
| 28 | [Lab: asynchronous chains](28-lab-async.md) |
| 29 | [`fetch` and working with HTTP](29-fetch.md) |

### Phase 7. Modules and errors (30–33)

| 30 | [ES modules: import/export](30-es-modules.md) |
| 31 | [Lab: splitting into modules](31-lab-modules.md) |
| 32 | [Error handling: try/catch, throw](32-error-handling.md) |
| 33 | [Lab: reliable functions](33-lab-errors.md) |

### Phase 8. Collections, regex, debugging (34–37)

| 34 | [Map, Set, WeakMap, WeakSet](34-map-set.md) |
| 35 | [RegExp, JSON, Date, Math](35-regex-json-date.md) |
| 36 | [Debugging: console, DevTools, breakpoints](36-debugging.md) |
| 37 | [Lab: collections and parsing](37-lab-collections.md) |

### Phase 9. Finale (38–39)

| 38 | [Interview Q&A (top 35)](38-interview-qa.md) |
| 39 | [Capstone: Task Tracker CLI](39-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## What you should end up with

- You write **readable** JS in ES2020+: `const`/`let`, arrow functions, destructuring, modules.
- You can explain **type coercion**, `===` vs `==`, why `0.1 + 0.2 !== 0.3`.
- You build **closures** (counters, factories, private state) without magic.
- You distinguish **`this`** in method / arrow / `bind` / class.
- You understand **prototypes** and when a class is syntactic sugar.
- You read and write **Promise** chains and **`async/await`**; you know the order of microtasks.
- You make **`fetch`** calls to REST APIs, handling statuses and JSON.
- You split code into **ES modules** and catch errors meaningfully.
- You debug scripts in **Node** and **DevTools**.

## Related courses

| Course | Relationship |
|------|-------|
| [`typescript-basic`](../typescript-basic/README.md) | types on top of this course |
| [`nodejs-basic`](../javascript-path.md) | event loop in depth, HTTP server |
| [`react-basic`](../react-basic/README.md) | components, hooks, state |
| [`fastapi`](../../deploy/fastapi/README.md) | `fetch` to `:8090` in nodejs/react |
| [`api-design`](../api-design/README.md) | REST, statuses, API errors |
| [`javascript-testing`](../javascript-path.md) | Vitest after nodejs/react |
| [`browser-platform`](../javascript-path.md) | CORS, storage, rendering |

## Examples

| Path | Purpose |
|------|------------|
| [`examples/package.json`](examples/package.json) | `"type": "module"`, lab scripts |
| [`examples/lab/`](examples/lab/) | starter files for the labs |
| [`examples/solutions/`](examples/solutions/) | reference solutions (look after attempting) |
