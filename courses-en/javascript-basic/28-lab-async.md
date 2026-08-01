# 28. Lab: Async Chains

## Scenario

Before connecting to a real FastAPI instance on `:8090` ([29-fetch.md](29-fetch.md)), you'll practice **async primitives** in isolation: delays, event loop ordering, parallel URL loading, retry on failure. The classic "retry didn't work in prod" bug usually comes down to not awaiting `Promise.all` or mixing up microtasks with `setTimeout`.

This lab builds on [24-event-loop.md](24-event-loop.md), [26-promises.md](26-promises.md), and [27-async-await.md](27-async-await.md).

## What you'll do

- Implement `delay(ms)` on top of a Promise
- Predict, then verify, the output order in a mix of sync / Promise / setTimeout code
- Write `fakeFetch` and `loadAll` with no real network involved
- Implement `retry` with a pause between attempts

**Time:** ~40-55 minutes.
**Where the code lives:** `courses/javascript-basic/examples/lab/`.

---

## Setup

Files:

```text
lab/
  async-utils.js    # delay, retry, loadAll, fakeFetch
  28-order.js       # output order
  28-demo.js        # retry and loadAll scenarios
```

In `package.json` (or a separate file), make sure `"type": "module"` is set so `28-order.js` can use top-level await.

---

## Task 1. `delay(ms)`

File `async-utils.js`:

```javascript
export function delay(ms) {
  return new Promise((resolve) => {
    // TODO: setTimeout → resolve()
  });
}
```

### Check

```javascript
import { delay } from "./async-utils.js";

console.time("delay");
await delay(100);
console.timeEnd("delay"); // roughly 100 ms
```

### Criteria

- Returns a Promise
- Doesn't reject for a positive `ms`
- (Optional) `delay(0)` still schedules a macrotask — discuss with [24-event-loop.md](24-event-loop.md)

---

## Task 2. Output order — `28-order.js`

Copy the code below, **predict** the order of letters in a comment first, then run it:

```javascript
console.log("A");

setTimeout(() => console.log("B"), 0);

Promise.resolve().then(() => console.log("C"));

await Promise.resolve();

console.log("D");
```

### Expected breakdown (compare after running)

In an ES module with top-level await, the order is: **`A`, `C`, `D`, `B`**.

| Step | What happens |
|-----|----------------|
| 1 | `console.log("A")` — runs synchronously |
| 2 | `setTimeout` queues `B` as a **macrotask** |
| 3 | `Promise.then` queues `C` as a **microtask** |
| 4 | `await Promise.resolve()` suspends the module; the stack empties → microtask **C** runs |
| 5 | The module resumes → synchronous **D** |
| 6 | Next macrotask → **B** |

If you run the same code **inside** an `async function` without top-level await, the order can differ: `D` ends up after that function's own microtasks, but still before `B`. Use a separate module file for this lab.

In a comment at the top of the file, explain:

- why `B` doesn't run right after `A`;
- which lines are microtasks and which are macrotasks;
- what `await Promise.resolve()` did to the rest of the module.

Run it:

```bash
node lab/28-order.js
```

---

## Task 3. `fakeFetch` and `loadAll`

In `async-utils.js`:

```javascript
export function fakeFetch(url) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url.includes("error")) {
        reject(new Error(`404 ${url}`));
      } else {
        resolve({
          ok: true,
          json: async () => ({ url, items: [] }),
        });
      }
    }, 50);
  });
}

export async function loadAll(urls) {
  // TODO: Promise.all
  // on any error — throw a new Error that mentions the url from the reason
}
```

### Requirements for `loadAll`

```javascript
const data = await loadAll([
  "http://api/items",
  "http://api/users",
]);
// data.length === 2, each element is the result of json()
```

On error:

```javascript
try {
  await loadAll(["http://api/ok", "http://api/error-page"]);
} catch (e) {
  console.log(e.message); // should contain "error" or the failing url
}
```

