# 32. Error handling: try/catch, throw

## A scenario from work

Friday, production: the logs are empty, but users see a white screen. In the MR you found:

```javascript
try {
  await saveOrder(data);
} catch (e) {}
```

The error is **swallowed** — no Sentry, no `console.error`, no HTTP 500. Another ticket: the API returns 404, the client crashes with a `SyntaxError` — because it parses the HTML error page as JSON. A third case: an `unhandledRejection` in Node — the process exited with code 0, even though the Promise failed.

Reliable JavaScript **anticipates failures**: invalid input, network, disk, bugs. This chapter is about how to catch, throw, classify, and **not hide** errors.

## Model: exceptions vs return values

Two approaches to signal a problem:

| Approach | Example | When it fits |
|--------|--------|---------------|
| **Exception** (`throw`) | `JSON.parse` on a corrupt string | Unexpected failure, can't continue |
| **Result / null** | `parseAge` → `{ ok: false }` | Expected "bad input", part of the API |

```javascript
// exception — the program can't continue without the data
function loadConfig(path) {
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw); // SyntaxError if the file is corrupt
}

// result — the calling code decides what to do
function parseAge(input) {
  const n = Number(input);
  if (!Number.isFinite(n) || n < 0 || n > 150) {
    return { ok: false, error: "invalid age" };
  }
  return { ok: true, value: Math.floor(n) };
}
```

Course rule: **form validation** — often a Result; **a broken config at startup** — throw or `process.exit(1)`.

## try / catch / finally

```javascript
function processUserJson(input) {
  let parsed = null;
  try {
    parsed = JSON.parse(input);
    validateUser(parsed);
    return saveUser(parsed);
  } catch (err) {
    console.error("Failed to process user:", err.message);
    throw err; // rethrow — don't swallow
  } finally {
    cleanupTempFiles(); // runs almost always
  }
}
```

Order of execution:

1. `try` — the normal path.
2. On throw — control goes to `catch` (if the type matches).
3. `finally` — **always** after `try`/`catch`, even if there was a `return` or `throw` in `try`/`catch`.

```javascript
function demo() {
  try {
    return 1;
  } finally {
    console.log("finally runs");
  }
}
demo(); // logs "finally runs", returns 1
```

Exceptions from `finally` **override** a pending return/throw from `try` — rarely use throw in `finally`.

`finally` won't run only on:

- `process.exit()`;
- a fatal process crash;
- an infinite loop before `finally`.

## throw — raising an error

```javascript
function withdraw(balance, amount) {
  if (typeof amount !== "number" || amount <= 0) {
    throw new TypeError("amount must be positive number");
  }
  if (amount > balance) {
    throw new Error("Insufficient funds");
  }
  return balance - amount;
}
```

You can throw **anything**:

```javascript
throw "oops";           // bad — no stack trace
throw { code: 404 };    // bad — not instanceof Error
throw new Error("ok");  // good
```

**Always** `throw new Error(...)` or a subclass — otherwise you lose the stack and uniformity in the logs.

## Built-in error types

| Type | Typical cause |
|-----|------------------|
| `Error` | base, general failures |
| `TypeError` | wrong type, `null.property` |
| `RangeError` | number out of range |
| `ReferenceError` | undeclared variable |
| `SyntaxError` | `JSON.parse`, the JS parser |

```javascript
try {
  JSON.parse("{");
} catch (err) {
  console.log(err.name);    // SyntaxError
  console.log(err.message); // Expected property name...
}
```

Type check:

```javascript
if (err instanceof SyntaxError) {
  return { ok: false, error: "invalid json" };
}
```

**Caveat:** `instanceof Error` across **different realms** (iframe, vm) can be false — in Node there's usually one realm.

## Custom errors

```javascript
class HttpError extends Error {
  constructor(status, message, body = "") {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new HttpError(res.status, `HTTP ${res.status}`, body);
  }
  return res.json();
}
```

Calling code:

```javascript
try {
  const data = await getJson("/api/items/99");
} catch (err) {
  if (err instanceof HttpError && err.status === 404) {
    console.log("Not found");
  } else {
    throw err;
  }
}
```

Connection to the API: [`fastapi/11-errors`](../../deploy/fastapi/README.md), [`api-design`](../api-design/README.md) — a single `{ detail: "..." }` format on the server and typed errors on the client.

## Error cause (a chain of causes)

ES2022 — the `cause` field:

