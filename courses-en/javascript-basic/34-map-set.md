# 34. Map, Set, WeakMap, WeakSet

## A scenario from work

An endpoint returns 10,000 orders; you need to **group them by `customerId`** and remove duplicate tags. A junior writes:

```javascript
const cache = {};
cache[userObj] = profile; // [object Object] as the key — a bug
```

A senior suggests a `Map`. In another ticket: a "memory leak" — a global `Map` holds references to DOM nodes after they're removed from the document; the review suggests a `WeakMap`.

`Object`, `Map`, and `Set` solve similar problems, but with **different semantics**. This chapter is about when to choose which and how not to shoot yourself in the foot.

## Map — an associative collection with any key

```javascript
const byId = new Map();

byId.set(1, { name: "Ann", role: "admin" });
byId.set("1", { name: "Bob", role: "user" }); // a different key!
byId.set(true, { name: "Flag" });

console.log(byId.get(1));    // Ann
console.log(byId.get("1"));    // Bob
console.log(byId.size);        // 3
```

Keys are compared by **SameValueZero** (like `===`, but `NaN` equals `NaN`).

### An object as a key — by reference

```javascript
const user = { id: 7 };
const meta = new Map();

meta.set(user, { lastLogin: "2024-06-18" });

console.log(meta.get(user)); // works

const otherRef = { id: 7 };
console.log(meta.get(otherRef)); // undefined — a different object!
```

This is exactly why `obj[someObject]` in a plain object **doesn't work** as expected: the key is coerced to the string `"[object Object]"`.

### The core Map API

| Method | Action |
|-------|----------|
| `set(key, value)` | add/update |
| `get(key)` | get or `undefined` |
| `has(key)` | whether the key exists |
| `delete(key)` | delete, return a boolean |
| `clear()` | clear |
| `size` | number of records |

```javascript
const m = new Map([["a", 1], ["b", 2]]); // from an iterable of pairs

for (const [key, value] of m) {
  console.log(key, value);
}

for (const key of m.keys()) { /* ... */ }
for (const value of m.values()) { /* ... */ }

m.forEach((value, key) => {
  console.log(key, value);
});
```

**Iteration order** — insertion order (ES2015+).

## Map vs a plain Object

| Criterion | `Map` | `Object` |
|----------|-------|----------|
| Keys | any type | string, Symbol |
| Size | `.size` O(1) | `Object.keys().length` |
| Frequent add/delete | optimized | slower |
| JSON.stringify | not serialized directly | yes |
| Prototype | a clean collection | may have inherited keys |
| Iteration | built-in | `Object.entries` |

**Object** — when it's a fixed "record" (DTO, config literal):

```javascript
const user = { name: "Ann", age: 30 };
```

**Map** — an index, a cache, grouping with dynamic keys:

```javascript
const sessions = new Map(); // sessionId -> Session
```

## Set — a collection of unique values

```javascript
const tags = new Set(["js", "web", "js", "api"]);

tags.add("node");
tags.add("js"); // the duplicate is ignored

console.log(tags.size);       // 4
console.log(tags.has("web")); // true

tags.delete("web");
```

### Deduplicating an array

```javascript
const ids = [1, 2, 2, 3, 1, 4];
const unique = [...new Set(ids)];
// [1, 2, 3, 4]
```

### Set operations (manually)

```javascript
function union(a, b) {
  return new Set([...a, ...b]);
}

function intersection(a, b) {
  return new Set([...a].filter((x) => b.has(x)));
}

function difference(a, b) {
  return new Set([...a].filter((x) => !b.has(x)));
}
```

Set compares **primitives by value** and **objects by reference**:

```javascript
const s = new Set();
s.add({ id: 1 });
s.add({ id: 1 });
console.log(s.size); // 2 — two different objects
```

## The groupBy pattern with Map

An analytics task: group products by category.

```javascript
function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(item);
  }
  return map;
}

const products = [
  { id: 1, name: "Keyboard", category: "electronics" },
  { id: 2, name: "Mouse", category: "electronics" },
  { id: 3, name: "Desk", category: "furniture" },
];

const byCategory = groupBy(products, (p) => p.category);

for (const [category, list] of byCategory) {
  console.log(category, list.length);
}
```

