# JavaScript Basic — Interview Cheatsheet

Test yourself **without peeking**, then open the answers.

---

## Quick answers

### Types

| Question | Answer |
|--------|-------|
| Primitives | undefined, null, boolean, number, bigint, string, symbol |
| `typeof null` | `"object"` (a historical bug) |
| Falsy | false, 0, -0, 0n, "", null, undefined, NaN |
| `===` vs `==` | strict, no coercion; `==` with coercion |
| `??` vs `\|\|` | `??` only null/undefined; `\|\|` any falsy |

### Scope

| Question | Answer |
|--------|-------|
| TDZ | let/const accessible after the declaration; before — ReferenceError |
| Closure | function + lexical environment, access to outer variables after return |
| `var` in for + setTimeout | one variable i → all callbacks see the final i |

### `this`

| Call | this |
|-------|------|
| `fn()` strict | undefined |
| `obj.m()` | obj |
| arrow | lexical, from the environment |
| `bind(x)` | x |

### Async

```text
sync → microtasks (Promise.then) → macrotask (setTimeout) → …
```

| API | Behavior |
|-----|-----------|
| `Promise.all` | all, or the first error |
| `allSettled` | all results |
| `fetch` | rejects only on network; 4xx/5xx — ok:false |

### Prototypes

- A method is looked up along the `[[Prototype]]` chain up to `null`.
- `class` — syntax over prototype.
- `new Fn()` → an object with `[[Prototype]] = Fn.prototype`.

### Modules

- ESM: `import`/`export`, `"type":"module"`.
- CJS: `require`/`module.exports`.
- Node ESM: the `.js` extension in relative imports.

---

## Mini-snippets

```javascript
// debounce sketch
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// shallow clone
const copy = { ...obj, nested: { ...obj.nested } };

// parallel fetch
const data = await Promise.all(urls.map((u) => fetch(u).then((r) => r.json())));

// safe JSON
function safeJsonParse(s) {
  try {
    return { ok: true, value: JSON.parse(s) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
```

---

## Common traps

1. `[] + {}` → `"[object Object]"`
2. `0.1 + 0.2 !== 0.3`
3. `map(async () => …)` without `Promise.all`
4. State mutation: `arr.push` vs `[...arr, x]`
5. An arrow as an object method — no object `this`
6. `JSON.stringify` loses `undefined`, functions
7. `sort()` without a comparator on numbers
8. `for...in` on arrays

---

## What to learn next

| Topic | Course |
|------|------|
| Types | typescript-basic |
| HTTP server | nodejs-basic |
| UI | react-basic |
| Tests | javascript-testing |
| REST contracts | api-design |
| Event loop in depth | nodejs-basic + python-async |

---

[← README](README.md) · [38-interview-qa](38-interview-qa.md) · [39-capstone](39-capstone.md)