```javascript
try {
  JSON.parse(input);
} catch (err) {
  throw new Error("Config load failed", { cause: err });
}
```

```javascript
catch (err) {
  console.log(err.message);       // Config load failed
  console.log(err.cause.message); // the original SyntaxError
}
```

Handy for wrappers `getJson`, `readConfig` — you don't lose the root cause.

## Errors in asynchronous code

### Promises

```javascript
fetch(url)
  .then((res) => res.json())
  .catch((err) => {
    console.error(err);
    throw err;
  });
```

A rejected Promise **without** `.catch` / `await` in try — an **unhandled rejection**.

### async/await

```javascript
async function loadProfile(id) {
  try {
    const res = await fetch(`/users/${id}`);
    if (!res.ok) throw new HttpError(res.status, "load failed");
    return await res.json();
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error("Network unavailable", { cause: err });
    }
    throw err;
  }
}
```

`await` **unwraps** a rejection into a throw — caught by the same `try/catch`.

### Top-level in a script

```javascript
async function main() {
  const data = await loadProfile(1);
  console.log(data);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exitCode = 1;
});
```

Without a `.catch` on `main()`, the rejection goes to `unhandledRejection`.

## Node: global handlers

```javascript
process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION:", reason);
  process.exitCode = 1;
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT:", err);
  process.exit(1); // the process is in an undefined state — exit
});
```

In production people add logging (Sentry, Datadog) — see `nodejs-basic`.

**Don't** rely on handlers alone — an explicit `catch` on every async entry point is better.

## try/catch and performance

Setting up `try/catch` is **expensive** only if throw happens **often** in a hot path. For rare errors (parsing, I/O) the overhead is negligible. **Don't** use exceptions for control flow in a loop of a million iterations.

Antipattern:

```javascript
for (const line of lines) {
  try {
    JSON.parse(line);
  } catch {
    /* skip */
  }
}
```

For expected corrupt lines — `safeJsonParse` (lab [33-lab-errors.md](33-lab-errors.md)).

## The Result pattern without libraries

```javascript
export function safeJsonParse(text) {
  if (typeof text !== "string") {
    return { ok: false, error: "expected string" };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const result = safeJsonParse(userInput);
if (!result.ok) {
  showError(result.error);
  return;
}
useData(result.value);
```

TypeScript will later make this a discriminated union — [`typescript-basic`](../javascript-path.md).

## assert — fail fast in development

```javascript
export function assert(condition, message = "Assertion failed") {
  if (!condition) {
    throw new Error(message);
  }
}

function divide(a, b) {
  assert(b !== 0, "division by zero");
  return a / b;
}
```

In production code an API payload is better validated explicitly, not with `assert`.

## Logging vs throw

| Action | throw | log + return |
|----------|-------|--------------|
| Cannot continue | yes | — |
| Expected miss (404) | optional | often yes |
| Internal error | rethrow after log | — |

```javascript
// bad — both swallowing and silence
try {
  await db.save(x);
} catch (e) {}

// better
try {
  await db.save(x);
} catch (err) {
  logger.error({ err, userId: x.id }, "save failed");
  throw err;
}
```

## Connection to fetch and modules

- [29-fetch.md](29-fetch.md) — `fetch` doesn't reject on HTTP 404; check `res.ok` and throw an `HttpError`.
- [30-es-modules.md](30-es-modules.md) — export `HttpError`, `safeJsonParse` from separate files.
- [28-lab-async.md](28-lab-async.md) — `fakeFetch`, `retry` with reject handling.

## Common mistakes

- **An empty `catch {}`** — the most dangerous construct in a codebase.
- **catch (e) and return a default** without a log — a hidden bug for months.
- **Parsing JSON without try/catch** on user input.
- **Forgetting `.catch` on `main()`** in a CLI script.
- **throw a string** instead of an `Error` — no stack in monitoring.
- **Catching all errors the same way** — 404 and 500 need different UX logic.
- **finally with return** — overwrites the return from try (a rare but confusing bug).

## Checklist

- Will `finally` run after a `return` in `try`?
- How does an **expected** validation error differ from an **unexpected** failure?
- Why is an empty `catch` more dangerous than no try at all?
- How do you handle a rejected Promise in an async function?
- Why `throw new Error("wrap", { cause: err })`?
- What is `unhandledRejection` in Node?

Next lesson: [33. Lab: errors](33-lab-errors.md).
