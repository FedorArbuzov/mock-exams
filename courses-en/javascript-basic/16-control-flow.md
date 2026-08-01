# 16. Conditions, loops, `switch`

## Intro: "we processed the order twice"

An order-sync script with FastAPI ([deploy/fastapi](../../deploy/fastapi/README.md)) walks the queue in a `while` and inside calls `process(order)` without a `break` after success. On a network failure the order goes back into the queue, but the `processed` flag isn't checked — a `switch (status)` branch without `break` "falls through" into `case "cancelled"` and cancels an already-paid order. In another file a junior uses `for…in` over an array of IDs and gets the indexes `"0"`, `"1"` plus extra keys from the prototype. **Control flow** in JS is not just syntax: money and data integrity depend on the choice of `for…of` vs `map`, explicit `===` checks vs truthy, and `break` in a `switch`. This chapter is the bridge between types ([04](04-primitives.md)–[05](05-coercion-comparison.md)) and asynchronous loops ([27](27-async-await.md)).

## What you'll learn

- `if` / `else`, the ternary operator, and readability.
- **Truthy / falsy** and when explicit comparisons are needed.
- `switch`, **fall-through**, and object mapping instead of long branches.
- Loops: `for`, `for…of`, `for…in`, `while`, `do…while`.
- `break`, `continue`, labels (and why they're avoided).
- `await` in a loop: sequential vs parallel.
- Choosing between a loop and array methods ([08](08-arrays.md)).

## Conditions: `if` and `else`

```javascript
function gradeFromScore(score) {
  if (score >= 90) {
    return "A";
  } else if (score >= 80) {
    return "B";
  } else if (score >= 70) {
    return "C";
  } else {
    return "F";
  }
}
```

**Why an early return:** less nesting, easier-to-read guard clauses:

```javascript
function processOrder(order) {
  if (!order) return;
  if (order.status === "cancelled") return;
  if (!order.items.length) return;
  // the main logic at one level
}
```

### The ternary operator

```javascript
const label = isActive ? "ON" : "OFF";
const price = hasDiscount ? base * 0.9 : base;
```

**Rule:** don't nest ternaries deeper than one level — use `if` or a separate function.

```javascript
// Bad
const x = a ? b ? c : d : e;

// Better
function pick() {
  if (!a) return e;
  return b ? c : d;
}
```

## Truthy, falsy, and explicit checks

Falsy: `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`.

```javascript
if (items.length) {
  renderList(items);
}

if (user?.id) {
  loadProfile(user.id);
}
```

**Why `length` is fine:** `0` — an empty list, the condition is false — as expected.

Dangerous cases:

```javascript
if (port) { /* 3000 passes — 0 is falsy */ }
if (name) { /* "" — the guest name is lost */ }
```

For APIs and configs — be explicit:

```javascript
if (response.status === 404) { /* ... */ }
if (value === null || value === undefined) { /* ... */ }
if (config.port != null) { /* 0 is allowed */ }
```

See `??` in [19](19-optional-nullish.md).

## `switch`: comparison via `===`

```javascript
function handleCommand(command) {
  switch (command) {
    case "start":
      startWorker();
      break;
    case "stop":
      stopWorker();
      break;
    case "pause":
      pauseWorker();
      break;
    default:
      console.warn("unknown command:", command);
  }
}
```

`switch` uses **strict** equality `===` without type coercion (except the special case of `switch` with expressions — rare).

### Fall-through

```javascript
switch (tier) {
  case "gold":
  case "silver":
    applyDiscount(0.15);
    break;
  case "bronze":
    applyDiscount(0.05);
    break;
  default:
    applyDiscount(0);
}
```

Without `break`, execution **falls through** into the next `case`. Sometimes intentional (as above), but always **comment** it or isolate the block.

**A typical bug:**

```javascript
switch (action) {
  case "save":
    save();
  case "delete":  // save falls through here!
    delete();
    break;
}
```

### Object mapping instead of a long `switch`

```javascript
const handlers = {
  start: startWorker,
  stop: stopWorker,
  pause: pauseWorker,
};

function dispatch(command) {
  const fn = handlers[command];
  if (fn) {
    fn();
  } else {
    console.warn("unknown command:", command);
  }
}
```

**Why it's handier:** a data table, easy to test, no fall-through. For TypeScript — `satisfies Record<Command, Handler>`.

## The `for` loop: the classic counter

```javascript
for (let i = 0; i < items.length; i++) {
  console.log(i, items[i]);
}
```

Use `let` — a separate binding per iteration with nested callbacks ([11](11-scope-hoisting.md)).

## `for…of`: values of an iterable

```javascript
for (const item of items) {
  console.log(item.name);
}

for (const [index, item] of items.entries()) {
  console.log(index, item);
}
```

Works with arrays, strings, Map, Set, NodeList — everything with `Symbol.iterator` ([23](23-iterators-generators.md)).

**Why it's preferable to an index:** fewer off-by-ones, no need to access `length` manually.

## `for…in`: enumerable keys of an object

```javascript
const config = { host: "localhost", port: 3000 };
for (const key in config) {
  console.log(key, config[key]);
}
```

**Don't use `for…in` over arrays:**

```javascript
const ids = [10, 20, 30];
for (const k in ids) {
  console.log(k, typeof k); // "0" "string", "1" "string"…
}
```

Reasons:

- the keys are strings;
- inherited enumerable properties may show up;
- the order isn't guaranteed like `for…of` for arrays in older engines.

## `while` and `do…while`

```javascript
while (queue.length > 0) {
  const job = queue.shift();
  process(job);
}
```

```javascript
let input;
do {
  input = readLine();
} while (input && !input.valid);
```

**When `while`:** an unknown number of iterations (a queue, a stream, waiting for a condition).

**`do…while`:** at least one iteration — a CLI menu, retrying a request until valid input.

## `break` and `continue`

```javascript
for (const user of users) {
  if (!user.active) continue;
  if (user.banned) break;
  notify(user);
}
```

`continue` — the next iteration; `break` — exit the loop.

Labels (`outer: for`) — rare; better to extract into an inner function with `return`.

## Step by step: `await` in a loop

```javascript
async function syncAll(urls) {
  for (const url of urls) {
    const res = await fetch(url);
    await save(await res.json());
  }
}
```

1. Iteration 1: fetch → wait → save → wait.
2. Iteration 2: only after iteration 1 finishes.

**Sequential** — less load on the API, easier rate limits.

In parallel:

```javascript
await Promise.all(urls.map((url) => fetchAndSave(url)));
```

**Why not `await urls.map(async …)` without `all`:** you get an array of Promises and won't wait for all of them to finish. Details — [27](27-async-await.md).

### Errors in a loop

```javascript
for (const url of urls) {
  try {
    await fetch(url);
  } catch (e) {
    console.error(url, e.message);
    // continue or break — per the business rule
  }
}
```

One failed URL shouldn't necessarily bring down the whole batch — an explicit policy.

## Loop vs array methods

| Task | Tool | Why |
|--------|------------|--------|
| Transform a list | `map` | Returns a new array |
| Filter | `filter` | Declarative |
| Search | `find` / `some` / `every` | Early exit inside the engine |
| Sum / aggregate | `reduce` | One pass |
| Side effect per element | `for…of` | `await`, `break`, readability |
| Early exit by condition | `for` + `break` | `map` can't be interrupted |
| Many branches by string | map handlers or `switch` | No fall-through bugs |

```javascript
const totals = orders
  .filter((o) => o.paid)
  .map((o) => o.total)
  .reduce((sum, t) => sum + t, 0);
```

## Block scope in `switch` (ES6+)

```javascript
switch (type) {
  case "a": {
    const detail = loadA();
    use(detail);
    break;
  }
  case "b": {
    const detail = loadB();
    use(detail);
    break;
  }
}
```

`const` in a case without `{}` — SyntaxError: all cases are in one switch block.

## How this connects to the course

| Lesson | Connection |
|------|------|
| [05. Coercion](05-coercion-comparison.md) | Truthy, `===` in switch |
| [08. Arrays](08-arrays.md) | map/filter/for…of |
| [11. Scope](11-scope-hoisting.md) | `let` in for |
| [17. Spread](17-destructuring-spread.md) | Destructuring in for…of |
| [19. `??`](19-optional-nullish.md) | Defaults in conditions |
| [27. async/await](27-async-await.md) | Loops with await |
| [32. Errors](32-error-handling.md) | try/catch in loops |

## Common mistakes

| Mistake | Root cause | Fix |
|--------|------------------|-------------|
| `for…in` over an array | Keys, not elements | `for…of` |
| Forgotten `break` in switch | Fall-through | `break` or an "intentional" comment |
| `if (port)` cuts off 0 | 0 is falsy | `port != null` or `??` |
| `await` in `map` without `Promise.all` | Doesn't wait | `Promise.all` |
| Infinite `while (true)` without break | No exit | A condition or return |
| Mutating an array in `for…of` + `splice` | Index shift | A reverse for or filter |

## In production

- **Idempotency** in queue handlers — a `switch` on status with an explicit `break` and a log for unknown branches.
- The **linter** `no-fallthrough` for switch.
- Heavy lists — not a `for` with `await` over thousands of URLs without a concurrency limit; use a pool (nodejs-intermediate).
- Metrics: count unhandled `default` cases in switch.

## Summary

**`if`** and guard clauses are the basis of branching; the ternary — for simple expressions. **Truthy** is convenient, but `0` and `""` need explicit checks. **`switch`** uses `===` and has dangerous fall-through; a handlers table is often better. **`for…of`** for elements; **`for…in`** — for object keys, not arrays. **`await` in a loop** — sequential; parallel — `Promise.all`. The choice of a loop vs `map`/`filter` is a question of `break`, `await`, and side effects.

## Checklist

- Why is `for…in` over an array a bad idea?
- What is fall-through in a `switch`?
- When is `while` preferable to `for`?
- How does `await` in `for…of` differ from `Promise.all(map)`?
- Which falsy values can you list?
- Why the `{}` block inside a `case`?

Next lesson: [17. Destructuring, spread, rest](17-destructuring-spread.md).
