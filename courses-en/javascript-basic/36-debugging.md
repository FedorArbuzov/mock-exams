# 36. Debugging: console, DevTools, breakpoints

## A scenario from work

"It works on my machine" — a classic. In prod `total` comes out as `NaN`, and the logs are silent. In five minutes in DevTools a colleague finds it: `fetch` returned 500, but the code called `.json()` anyway. You add `console.log` in ten places — the output is unreadable. You need a **system**: reproduce, localize, test a hypothesis, fix, confirm.

Debugging is a skill no less important than syntax. This chapter covers the **Node** and **browser** tools, plus habits that save hours.

## The debugger's mindset

```text
1. Reproduction  — stable steps, a minimal example
2. Hypothesis    — what exactly is wrong (value, order, type)
3. Observation   — breakpoint, log, Network tab
4. Fix           — one change at a time
5. Regression    — did we break something else
```

Don't start with "I'll rewrite everything". First a **narrow** failing case — a principle from [03-lab-first-scripts.md](03-lab-first-scripts.md).

## console — the first instrument

```javascript
const user = { id: 1, name: "Ann", roles: ["admin", "user"] };

console.log("user loaded", user);
console.info("info level");
console.warn("deprecated endpoint /v1/items");
console.error(new Error("save failed"));

console.table(user.roles.map((r, i) => ({ index: i, role: r })));

console.group("HTTP request");
console.log("method", "GET");
console.log("url", "/api/items");
console.groupEnd();
```

### log vs debug vs info

| Method | Where it's visible |
|-------|-----------|
| `log` | everywhere |
| `info` | everywhere (often filtered) |
| `debug` | often hidden until Verbose is enabled in DevTools |
| `warn` | yellow, warnings |
| `error` | red, a stack for an Error |

In Node they all go to stderr/stdout; the levels are a team convention.

### Objects and the moment of the snapshot

```javascript
const state = { count: 0 };
console.log("before", state);
state.count = 1;
console.log("after", state);
// in DevTools both logs may show count: 1 — the object is by reference
```

For a snapshot:

```javascript
console.log("snapshot", structuredClone(state));
// or JSON.stringify(state)
```

### console.time / timeEnd

```javascript
console.time("fetch-items");
const res = await fetch("/api/items");
const data = await res.json();
console.timeEnd("fetch-items");
// fetch-items: 234.567ms
```

The timer names must **match**; nested ones — different labels. An alternative — `performance.now()` for precise measurements.

### console.trace — the call stack

```javascript
function inner() {
  console.trace("who called inner");
}

function outer() {
  inner();
}

outer();
// Trace: who called inner
//   at inner (...)
//   at outer (...)
```

Shows the **chain of calls** at the moment of the trace — useful for "where was this called from?".

### console.assert

```javascript
console.assert(total >= 0, "negative total", { total, items });
// if the condition is false — the message appears as a warn
```

Not a replacement for tests — a quick invariant check during development.

## debugger — a programmatic breakpoint

```javascript
function calculateDiscount(price, percent) {
  debugger; // execution pauses if an inspector is attached
  return price * (1 - percent / 100);
}
```

- **Browser:** DevTools open → pause on the line.
- **Node:** run with `--inspect` / `--inspect-brk`.

**Remove** `debugger` before merging — otherwise prod hangs with a remote debug open (or skips it if no inspector is attached).

## Debugging in Node.js

### Running with the inspector

```bash
cd courses/javascript-basic/examples
node --inspect-brk lab/buggy.js
```

`--inspect-brk` — pause on the **first** line until the debugger attaches.

Chrome: `chrome://inspect` → **Open dedicated DevTools for Node**.

VS Code / Cursor: a **Launch Program** configuration with `"runtimeArgs": ["--inspect-brk"]` or the "Debug" button on the open file.

### What to look at in Node DevTools

| Panel | Purpose |
|--------|------------|
| **Sources** | breakpoints, step over/into/out |
| **Watch** | expressions on every pause |
| **Call Stack** | the chain of functions |
| **Scope** | local and closure variables |
| **Console** | a REPL in the context of the pause |

### node inspect (REPL debugger)

```bash
node inspect lab/script.js
```

