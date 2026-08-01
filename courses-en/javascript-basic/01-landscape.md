# 01. The landscape: JavaScript, ECMAScript, browser, and Node

## Intro: a scenario from work

Monday morning. A Jira ticket: "Fix the checkout bug — legacy code targets ES5, don't touch anything else." In a merge request, a colleague adds `user?.address?.city` — the reviewer comments: "optional chaining isn't supported in our Android 7 WebView." On a call, product asks: "Can we rewrite the admin panel in Node, since we're keeping the storefront on React?" Is that one language or two? Meanwhile HR drops a job posting in a group chat: "Looking for JavaScript, ES6+, TypeScript a plus" — and you're not entirely sure how **JavaScript** differs from **ECMAScript**, from **TypeScript**, or from "just React."

Without a map of this landscape, every one of these conversations turns into guesswork. You end up conflating the **language spec**, its **engine implementation**, the **runtime** (browser vs. Node), and a **framework** (React). In the Python track of mock-exams you already learned to tell WSGI and ASGI apart ([`fastapi/01-landscape`](../fastapi/01-landscape.md)); this is the same kind of distinction, just for JS.

Here's another real episode: a junior dev runs `setTimeout(() => console.log("done"), 0)` right after `console.log("start")` and is baffled that the order is `start`, then `done` — not the reverse. "Isn't zero milliseconds basically instant?" he asks. The answer lives in the **event loop** and the single-threaded model — the foundation without which Promises and `async/await` (lessons 24–27) look like magic.

This chapter is a **map of the terrain** before we get to syntax. You don't need to memorize the ES2024 feature table; you need to be able to explain, in under a minute, where your code runs, who parses it, and why `"5" + 1` behaves differently from `"5" - 1`.

## What you'll learn

- The difference between **ECMAScript** (the standard) and **JavaScript** (an implementation of it).
- The pipeline: source code → parser → **engine** → **runtime** (browser / Node).
- Why JavaScript is **single-threaded** for your code, and what the **event loop** is (overview).
- **Dynamic** and **weak** typing — where the classic comparison bugs come from.
- Multi-paradigm style: imperative, functional, OO, and async code coexisting in one language.
- Where this course sits in the mock-exams ecosystem: the shop domain, FastAPI on `:8090`, the path toward React and Node.

## JavaScript and ECMAScript: the standard vs. the language in your head

**ECMAScript (ES)** is the document that describes syntax, types, and built-in objects (`Array`, `Promise`, and so on). It's maintained by the **TC39** committee; the standard's number is **ECMA-262**. **JavaScript** is the best-known **implementation** of that spec. The short interview answer: "JavaScript is the language; ECMAScript is the spec it follows (with a few historical quirks)."

Since 2015, TC39 has shipped **yearly** updates, named ES2015, ES2016, … ES2024. The casual name **ES6** = **ES2015** — the watershed year that brought `let`/`const`, classes, arrow functions, and modules.

| Version | Year | Highlights (not exhaustive) |
|--------|-----|----------------------------------------|
| ES5 | 2009 | `strict mode`, `JSON`, array methods like `forEach`/`map` |
| ES2015 (ES6) | 2015 | `let`/`const`, classes, arrows, `import`/`export` |
| ES2020 | 2020 | `?.`, `??`, `BigInt`, `Promise.allSettled` |
| ES2022 | 2022 | top-level `await` in modules, `#private` class fields |
| ES2023 | 2023 | `toSorted`, `toReversed` — non-mutating array methods |

**Important:** browsers and Node **don't update in lockstep**. Chrome 120 and Node 22 support different subsets of "the latest ES." Before shipping to production, check [caniuse.com](https://caniuse.com) (browser) and [node.green](https://node.green) (Node). In mock-exams, the FastAPI training stand doesn't dictate a JS version — but a **legacy WebView** in a mobile app might well force you onto ES5 and Babel.

**TypeScript** doesn't replace JavaScript: TS **compiles down** to JS. It's a layer on top with static types — see the [`typescript-basic`](../javascript-path.md) course, which comes after this one.

## From source to execution

```text
Source code (.js / .ts after compilation)
        │
        ▼
   Parser (syntax → AST)
        │
        ▼
   Compiler / JIT (V8, SpiderMonkey, …)
        │
        ▼
   Engine executes bytecode / machine code
        │
        ├── Browser: DOM, fetch, Web APIs, UI event loop
        └── Node.js: fs, http, process, the same V8 + libuv
```

