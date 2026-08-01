# 23. Iterators, `for...of`, generators

## A scenario from work

You need to page through an API without loading all 10,000 records into an array at once. In the logs, `for...in` over an array prints extra keys. A colleague writes "their own iterable" for a date range, but `for...of` crashes with `object is not iterable`. In Redux-saga and some libraries you come across `function*` — without understanding generators the code looks like magic.

Iterators are a **single protocol** for traversing collections. Generators are a convenient way to write iterators with pauses and lazy evaluation.

## What you'll learn

- The difference between an **iterable** and an **iterator**
- The `Symbol.iterator` protocol and the result of `next()`
- Why `for...of` is safer than `for...in` for arrays
- How to build your own iterable (a range, a tree, pagination)
- The `function*`, `yield`, `yield*` syntax
- When a lazy sequence beats an array
- An overview of async iterators and `for await...of`
- The connection to spread, destructuring, and built-in types

---

## Iterable and iterator: two levels of the protocol

An **iterable** is an object that has a `[Symbol.iterator]()` method returning an **iterator**.

An **iterator** is an object with a `next()` method that returns `{ value, done }`.

```javascript
const arr = [10, 20, 30];
const iterator = arr[Symbol.iterator]();

console.log(iterator.next()); // { value: 10, done: false }
console.log(iterator.next()); // { value: 20, done: false }
console.log(iterator.next()); // { value: 30, done: false }
console.log(iterator.next()); // { value: undefined, done: true }
```

An array is an iterable; calling `[Symbol.iterator]()` gives an iterator over its elements.

Built-in iterables in modern JS: `Array`, `String`, `Map`, `Set`, `TypedArray`, function arguments, `NodeList` in the DOM, and others.

---

## What triggers an iterable: `for...of`, spread, `Array.from`

```javascript
const letters = ["a", "b", "c"];

for (const ch of letters) {
  console.log(ch); // a, b, c in turn
}

console.log([...letters]); // ["a", "b", "c"]
console.log(Array.from(letters)); // the same
```

`for...of` internally:

1. Takes `letters[Symbol.iterator]()`.
2. Calls `next()` until `done: true`.
3. Assigns `value` to the loop variable.

A **string** is iterable by Unicode code units (emoji surrogate pairs are a separate topic; for characters there is `for...of` with a grapheme iterator in newer APIs).

```javascript
for (const ch of "hi") {
  console.log(ch); // "h", "i"
}
```

---

## `for...of` vs `for...in`

```javascript
const obj = { a: 1, b: 2 };
const list = [10, 20];

for (const key in obj) {
  console.log(key); // "a", "b" — enumerable keys
}

for (const key in list) {
  console.log(key); // "0", "1" and possibly inherited keys from the array!
}

for (const value of list) {
  console.log(value); // 10, 20 — only elements
}
```

| Loop | Suitable for | Iterates over |
|------|--------------|------------|
| `for...in` | plain objects (carefully) | string keys, including inherited ones |
| `for...of` | iterable | values via the iterator protocol |
| `for (let i=0; ...)` | arrays with an index | indexes |

A plain object `{}` is **not iterable** by default — `for...of` over it throws a `TypeError`. For keys — `Object.keys` / `Object.entries`.

```javascript
for (const [key, value] of Object.entries(obj)) {
  console.log(key, value);
}
```

---

## A custom iterable: a range of numbers

```javascript
const range = {
  from: 1,
  to: 5,

  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;

    return {
      next() {
        if (current <= last) {
          return { value: current++, done: false };
        }
        return { done: true };
      },
    };
  },
};

for (const n of range) {
  console.log(n); // 1, 2, 3, 4, 5
}

console.log([...range]); // [1, 2, 3, 4, 5]
```

`this` inside `[Symbol.iterator]` is the `range` object itself; the `current` closure holds the traversal state.

You can return `value: undefined` with `done: true` — it's usually ignored.

---

## Generators: `function*` and `yield`

A generator function returns an **iterator** automatically:

```javascript
function* idGenerator() {
  let id = 1;
  while (true) {
    yield id++;
  }
}

const gen = idGenerator();
console.log(gen.next().value); // 1
console.log(gen.next().value); // 2
console.log(gen.next().value); // 3
```

`yield`:

- **Pauses** the function's execution.
- Preserves the local variables and the entry point.
- Returns `{ value: ..., done: false }` (until we exit the function).

When the generator finishes (return or the end), the next `next()` gives `{ done: true }`.

### A finite generator

```javascript
function* threeSteps() {
  yield "first";
  yield "second";
  return "done";
}

const g = threeSteps();
console.log(g.next()); // { value: "first", done: false }
console.log(g.next()); // { value: "second", done: false }
console.log(g.next()); // { value: "done", done: true }
```

The value from `return` ends up in the final `value` with `done: true`.