Commands: `cont`, `next`, `step`, `repl`. Less convenient than Chrome/VS Code, but works everywhere.

### NODE_OPTIONS

```bash
NODE_OPTIONS='--inspect' node lab/script.js
```

## Debugging in the browser (DevTools)

Open F12 → the tabs:

### Sources

- Click a line number — a **breakpoint**.
- **Conditional breakpoint** — pause only if `userId === 7`.
- **Step over (F10)** — the next line in this function.
- **Step into (F11)** — enter the call.
- **Step out (Shift+F11)** — exit the function.

### Network

For [29-fetch.md](29-fetch.md):

- status 404/500;
- the response body (Preview / Response);
- timing (TTFB, download);
- on a CORS failure the request may be **red** with no readable body — check the Console.

### Console

- filter by level;
- **Live Expression** — pin an expression (`cart.total`).
- `$0` — the last selected Elements node.

### Application

Storage, cookies — later in [`browser-platform`](../javascript-path.md).

## Common classes of bugs

### Unexpected undefined

```javascript
const user = users.find((u) => u.id === id);
console.log(user.name); // TypeError if find returned undefined
```

Breakpoint **before** the line; watch `user`. The fix — a guard or optional chaining [19-optional-nullish.md](19-optional-nullish.md).

### async order

Symptom: logs "out of order". Related to [24-event-loop.md](24-event-loop.md):

```javascript
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
// 1, 4, 3, 2
```

Timestamps:

```javascript
const t = () => new Date().toISOString();
console.log(t(), "start");
await fetch(url);
console.log(t(), "after fetch");
```

### State mutation

```javascript
function addItem(cart, item) {
  cart.items.push(item); // mutates the argument
  return cart;
}
```

Log **before and after**; `structuredClone` for comparison; in tests — [08-arrays.md](08-arrays.md) immutability.

### fetch and JSON

```javascript
const res = await fetch(url);
const data = await res.json(); // SyntaxError if it's an HTML error page
```

Network tab → Response. Code: check `res.ok` before parsing.

### this and context

[14-this.md](14-this.md) — a breakpoint in a method, look at `this` in Scope.

## A logging strategy for debugging

Instead of ten `console.log`s:

```javascript
const DEBUG = process.env.DEBUG === "1";

function debug(...args) {
  if (DEBUG) console.log("[debug]", ...args);
}
```

Or a structured log:

```javascript
console.log(JSON.stringify({ event: "cart.add", productId, qty, total }));
```

In production — pino/winston ([`nodejs-basic`](../javascript-path.md)), not raw console.

## Source maps (overview)

TypeScript and bundlers generate `.map` files — DevTools shows the **original** TS/JSX rather than the compiled code. In a pure Node course maps are rare; in React they're essential.

## What to avoid

| Antipattern | Why |
|-------------|--------|
| `debugger` in main | blocks prod / CI |
| commit with `console.log` noise | code review reject |
| editing code "at random" without a repro | regressions |
| ignoring a warning | often precursors of bugs |

## A minimal checklist before "done"

- [ ] The bug reproduces on a minimal example
- [ ] A breakpoint or one targeted log confirmed the hypothesis
- [ ] Temporary `debugger`s and extra logs removed
- [ ] The edge case is checked (null, empty array, 404)

## Connection to the labs

- [37-lab-collections.md](37-lab-collections.md) — `console.table`, `console.time` on a pipeline.
- [33-lab-errors.md](33-lab-errors.md) — meaningful messages instead of a silent fail.

## Common mistakes

- **Looking only at the Console**, not the Network — for HTTP bugs.
- **Logging an object without a clone** — a misleading snapshot in DevTools.
- **Forgetting `--inspect-brk`** — the script finished before you attached.
- **A conditional breakpoint not set** — too many pauses in a loop.
- **Not reading the stack trace** — the first line of your code in the trace is often the place to fix.

## Checklist

- Why is `console.time` more convenient than a manual `Date.now()`?
- How do you set a breakpoint in Node without an IDE?
- The 1,4,3,2 order in the event loop example — why?
- What will the Network show for HTTP 500 vs a CORS error?
- Why `console.trace`?
- What should you remove before merging into main?

Next lesson: [37. Lab: collections](37-lab-collections.md).