| Runtime | Engine | Typical use |
|-------|--------|---------------------|
| Chrome, Edge | V8 | SPAs, DevTools |
| Firefox | SpiderMonkey | web applications |
| Safari | JavaScriptCore | iOS/macOS web |
| Node.js | V8 + libuv | APIs, CLIs, tooling, CI |
| Deno, Bun | V8 (+ their own APIs) | Node alternatives |

The same syntax, `const price = 79.99`, runs everywhere; the **global objects** differ. The browser has `document`; Node has `process` and `node:fs`. Lesson [00-environment.md](00-environment.md) already covered this comparison in a table.

```javascript
// Identical in Node (as a module) and a modern browser
const shopApiBase = "http://localhost:8090/api/v1";
console.log(typeof shopApiBase); // "string"
```

## Single-threadedness and the event loop (overview)

JavaScript **doesn't spin up a thread per request** the way a sync worker in gunicorn does. **Your synchronous** code runs on a single thread. I/O operations (network, timers, disk access in Node) are **delegated** to the environment (libuv in Node, browser APIs). Once the I/O completes, its **callback** joins a queue; the event loop picks it up once the call stack is empty.

The classic demonstration:

```javascript
console.log("1 — synchronous");
setTimeout(() => console.log("2 — from the macrotask queue"), 0);
console.log("3 — synchronous");

// Output:
// 1 — synchronous
// 3 — synchronous
// 2 — from the macrotask queue
```

`setTimeout(..., 0)` does **not** mean "run immediately." It means "run no sooner than the current synchronous code finishes and any tasks already queued are done." The full model (microtasks, `Promise.then`, `async/await`) is covered in [24-event-loop.md](24-event-loop.md). For a comparison with Python's asyncio, see [`python-async`](../python-async/README.md).

For a backend developer, here's the analogy: a single **uvicorn worker** with an event loop vs. a pool of sync workers. JS is "async by default" in the Node ecosystem — but **your own** CPU-bound `for` loop still blocks the thread unless you hand the work off to a worker thread or a queue.

## Dynamic and weak typing

**Dynamic typing:** a type is attached to a **value**, not to a variable's name. A variable can point to different types at different times:

```javascript
let payload = 42;        // number — e.g., a product id
payload = "42";          // string — this is how it arrived from a query string
payload = { id: 42 };    // object — this is what FastAPI's /items/42 returned
// All three assignments are legal. In TypeScript, this would be a compile error.
```

**Weak typing:** the engine **coerces** types in operations, often implicitly:

```javascript
"5" + 1;   // "51" — if a string is involved, + leans toward concatenation
"5" - 1;   // 4 — minus requires a number, so "5" becomes 5
"5" * 2;   // 10
true + 1;  // 2 — boolean coerces to number
```

This is where form bugs come from ("price and quantity got glued together") and comparison bugs (`==` vs. `===`) — covered in full in [05-coercion-comparison.md](05-coercion-comparison.md) and [04-primitives.md](04-primitives.md). Static types in [`typescript-basic`](../javascript-path.md) catch many of these errors **before** you even run the code.

## Multi-paradigm: one language, several styles

JavaScript doesn't force you to pick "pure OOP" or "pure functional." In practice, real code **mixes** paradigms:

**Imperative** — step-by-step instructions, `for` loops, mutating variables:

```javascript
let total = 0;
for (const price of [79.99, 29.99, 199.0]) {
  total += price;
}
```

**Functional** — functions as values, `map`/`filter`, avoiding mutation (especially in React):

```javascript
const prices = [79.99, 29.99, 199.0];
const withTax = prices.map((p) => Math.round(p * 1.2 * 100) / 100);
```

**Object-oriented** — objects, prototypes, ES6 classes ([20-prototypes.md](20-prototypes.md), [21-classes.md](21-classes.md)):

```javascript
class CartItem {
  constructor(name, price) {
    this.name = name;
    this.price = price;
  }
}
```

**Asynchronous** — callbacks, Promises, `async/await` for I/O against the shop API:

```javascript
// Overview only; syntax covered in lessons 25–27
// const res = await fetch(`${shopApiBase}/items`);
// const data = await res.json();
```

Interviewers rarely ask "which paradigm does JS belong to." They're more likely to ask "how do you structure async code without callback hell" or "why don't you mutate state in React."

## The ecosystem: where this course fits in the stack

| Layer | Examples | mock-exams course |
|------|---------|-----------------|
| Language, ES2020+ | types, functions, async | **javascript-basic** (you are here) |
| Static types | TypeScript, Zod | typescript-basic |
| Server runtime | Node.js, Fastify | nodejs-basic |
| UI | React, Vite | react-basic |
| Build tooling | Vite, webpack | react-basic / nodejs |
| Testing | Vitest, Playwright | javascript-testing |
| Backend API | FastAPI, Django | fastapi, django |