### Rewriting range as a generator

```javascript
function* rangeGen(from, to) {
  for (let i = from; i <= to; i++) {
    yield i;
  }
}

for (const n of rangeGen(2, 4)) {
  console.log(n); // 2, 3, 4
}
```

The code is shorter than a manual object with `next`.

---

## `yield*` — delegating to another iterable

```javascript
function* concat(a, b) {
  yield* a;
  yield* b;
}

console.log([...concat([1, 2], ["x"])]); // [1, 2, "x"]
```

`yield*` unwraps a nested iterable into the current generator — handy for trees and nested lists.

```javascript
function* walkTree(node) {
  yield node.value;
  for (const child of node.children) {
    yield* walkTree(child);
  }
}
```

---

## Lazy sequences: why not an array

```javascript
function* readPages(totalPages) {
  for (let page = 1; page <= totalPages; page++) {
  // simulating a request — in reality await fetch(...)
    yield { page, items: [`item-${page}-1`, `item-${page}-2`] };
  }
}

for (const chunk of readPages(3)) {
  console.log(chunk.page, chunk.items.length);
  // process a page without holding all pages in memory
}
```

An `allItems` array of 10,000 elements takes up memory right away; a generator yields one portion at a time.

In the nodejs courses the same technique is used for **streams** and async generators with `yield` after `await`.

---

## An iterable on a class

```javascript
class Team {
  #members = [];

  add(name) {
    this.#members.push(name);
  }

  *[Symbol.iterator]() {
    for (const name of this.#members) {
      yield name;
    }
  }
}

const team = new Team();
team.add("Ann");
team.add("Bob");

for (const name of team) {
  console.log(name); // Ann, Bob
}
```

Connection to [21-classes.md](21-classes.md): a method can be a generator.

---

## Map and Set: iterables of pairs and values

```javascript
const map = new Map([["a", 1], ["b", 2]]);

for (const [key, value] of map) {
  console.log(key, value);
}

for (const value of map.values()) {
  console.log(value);
}
```

Traversal order is insertion order ([34-map-set.md](34-map-set.md)).

---

## Async iterators (overview)

For asynchronous sources — the protocol with `Symbol.asyncIterator` and `for await...of`:

```javascript
async function* fetchPages(urls) {
  for (const url of urls) {
    const res = await fetch(url);
    yield await res.json();
  }
}

// for await (const page of fetchPages(list)) { ... }
```

Details are in [27-async-await.md](27-async-await.md) and nodejs-basic (streams). The syntax resembles generators, but each step can await a Promise.

---

## Where it appears in the industry

- **API pagination** — an async generator instead of recursive callbacks.
- **Redux-saga** — `function*` to describe side effects (a historical stack).
- **DOM iteration** — `document.querySelectorAll` is iterable in modern browsers.
- **React** — not generators, but the idea of "lazy" traversal of children via iterators in the reconciler (internals).

---

## Relation to the course

- [08-arrays.md](08-arrays.md) — an array is iterable; `map`/`filter` create new arrays, a generator — a lazy chain.
- [16-control-flow.md](16-control-flow.md) — loops; `for...of` is the preferred traversal of an iterable.
- [24-event-loop.md](24-event-loop.md) — async iterators and microtasks with `await` inside a generator.
- [29-fetch.md](29-fetch.md) — paginated loading from FastAPI `:8090`.

---

## Common mistakes

1. **Forgetting `[Symbol.iterator]`** — the object isn't iterable, spread and `for...of` crash.

2. **`for...in` over an array** — indexes as strings and inherited properties.

3. **An infinite generator without an exit** — `while(true)` without a `break` in the consumer holds state forever.

4. **Re-traversing a one-time iterator** — the iterator is exhausted; a second pass needs a new `[Symbol.iterator]()`.

5. **Mutating a collection during `for...of`** — unpredictable behavior (especially Map/Set).

6. **Confusing `yield` and `return` in a generator** — only `return` finishes with the final `value` and `done: true`.

---

## Summary

An **iterable** provides `[Symbol.iterator]()`, an **iterator** provides `next()` with `{ value, done }`. `for...of`, spread, and `Array.from` use this protocol. For dictionary objects — `Object.entries`, not `for...of` directly. `function*` generators write iterators with `yield` and preserved state between steps. Lazy sequences save memory on large or infinite data. Async iterators extend the model to `await` between steps.

---

## Checklist

- How does an iterable differ from an iterator?
- What will the fourth `next()` return for the iterator of the array `[1,2]`?
- Why is `for...in` dangerous for arrays?
- How do you make the object `{ from: 1, to: 3 }` traversable in `for...of`?
- What does `yield*` do?
- Why use a generator instead of `Array.from({ length: n }, (_, i) => i)`?
- What is `for await...of` in a nutshell?

Next lesson: [24. Event loop](24-event-loop.md).
