# 15. Lab: `this` context

## Lab goal

Get hands-on with the rules from [14. `this`](14-this.md): losing context when extracting a method, fixing it via the call site, `call`/`apply`, `bind`, and arrows inside methods. After this lab, the `add(1)` → `NaN` or `TypeError` bug shouldn't come up again in code review.

**Time:** ~35–45 minutes.
**Environment:** Node.js LTS, `"type": "module"`.

## Setup

```bash
mkdir -p lab
```

Files:

| File | Purpose |
|------|------------|
| `15-lost-this.js` | calculator, three call styles |
| `15-timer.js` | `setInterval` and `this` |
| `15-emitter.js` | a mini EventEmitter |

Strict mode is on by default in ES modules — a "bare" method call gives `this === undefined`.

---

## Exercise 1. Losing context

### Scenario

The `calculator` object gets passed into a utility `runTwice(fn)` that calls `fn` twice. The `add` method was extracted into a variable — context is lost.

### Starting point

`lab/15-lost-this.js`:

```javascript
const calculator = {
  value: 0,
  add(n) {
    this.value += n;
    return this.value;
  },
  reset() {
    this.value = 0;
  },
};

console.log(calculator.add(5)); // 5

const add = calculator.add;
// console.log(add(1)); // TypeError or NaN — fix it three ways
```

### Requirement

After `calculator.add(5)`, get the result **6** three different ways (separate calls or blocks with comments):

1. **Direct call through the object** — `calculator.add(1)`.
2. **`call` or `apply`** — `add.call(calculator, 1)`.
3. **`bind`** — create `const boundAdd = add.bind(calculator)` and call `boundAdd(1)`.

### Step by step: why it breaks

1. `add` is a function reference with no object attached.
2. `add(1)` — called as a plain function → `this` = `undefined` (strict mode).
3. `undefined.value` → TypeError.

### Verification

```javascript
calculator.reset();
console.log(calculator.add(5)); // 5

console.log(calculator.add(1));           // 6 — approach 1
calculator.reset(); calculator.add(5);
console.log(add.call(calculator, 1));     // 6 — approach 2
calculator.reset(); calculator.add(5);
console.log(add.bind(calculator)(1));       // 6 — approach 3
```

### Criteria

- [ ] All three approaches are documented with comments.
- [ ] You understand which approach creates a **new** function (bind).

---

## Exercise 2. Timer with an arrow

### Scenario

The `timer` object increments `seconds` every 500 ms. Right now `setInterval` uses a regular `function` — `this` doesn't point at `timer`.

### Starting point

`lab/15-timer.js`:

```javascript
const timer = {
  seconds: 0,
  intervalId: null,
  start() {
    this.intervalId = setInterval(function () {
      this.seconds += 1;
      console.log(this.seconds);
    }, 500);
  },
  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  },
};

timer.start();
setTimeout(() => {
  timer.stop();
  console.log("stopped at", timer.seconds);
}, 3100);
```

### Fixes (pick one, note the rest in comments)

**A. Arrow function (recommended):**

```javascript
setInterval(() => {
  this.seconds += 1;
  console.log(this.seconds);
}, 500);
```

**B. `const self = this` (legacy):**

```javascript
const self = this;
setInterval(function () {
  self.seconds += 1;
}, 500);
```

**C. `bind`:**

```javascript
setInterval(function () {
  this.seconds += 1;
}.bind(this), 500);
```

### Verification

Expected output (roughly): `1`, `2`, `3`, `4`, `5`, `6`, then `stopped at 6`.
**Make sure** you call `stop()` — don't leave the interval running in CI or your terminal.

### Criteria

- [ ] `seconds` increases on every tick.
- [ ] The interval is cleared after 3 s.
- [ ] A comment explains why the arrow sees `this` from `start`.

---

## Exercise 3. EventEmitter sketch

### Scenario

A simplified event bus for modules that don't want the `events` npm package. Subscribers register by event name; `emit` calls all of them.

### Signature

```javascript
// lab/15-emitter.js
export function createEmitter() {
  const handlers = Object.create(null);

  return {
    on(event, fn) {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(fn);
      return () => this.off(event, fn); // optional: unsubscribe
    },
    emit(event, ...args) {
      const list = handlers[event];
      if (!list) return;
      for (const fn of list) {
        fn.apply(this, args); // this = emitter — document this
      }
    },
    off(event, fn) {
      const list = handlers[event];
      if (!list) return;
      handlers[event] = list.filter((h) => h !== fn);
    },
  };
}
```

### Documenting `this` in emit

In a JSDoc comment or a plain comment, note:

- When you call `emit("data", payload)`, the subscriber is invoked with **`this` = the emitter object** (if you use `fn.apply(this, args)`).
- Alternative: `this = null` in strict mode — then subscribers shouldn't rely on `this` at all.

Pick one contract and stick to it in the test.

### Verification

```javascript
import { createEmitter } from "./15-emitter.js";

const bus = createEmitter();
const received = [];

bus.on("order:paid", (amount) => {
  received.push(amount);
});

bus.emit("order:paid", 1999);
console.log(received); // [1999]

const log = (x) => console.log("off test", x);
bus.on("test", log);
bus.off("test", log);
bus.emit("test", 1); // should print nothing
```

### Criteria

- [ ] `on` / `emit` / `off` all work.
- [ ] Multiple subscribers to the same event fire in order.
- [ ] The `this` contract in `emit` is documented in a comment.

### Common mistakes

| Symptom | Cause |
|---------|---------|
| Subscriber never fires | Typo in the event name |
| `this` is undefined in the handler | `emit` calls `fn(...args)` without apply |
| Memory leak | No `off` on unmount (in React — removeListener) |

---

## Exercise 4 (bonus). A method as an array callback

```javascript
const repo = {
  items: [1, 2, 3],
  double(x) {
    return x * 2;
  },
};

// Fix this so it returns: [2, 4, 6]
console.log(repo.items.map(repo.double));
```

Hint: `map(repo.double.bind(repo))` or `(x) => repo.double(x)`.

---

## Wrap-up checklist

- [ ] Three ways to call `add` after extracting the method
- [ ] The timer prints increasing seconds and stops on schedule
- [ ] Emitter: on/emit/off, with `this` documented
- [ ] You can explain `call` vs `bind` without hints

## How this connects to the course

| Topic | Lesson |
|------|------|
| Rules for `this` | [14](14-this.md) |
| Arrows | [10](10-functions.md) |
| Callbacks | [25](25-callbacks.md) |
| React classes (legacy) | react-basic |
| Node EventEmitter | nodejs-basic |

## Reflection (1–2 sentences in a comment in `15-lost-this.js`)

When would you **not** use `bind` in new code? (Hint: arrows in callbacks inside a method, React function components.)

Next lesson: [16. Control flow](16-control-flow.md).
