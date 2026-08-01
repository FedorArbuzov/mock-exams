# 13. Lab: closures and factories

## Lab goal

Reinforce [12. Closures](12-closures.md) in practice: private state in a closure, function factories, fixing the classic loop-with-`var` bug. After the lab you should confidently explain **which** environment each returned function retains and why.

**Time:** ~40–50 minutes.  
**Environment:** Node.js LTS, ES modules (`"type": "module"` in `package.json` or the `.mjs` extension).

## Setup

Create a `lab/` directory next to the lessons or in the root of the learning project:

```bash
mkdir -p lab
cd lab
npm init -y
```

In `package.json` add `"type": "module"`. Task files:

| File | Export |
|------|---------|
| `13-rate-limit.js` | `createRateLimiter` |
| `13-memoize.js` | `memoize` (you can copy the template from task 2) |
| `13-stack.js` | `createStack` |
| `13-loop-trap.js` | the fixed script (can be without export) |

Run the check: `node 13-loop-trap.js` or `node --experimental-vm-modules` if needed.

---

## Task 1. Rate limiter (simplified)

### Scenario

An internal script hits a paid API no more than **2 times per 5 seconds**. You need a factory `createRateLimiter(maxCalls, windowMs)` that returns a function `check()`:

- `true` — the call is allowed and counts toward the window;
- `false` — the limit is exhausted, the call is **not** counted.

### Signature

```javascript
// lab/13-rate-limit.js
export function createRateLimiter(maxCalls, windowMs) {
  // TODO: a closure with an array of timestamps (or a counter within the window)
  return function check() {
    // ...
  };
}
```

### Step-by-step hint

1. In the closure, store an array of **timestamps** of successful `check()` calls (the ones that returned `true`).
2. On each `check()`, filter the timestamps: keep only those where `Date.now() - t < windowMs`.
3. If the array length is `< maxCalls` — `push(Date.now())`, return `true`.
4. Otherwise return `false`.

### Manual-check example

```javascript
import { createRateLimiter } from "./13-rate-limit.js";

const check = createRateLimiter(2, 5000);

console.log(check(), check(), check());
// expected: true, true, false

setTimeout(() => console.log(check()), 5100);
// true again after the window
```

### Criteria

- [ ] The first `maxCalls` calls within the window return `true`.
- [ ] The next one in the same window — `false`.
- [ ] After `windowMs` elapses, a slot is freed.
- [ ] State is not stored in a global — only in the closure.

### Common mistakes

| Symptom | Cause |
|---------|---------|
| Always `true` | You don't remove old timestamps |
| Always `false` | You don't clear the window / wrong time comparison |
| The limit lasts "forever" | The counter is in module scope, not in the factory |

---

## Task 2. Memoize

### Scenario

A heavy cart-price calculation is called from the UI many times with the same arguments. Wrap the function in `memoize` so that a repeated call with the same args takes the result from the cache.

### Template

```javascript
// lab/13-memoize.js
export function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
```

### Check

```javascript
import { memoize } from "./13-memoize.js";

const slowSquare = memoize((n) => {
  console.log("computing", n);
  return n * n;
});

slowSquare(5); // computing 5 → 25
slowSquare(5); // no "computing" → 25
slowSquare(6); // computing 6 → 36
```

### Extension (optional)

- Add `memoize.maxSize` and eviction of old keys (LRU).
- Discuss: why `JSON.stringify` is poor for objects with different key orders.

### Criteria

- [ ] A second call with the same arguments doesn't invoke `fn`.
- [ ] Different arguments — separate cache entries.
- [ ] `Map` is not accessible from outside — a private closure.

---

## Task 3. createStack

### Scenario

An expression parser stores intermediate tokens in a stack **without** a class — only a closure and a public API.

### Signature

```javascript
// lab/13-stack.js
export function createStack() {
  const items = []; // private

  return {
    push(v) {
      items.push(v);
      return items.length;
    },
    pop() {
      if (items.length === 0) return undefined;
      return items.pop();
    },
    peek() {
      return items[items.length - 1];
    },
    size() {
      return items.length;
    },
  };
}
```

### Check

```javascript
const s = createStack();
s.push(1);
s.push(2);
console.log(s.peek());  // 2
console.log(s.pop());   // 2
console.log(s.size());  // 1
console.log(s.pop());   // 1
console.log(s.pop());   // undefined
```

### Criteria

- [ ] LIFO: last in — first out.
- [ ] `items` is not accessible from outside.
- [ ] Two `createStack()` calls — independent stacks.

---

## Task 4. Loop trap

### Scenario

Legacy code registers handlers in a loop with `var`. They all print the same number. Fix it — **two** ways in one file (the second one in a comment).

### Source

`lab/13-loop-trap.js`:

```javascript
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => console.log(i));
}
fns.forEach((fn) => fn());
// now: 3, 3, 3 — needed: 0, 1, 2
```

### Solution A: `let`

```javascript
const fns = [];
for (let i = 0; i < 3; i++) {
  fns.push(() => console.log(i));
}
fns.forEach((fn) => fn());
```

### Solution B: factory (leave in a comment)

```javascript
// for (var i = 0; i < 3; i++) {
//   fns.push(((j) => () => console.log(j))(i));
// }
```

### Self-check questions

1. How many `i` bindings are there in solution A?
2. Why the `j` parameter in the IIFE in solution B?

Answers — in [11. Scope](11-scope-hoisting.md) and [12. Closures](12-closures.md).

### Criteria

- [ ] Output is strictly `0`, `1`, `2`, one line per call.
- [ ] The file has a comment with the second approach.

---

## Task 5 (bonus). Debounce

Implement `debounce(fn, delayMs)` — a function that calls `fn` only after a pause of `delayMs` since the last call. Use `let timerId` in the closure and `clearTimeout` / `setTimeout`.

Check: with 10 rapid clicks, `fn` is called once.

---

## Lab summary checklist

- [ ] `createRateLimiter` blocks after the limit and releases after the window
- [ ] `memoize` caches by arguments
- [ ] `createStack` — LIFO, isolated state
- [ ] `13-loop-trap.js` prints 0, 1, 2
- [ ] You can explain out loud which environment the rate limiter's `check` retains

## Course connection

| Topic | Lesson |
|------|------|
| Scope, `let` vs `var` | [11](11-scope-hoisting.md) |
| Definition of a closure | [12](12-closures.md) |
| Functions as values | [10](10-functions.md) |
| Memory / leaks | [12](12-closures.md), [36](36-debugging.md) |
| nodejs rate limit | nodejs-intermediate |

## What to submit (if you're learning with a mentor)

1. Four files in `lab/` with no errors under `node`.
2. A short comment in `13-rate-limit.js`: why the timestamps are in the closure, not in a global.

Next lesson: [14. `this`](14-this.md).