### Hint

```javascript
export async function loadAll(urls) {
  try {
    const responses = await Promise.all(urls.map((url) => fakeFetch(url)));
    return Promise.all(responses.map((r) => r.json()));
  } catch (err) {
    throw new Error(`loadAll failed: ${err.message}`);
  }
}
```

Improve the message so it's clear **which** URL failed (for example, wrap each fetch individually).

---

## Task 4. `retry`

```javascript
export async function retry(fn, attempts = 3, delayMs = 100) {
  // call fn() (returns a Promise)
  // on reject — wait delayMs and try again
  // once attempts are exhausted — throw the last error
}
```

### Example

```javascript
let calls = 0;
async function flaky() {
  calls += 1;
  if (calls < 3) throw new Error("temporary");
  return "ok";
}

const result = await retry(flaky, 5, 50);
console.log(result, calls); // ok, 3
```

### Important

- `fn` is called fresh on every attempt
- the delay happens **between** attempts, not before the first one
- use your `delay(delayMs)`

### Template

```javascript
export async function retry(fn, attempts = 3, delayMs = 100) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await delay(delayMs);
    }
  }
  throw lastError;
}
```

---

## Task 5. Demo `28-demo.js`

Put together the following scenarios:

```javascript
import { delay, fakeFetch, loadAll, retry } from "./async-utils.js";

// 1. retry on fakeFetch with an "error" url — succeeds once fn switches urls
// 2. loadAll on 3 successful urls
// 3. in parallel: Promise.all([delay(100), fakeFetch("/x")]) — timing ~100ms, not 150
```

---

## Task 6. (Optional) Bridge to FastAPI

If [deploy/fastapi](../../deploy/fastapi/README.md) is running:

```javascript
const res = await fetch("http://localhost:8090/health");
console.log(res.status, await res.json());
```

Compare with `fakeFetch`: the same `ok` + `json()` steps, but over a real network.

---

## Success criteria

- [ ] `28-order.js` — comment with the correct order (A, C, D, B for an ES module) and an explanation
- [ ] `delay(100)` measured with `console.time` is roughly 100 ms
- [ ] `loadAll` fails with a clear message for an `error` url
- [ ] `retry` retries on reject and returns the result on success
- [ ] No unhandled rejection when running the demo

---

## Common mistakes in this lab

1. **`setTimeout(resolve, ms)` without a Promise wrapper** — forgot the wrapper.

2. **Expected the order A, B, C, D** — didn't account for microtasks ([24-event-loop.md](24-event-loop.md)).

3. **`loadAll` without `await Promise.all`** — returned an array of Promises instead.

4. **`retry` without await delay** — instant spam of retries.

5. **`retry` only catches synchronous throws** — you need `await fn()`.

6. **Swallowing the original error** — `throw lastError`, not `return undefined`.

---

## Course connections

- Event loop: [24-event-loop.md](24-event-loop.md)
- Promises: [26-promises.md](26-promises.md)
- async/await: [27-async-await.md](27-async-await.md)
- Real HTTP: [29-fetch.md](29-fetch.md), `:8090`
- Errors: [32-error-handling.md](32-error-handling.md)

The `retry` pattern will come in handy for flaky network calls to the BFF, and again in nodejs-intermediate (rate limiting, backoff).

---

## Lab summary

You've put together a minimal "async toolkit": delay, parallel loading, retry on failure, and a solid grasp of event loop ordering. This is the foundation before `fetch` against FastAPI, and before mocking APIs in tests in javascript-testing.

---

## Checklist before submitting

- Are all exports from `async-utils.js` used in the demo?
- Does running `node lab/28-order.js` match your comment?
- Do your demo calls have `.catch` or `try/catch`?
- Do you understand the difference between a `fakeFetch` reject and a real HTTP 404?

Next lesson: [29. fetch](29-fetch.md).