**Right now, there's no framework in sight.** Just the language. That makes it easier to understand what React is actually doing with arrays and closures under the hood, instead of confusing a language problem with a library problem.

## Language versions in practice: what to put on your resume and in `package.json`

When a job posting says "ES6+," they mean: you know `let`/`const`, arrows, classes, modules, destructuring, async/await — not that you're stuck in 2015. "Modern JS (ES2020)" means they expect optional chaining, nullish coalescing, `BigInt`, `globalThis`.

In **new** mock-exams code (Node 20+, Vite, Vitest), you can rely on ES2020–2023 without Babel. For **legacy** WebViews or old corporate browsers, transpilation (esbuild, Babel) or polyfills come into play — that's a topic for react/nodejs, not this chapter.

Check before merging:

```bash
node --version          # LTS locally and in CI
# node.green — for a specific feature, e.g. top-level await
```

Don't confuse the **Node version** (runtime) with the **ECMAScript version** (language). Node 18 supports a large chunk of ES2022; Node 22 supports even more. A language feature can be in the spec yet still be **behind a flag** or **missing entirely** in your version of Node — always smoke-test it.

## Connection to mock-exams: the shop domain and `:8090`

The backend track serves JSON over HTTP. A typical (simplified) response from the FastAPI stand:

```json
{
  "items": [
    { "id": 1, "title": "Keyboard", "price": 79.99 }
  ],
  "total": 1
}
```

A JavaScript frontend or BFF **consumes** those same contracts — see [`api-design`](../api-design/README.md). This course gives you:

- working with **JSON** as objects and arrays ([07-objects.md](07-objects.md), [08-arrays.md](08-arrays.md));
- **`fetch`** and handling status codes ([29-fetch.md](29-fetch.md));
- **error handling** during parsing ([32-error-handling.md](32-error-handling.md)).

The [`deploy/fastapi`](../../deploy/fastapi/README.md) stand on port **8090** gets wired in during nodejs/react; at the javascript-basic stage, it's enough to know that "a shop REST API exists somewhere," and to model data locally in the lab [09-lab-objects-arrays.md](09-lab-objects-arrays.md).

## How this connects to the course

| Lesson | Connection |
|------|-------|
| [00. Environment](00-environment.md) | Node as the runtime for your first scripts |
| [02. Variables](02-variables-strict.md) | `let`/`const` from ES2015 |
| [05. Coercion](05-coercion-comparison.md) | a consequence of weak typing |
| [24. Event loop](24-event-loop.md) | a deeper look at the single-threaded model |
| [29. fetch](29-fetch.md) | HTTP calls to `:8090` |
| [`fastapi/01-landscape`](../fastapi/01-landscape.md) | a parallel map of the backend stack |

## Common misconceptions

**"JavaScript = frontend only."** Node powers CLIs, serverless functions, CI scripts, webpack, Prisma migrations. In mock-exams, Node is the BFF between React and FastAPI.

**"ES6 is outdated."** ES6 is the **foundation** of modern syntax; ES2017, ES2020, and later build on it. "Know ES6+" means "know modern JS," not "stuck in 2015."

**"TypeScript replaces JavaScript."** TS transpiles down to JS. The browser and Node execute JS. TS catches errors earlier — it doesn't change the semantics of `==` or the event loop.

**"async/await makes code multithreaded."** No — you're not blocked while **waiting** for I/O, but there's still a single JS thread. CPU-bound work without `worker_threads` blocks everything.

**"Caniuse is all green, so it's safe for prod."** Check the **minimum** client version and the Node version in CI — not just the latest Chrome.

## Summary

JavaScript is an implementation of the **ECMAScript** standard, executed by an **engine** (usually V8) inside a **runtime** (browser or Node). The language is single-threaded for your code; I/O and timers flow through the **event loop**. Dynamic and weak typing explain a chunk of the "weird" behavior — we'll come back to that in the types block. This course is a framework-free foundation; TypeScript, a Node BFF talking to FastAPI on `:8090`, and React for the shop UI all come later.

## Checklist

- [ ] Explain the difference between **ECMAScript** and **JavaScript** in one sentence
- [ ] Name Chrome's **engine** and Node.js's **runtime**
- [ ] Predict the output order for `console.log` + `setTimeout(..., 0)` + `console.log`
- [ ] Explain "dynamic typing" using the example `let x = 1; x = "a"`
- [ ] Explain why `"5" + 1` and `"5" - 1` produce different results
- [ ] Say where the shop API lives in mock-exams and which port the FastAPI stand uses

Next lesson: [02. Variables and strict mode](02-variables-strict.md).
