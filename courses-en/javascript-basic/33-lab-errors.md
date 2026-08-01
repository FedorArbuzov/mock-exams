# 33. Lab: reliable functions

The goal is to write a **small error-handling library**: safe parsing, an HTTP wrapper with a typed failure, an assert for invariants, a global handler in Node. All in ES modules, ready to be imported from the capstone and future API clients.

**Time:** ~25–35 minutes after the theory (~50–70 min for the 32+33 pair).

## Stand

```bash
cd courses/javascript-basic/examples
```

Create files in `lab/errors/` (or `lab/33-*.js` — the key is that the imports are consistent).

---

## Task 1. `safeJsonParse`

File `lab/errors/json.js`:

```javascript
/**
 * @param {unknown} text
 * @returns {{ ok: true, value: unknown } | { ok: false, error: string }}
 */
export function safeJsonParse(text) {
  // TODO
}
```

**Requirements:**

- Invalid JSON → `{ ok: false, error: "..." }`, **without throw**.
- A non-string input → `{ ok: false, error: "expected string" }` (or your message).
- Valid JSON → `{ ok: true, value: parsed }`.

**Verification** — `lab/33-json-demo.js`:

```javascript
import { safeJsonParse } from "./errors/json.js";

console.log(safeJsonParse('{"a":1}'));     // ok: true
console.log(safeJsonParse("{"));           // ok: false
console.log(safeJsonParse(123));           // ok: false
console.log(safeJsonParse("null"));        // ok: true, value: null
```

---

## Task 2. `assert`

File `lab/errors/assert.js`:

```javascript
export function assert(condition, message = "Assertion failed") {
  // TODO: throw new Error(message) if !condition
}
```

**Verification:**

```javascript
import { assert } from "./errors/assert.js";

assert(1 + 1 === 2);
try {
  assert(false, "boom");
} catch (e) {
  console.log(e.message); // boom
}
```

---

## Task 3. `HttpError` and `getJson`

File `lab/errors/http.js`:

```javascript
export class HttpError extends Error {
  constructor(status, body = "") {
    super(`HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

/**
 * @param {string} url
 * @param {typeof fetch} [fetchImpl]
 */
export async function getJson(url, fetchImpl = fetch) {
  // TODO
}
```

**Behavior:**

| Situation | Result |
|----------|-----------|
| `res.ok` | the parsed JSON |
| `!res.ok` | `throw new HttpError(status, bodyText)` |
| network (`TypeError` from fetch) | `throw new Error("Network unavailable", { cause: err })` |

**Mock** — reuse the idea from [28-lab-async.md](28-lab-async.md):

```javascript
// lab/33-http-demo.js
import { getJson, HttpError } from "./errors/http.js";

function fakeFetch(url) {
  return Promise.resolve({
    ok: url.includes("ok"),
    status: url.includes("ok") ? 200 : 404,
    text: async () => (url.includes("ok") ? "" : "Not found"),
    json: async () => ({ id: 1 }),
  });
}

function failingFetch() {
  return Promise.reject(new TypeError("Failed to fetch"));
}

// TODO: calls to getJson with fakeFetch and failingFetch
```

Make sure:

```javascript
try {
  await getJson("/error", fakeFetch);
} catch (e) {
  console.log(e instanceof HttpError, e.status); // true 404
}
```

---

## Task 4. Composition: a config loader

`lab/33-config.js` — loading a "config" from a string:

```javascript
import { safeJsonParse } from "./errors/json.js";
import { assert } from "./errors/assert.js";

export function loadConfigFromString(raw) {
  const parsed = safeJsonParse(raw);
  if (!parsed.ok) {
    throw new Error(`Invalid config JSON: ${parsed.error}`);
  }
  const cfg = parsed.value;
  assert(typeof cfg === "object" && cfg !== null, "config must be object");
  assert(typeof cfg.port === "number", "config.port required");
  return cfg;
}
```

Add test calls:

```javascript
console.log(loadConfigFromString('{"port":3000}'));
try {
  loadConfigFromString('{"port":"bad"}');
} catch (e) {
  console.log("expected fail:", e.message);
}
```

---

## Task 5. Global handlers (Node)

`lab/33-handlers.js`:

```javascript
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  process.exitCode = 1;
});

// intentionally "bad" code for demonstration
Promise.reject(new Error("oops without catch"));
```

Run:

```bash
node lab/33-handlers.js
echo exit:$?
```

**Expected:** in stderr `UNHANDLED REJECTION`, exit code ≠ 0 (on Windows check `$LASTEXITCODE`).

In a comment, explain: why production code **must not** rely on this handler alone.

---

## Task 6. The `main().catch` pattern

`lab/33-main.js`:

```javascript
import { getJson } from "./errors/http.js";

async function main() {
  const data = await getJson("https://invalid.test/error");
  console.log(data);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  if (err.cause) console.error("  cause:", err.cause.message);
  process.exitCode = 1;
});
```

With `fakeFetch` instead of a real URL — demonstrate a correct exit path.

---

## Success criteria

- [ ] `safeJsonParse` never throws on broken JSON
- [ ] `getJson` distinguishes HTTP 404 from a network error
- [ ] `HttpError` has `.status` and `.body`
- [ ] `33-handlers.js` demonstrates `unhandledRejection`
- [ ] There's a `main().catch` with `process.exitCode = 1`
- [ ] You understand when to use a Result (`ok: false`) and when to throw

## If something went wrong

| Symptom | What to check |
|---------|----------|
| `getJson` returns undefined | Do you `return await res.json()`? |
| Network isn't wrapped | `catch` only around `fetchImpl`, rethrow with `cause` |
| The handler doesn't fire | rejection in the same tick; add a `setTimeout` for the demo |
| `instanceof HttpError` is false | import from one module, don't duplicate the `class` |

## Reflection

In `lab/33-reflection.md` (3–5 sentences): where in the Task Tracker capstone ([39-capstone.md](39-capstone.md)) will you apply `safeJsonParse` and `HttpError`?

---

Next lesson: [34. Map and Set](34-map-set.md).
