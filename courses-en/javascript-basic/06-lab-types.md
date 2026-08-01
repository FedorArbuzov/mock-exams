# 06. Lab: types and comparison

## Why this lab

On the FastAPI backend at `:8090`, Pydantic rejects `{"age": "twenty"}` with **422 Unprocessable Entity**. The JavaScript layer between a form and the API — a BFF, SSR, a CLI utility — **has no** Pydantic by default. A single `Number(form.age)` without a check turns `""` into **0** and `"abc"` into **NaN**, which flows onward into JSON. This lab trains what the schema does in the Python track: **predict behavior before running** and **explicitly** convert and compare.

Two skills:

1. **Quiz mindset** — like in an interview and in a PR "what does this log?". Reinforcing [04-primitives.md](04-primitives.md) and [05-coercion-comparison.md](05-coercion-comparison.md).
2. **Defensive parsing** — functions like `parseAge`, `getPort` that don't leak NaN and don't overwrite a valid `0`.

The shop domain: age for restricted categories, the BFF dev server port (3000 vs bind `0`), query params from the URL as **strings**. The same pitfalls as when integrating with [`deploy/fastapi`](../../deploy/fastapi/README.md).

## Prerequisites

- Read [04. Primitives](04-primitives.md) and [05. Coercion and comparison](05-coercion-comparison.md).
- Directory: `courses/javascript-basic/examples/`.

```bash
cd courses/javascript-basic/examples
```

Don't peek at `solutions/` before your attempt. Wrong predictions in task 1 are a **normal part of learning**; mark them in a comment.

---

## Task 1. Prediction table

**Context:** a senior in review drops in the one-liner `console.log([] == ![])` — not to write it that way, but to check whether you read chapter 05.

Create `lab/06-predict.js`. For **each** line, **first** a comment with the expected result, **then** the `console.log`:

```javascript
console.log(typeof null);
console.log(typeof NaN);
console.log("5" + 2);
console.log("5" - 2);
console.log(0 == false);
console.log(0 === false);
console.log(null == undefined);
console.log("" == 0);
console.log(Boolean([]));
console.log(Boolean(""));
```

Run `node lab/06-predict.js`. For mismatches — a comment `# was unexpected: …` and a short rule (falsy, `+` vs `-`, `==`).

**Success criterion:** at least 10 "prediction → fact" pairs; at least one corrected error in a comment (if you guessed them all — voluntarily add `console.log(null === undefined)` and explain).

---

## Task 2. Age parser

**Context:** the "Age" field from an HTML form or CSV import is always a string or empty. The shop API may require an integer 0–120.

`lab/06-parse-age.js`:

```javascript
function parseAge(input) {
  // TODO: return a number (integer) or null if invalid
  // Do not return NaN to the outside
  // Use Number, Number.isFinite, Number.isInteger — no ==
}

console.log(parseAge("25"));    // 25
console.log(parseAge("25.5"));  // 25 or 26 — document your choice in a comment
console.log(parseAge(""));      // null
console.log(parseAge("abc"));   // null
console.log(parseAge(null));    // null
console.log(parseAge(undefined)); // null
```

**Hints:** `Number("") === 0` — why an empty string is not "a valid 0 years." `parseInt("25.9", 10)` vs `Math.trunc(Number(...))` — pick one and describe it.

---

## Task 3. Safe port default

**Context:** a Node BFF config before proxying to FastAPI at `:8090`:

```javascript
// config.json examples
// {}                    → default 3000
// { "port": 8080 }      → 8080
// { "port": 0 }         → 0 (OS picks ephemeral — in tests)
// { "port": null }      → 3000
```

`lab/06-port-default.js`:

```javascript
function getPort(config) {
  // TODO: config.port; if null/undefined — 3000;
  // if explicitly 0 — keep 0 (don't replace with the default)
}

console.log(getPort({}));              // 3000
console.log(getPort({ port: 8080 }));  // 8080
console.log(getPort({ port: 0 }));     // 0
console.log(getPort({ port: null }));  // 3000
console.log(getPort({ port: undefined })); // 3000
```

**Hint:** `??`, not `||`. Add a comment: what would `config.port || 3000` break for `port: 0`.

Optional: what would `getPort({ port: "" })` return with your implementation? Do you need a guard?

---

## Task 4. Falsy quiz

**Context:** a feature flag `if (config.feature)` — an empty array of enabled rules `[]` is still truthy; a `0` discount is falsy.

In `lab/06-falsy.md` (markdown) answer with a list: which values print **`NO`**?

```javascript
function check(v) {
  console.log(v ? "YES" : "NO");
}
```

Values to check in the Node REPL or a small script `lab/06-falsy-check.js`:

`0`, `-0`, `""`, `"0"`, `[]`, `{}`, `null`, `undefined`, `NaN`, `0n`

For each **NO** — one phrase "why falsy." For the debatable **YES** (`"0"`, `[]`) — why truthy and how to correctly check for "empty" (`.length`, `=== ""`).

`document.all` (browsers) — skip it in Node; mention in the markdown in one line that it's a legacy oddity.

---

## Task 5 (optional). Strict compare helper

`lab/06-strict-eq.js` — a function:

```javascript
export function sameValue(a, b) {
  // Object.is semantics for NaN and ±0 — see chapter 05
}
```

Checks:

```javascript
console.log(sameValue(NaN, NaN)); // true
console.log(sameValue(+0, -0));   // false
console.log(sameValue(5, "5"));   // false
```

Reinforces the difference between `===` and `Object.is` — useful for the React mental model.

---

## Success criteria

- [ ] `06-predict.js` — comments **before** each log
- [ ] `parseAge` never returns `NaN`
- [ ] `getPort({ port: 0 })` === `0`
- [ ] `06-falsy.md` — all 10 values analyzed
- [ ] You can explain `||` vs `??` out loud using the port example

## If something went wrong

| Symptom | Direction |
|---------|-------------|
| `parseAge("")` → `0` | An empty string is invalid, not zero years |
| `getPort({ port: 0 })` → `3000` | You used `\|\|`, you need `??` |
| All predictions correct on the first try | Add `[] == ![]` with an explanation — don't use it in production |
| ESLint complains about `==` in predict | For a learning file it's acceptable; in production only `===` |

## Course connection

| Next | Connection |
|--------|-------|
| [07. Objects](07-objects.md) | plain objects after JSON.parse |
| [19. `??` and `?.`](19-optional-nullish.md) | nullish in configs |
| [32. Errors](32-error-handling.md) | throw on invalid parse |
| [`fastapi/04-pydantic`](../fastapi/04-pydantic-v2.md) | a parallel to backend validation |

Next lesson (theory): [07. Objects](07-objects.md).