ES2024 added `Object.groupBy` / `Map.groupBy` — in older Node check [node.green](https://node.green); the `Map` pattern is universal.

## Map in a domain model

From [22-lab-oop.md](22-lab-oop.md) — a cart with a `Map`:

```javascript
class Cart {
  #items = new Map(); // productId -> CartItem

  add(item) {
    const existing = this.#items.get(item.productId);
    if (existing) {
      existing.increase(item.quantity);
    } else {
      this.#items.set(item.productId, item);
    }
  }

  get size() {
    return this.#items.size;
  }
}
```

`Map` is faster for frequent `get/set/delete` by an arbitrary key than an `Object` with numeric ids.

## WeakMap — weak object keys

```javascript
const privateData = new WeakMap();

function attachSecret(obj, secret) {
  privateData.set(obj, secret);
}

function readSecret(obj) {
  return privateData.get(obj);
}

const user = { name: "Ann" };
attachSecret(user, "token-xyz");
readSecret(user); // token-xyz
```

Properties of WeakMap:

- keys are **objects only** (not primitives);
- a **weak** reference — if the object is no longer used anywhere, the GC **may** collect the record;
- **no** iteration, **no** `.size`;
- not serialized.

Typical use cases:

- metadata of DOM elements;
- private fields before `#` in classes;
- a cache tied to an object's lifetime.

```javascript
// a result cache for request objects
const resultCache = new WeakMap();

function expensiveCompute(requestObj) {
  if (resultCache.has(requestObj)) {
    return resultCache.get(requestObj);
  }
  const result = doWork(requestObj);
  resultCache.set(requestObj, result);
  return result;
}
// when requestObj is GC'd — the WeakMap record disappears
```

## WeakSet

```javascript
const visited = new WeakSet();

function walk(node) {
  if (visited.has(node)) return;
  visited.add(node);
  // traverse neighbors...
}
```

Stores **objects only**, weak references, no iteration. Rarer than WeakMap — marking "already processed" in a graph traversal.

## Converting Map ↔ Object / Array

```javascript
const map = new Map([["a", 1], ["b", 2]]);

// Map → array of pairs
const entries = [...map.entries()];
// or [...map]

// Map → Object (string keys!)
const obj = Object.fromEntries(map);

// Object → Map
const map2 = new Map(Object.entries({ x: 10, y: 20 }));
```

**Careful:** `Object.fromEntries` loses non-string/Symbol keys.

## Serialization

```javascript
const map = new Map([[1, "one"]]);
JSON.stringify(map); // "{}" — an empty object!

// workaround
JSON.stringify([...map.entries()]); // [[1,"one"]]
```

For APIs and files people more often use plain objects or arrays, not Map.

## Relation to other lessons

| Lesson | Relationship |
|------|-------|
| [07-objects.md](07-objects.md) | Object as a record |
| [08-arrays.md](08-arrays.md) | `[...set]` for dedupe |
| [23-iterators-generators.md](23-iterators-generators.md) | Map/Set are iterable |
| [37-lab-collections.md](37-lab-collections.md) | groupBy, parseLog |

## Common mistakes

- **An Object as a key in a plain object** — all keys collapse into `"[object Object]"`.
- **A global cache Map without eviction** — a memory leak; for a long-lived process you need a TTL or a WeakMap.
- **Deduping objects via Set** — duplicates by content aren't removed, only by reference.
- **Confusing `map.get("1")` and `map.get(1)`** — different keys.
- **Looking for `.length` on a Map** — you need `.size`.
- **JSON.stringify(Map)** — expecting data in the file.

## Checklist

- When a **Map**, when a plain **Object**?
- Why are `map.get("1")` and the key `1` different records?
- How do you remove duplicates from an array with a **Set**?
- How does a **WeakMap** differ from a **Map** (GC, iteration, keys)?
- How do you implement **groupBy** with a Map?
- Why doesn't a Set dedupe the objects `{ id: 1 }` and `{ id: 1 }`?

Next lesson: [35. RegExp, JSON, Date](35-regex-json-date.md).
