# 08. Arrays and higher-order methods

## Intro: a story from work

Shop admin dashboard: "Show me the top 5 electronics items under $100, sorted by name." A junior writes three nested `for` loops, gets an off-by-one on the index, and mutates the source array with `.sort()` and no comparator — prices 10, 2, 1 turn into 1, 10, 2. A senior does it in 15 minutes:

```javascript
products
  .filter((p) => p.category === "electronics" && p.price < 100)
  .toSorted((a, b) => a.name.localeCompare(b.name))
  .slice(0, 5);
```

Code review on a React component: `setItems(items.sort(...))` — **sort mutates** state in place; React never sees a new reference. Fix: `toSorted`, or `[...items].sort()`.

An async bug in a BFF:

```javascript
const ids = userIds.map(async (id) => fetchItem(id));
console.log(ids); // [Promise, Promise, ...] — not the data!
```

You need `Promise.all` — see [26-promises.md](26-promises.md).

Arrays are the workhorse for JSON lists coming from FastAPI on `:8090` (`items`, `orders`). This chapter covers **mutability, map/filter/reduce, searching, sorting**, and immutability patterns for future React state.

## What you'll learn

- Arrays as objects with indices; **length**, mutating methods.
- **`map`**, **`filter`**, **`reduce`** — the declarative way to process collections.
- **`find`**, **`some`**, **`every`**, **`includes`**.
- **Sorting**, and the trap of the default string-based sort for numbers.
- **`forEach` vs `map`**, spread/rest with arrays.
- **`flat`**, **`flatMap`**, method chains.
- Immutability patterns for a shop catalog.

## An array: an ordered collection

```javascript
const products = [
  { id: 1, name: "Keyboard", price: 79.99 },
  { id: 2, name: "Mouse", price: 29.99 },
  { id: 3, name: "Desk", price: 199.0 },
];

products[0].name;   // "Keyboard"
products.length;    // 3
products[products.length - 1]; // last
```

An array is an **object** with a special prototype (`Array.prototype`). `typeof [] === "object"`; use `Array.isArray()` to check.

### Mutating operations

```javascript
const nums = [10, 20];
nums.push(30);      // [10, 20, 30] — appends, returns new length
nums.pop();         // 30, array is now [10, 20]
nums.unshift(5);    // prepend
nums.shift();       // remove the first element
nums.splice(1, 1);  // remove 1 element starting at index 1
```

### Non-mutating (or return-a-new-array) operations

```javascript
nums.slice(0, 1);   // copy of a portion, [10]
nums.concat([99]);  // new array
[...nums, 99];      // spread — idiomatic
```

ES2023 gives you **non-mutating** counterparts:

```javascript
[3, 1, 2].toSorted((a, b) => a - b);   // [1, 2, 3], original unchanged
[1, 2, 3].toReversed();                // [3, 2, 1]
```

**Sparse arrays** (holes): `[1, , 3]` — rarely needed; `map` skips empty slots.

## `map`: transform every element

```javascript
const prices = [79.99, 29.99, 199.0];
const withTax = prices.map((p) => Math.round(p * 1.2 * 100) / 100);
// new array, prices unchanged

const names = products.map((p) => p.name);
// ["Keyboard", "Mouse", "Desk"]
```

The callback receives `(element, index, array)`. **Always** return a value (or use an implicit return without `{}`):

```javascript
// Bug:
products.map((p) => { p.name.toUpperCase(); }); // undefined each time — forgot the return

// OK:
products.map((p) => p.name.toUpperCase());
```

## `filter`: select by condition

```javascript
const cheap = products.filter((p) => p.price < 50);
// [{ id: 2, name: "Mouse", price: 29.99 }]

const electronics = products.filter((p) => p.category === "electronics");
```

An empty result is `[]`, which is truthy! Check `.length` instead.

## `reduce`: fold into a single value

```javascript
const total = products.reduce((sum, p) => sum + p.price, 0);
// 308.98

const byCategory = products.reduce((acc, p) => {
  const cat = p.category ?? "other";
  acc[cat] = (acc[cat] ?? 0) + p.price;
  return acc; // must return acc
}, {});
```

Almost always specify the **initial value** for the accumulator explicitly. Without it, an empty array throws a TypeError; with a single-element array, that element becomes the accumulator (a nasty surprise).

Grouping orders by status, tallying inventory — these are the typical `reduce` use cases in the shop domain.

## Searching and checks

```javascript
products.find((p) => p.id === 2);       // object or undefined
products.findIndex((p) => p.id === 999); // -1

products.some((p) => p.price > 100);    // true — at least one
products.every((p) => p.price > 0);     // true — all of them

products.includes(products[0]); // false — includes checks objects by reference!
[1, 2, 3].includes(2);          // true for primitives
```

Looking up an object by id — use `find`, not `includes`.

## Sorting

The default sort is **string-based**:

```javascript
[10, 2, 1].sort(); // [1, 10, 2] — lexicographic!
"10" < "2" as strings
```

Numeric:

```javascript
[10, 2, 1].sort((a, b) => a - b); // [1, 2, 10]
products.toSorted((a, b) => a.name.localeCompare(b.name));
```

**`sort` mutates** — in immutable code, use `toSorted` or `[...arr].sort()`.

## `forEach` vs `map`

```javascript
products.forEach((p) => console.log(p.name)); // undefined return, side effects only

const ids = products.map((p) => p.id); // [1, 2, 3] — new array
```

Don't reach for `map` if you're throwing away the result. Don't reach for `forEach` if you need an array back (no chaining). Use `for...of` when you need `break`/`continue`.

## Spread and rest

```javascript
const a = [1, 2];
const b = [...a, 3, 4]; // [1, 2, 3, 4]

function head(first, ...rest) {
  console.log(first, rest);
}
head(1, 2, 3); // 1, [2, 3]

const [top, second, ...others] = products;
```

Copying an array with `[...products]` is shallow; nested objects are still shared.

## `flat` and `flatMap`

```javascript
[1, [2, 3], 4].flat(); // [1, 2, 3, 4]
[1, [2, [3]]].flat(2); // depth

products.flatMap((p) => [p.name, p.price]); // interleave
// alternative: map + flat(1)
```

## Method chains

```javascript
const result = products
  .filter((p) => p.price < 100)
  .map((p) => ({ ...p, label: `${p.name} ($${p.price})` }))
  .toSorted((a, b) => a.name.localeCompare(b.name));
```

Readability beats golf. Break the chain into named steps once it grows past 4-5 operations.

## Immutability: updating the catalog

```javascript
function applyDiscount(products, percent) {
  return products.map((p) => ({
    ...p,
    price: Math.round(p.price * (1 - percent / 100) * 100) / 100,
  }));
}

function removeProduct(products, id) {
  return products.filter((p) => p.id !== id);
}
```

Lab [09-lab-objects-arrays.md](09-lab-objects-arrays.md) drills this on `products.json`.

## Async inside `map` — a trap

```javascript
// WRONG for sequential intent without await:
userIds.map(async (id) => {
  const res = await fetch(`http://localhost:8090/api/v1/items/${id}`);
  return res.json();
});
// Returns Promise[] — you need:
// await Promise.all(userIds.map(async (id) => { ... }));
```

Covered in detail in [27-async-await.md](27-async-await.md).

## How this connects to the rest of the course

| Lesson | Connection |
|------|------|
| [07. Objects](07-objects.md) | array elements are objects; shallow copy |
| [09. Lab](09-lab-objects-arrays.md) | shop products JSON |
| [17. Spread](17-destructuring-spread.md) | `[...arr]`, destructuring |
| [23. Iterators](23-iterators-generators.md) | `for...of` over arrays |
| [29. fetch](29-fetch.md) | the items array from the API |
| [`fastapi/17-pagination`](../fastapi/17-pagination-filters.md) | lists + total on the backend |

## Common mistakes

**Mutating state, then setting state with the same reference.** In React, always hand it a new array reference.

**Numeric sort without a comparator.** `[10,2,1].sort()` gives the wrong order.

**A `map` callback with `{` and no return.** Silently produces an array of undefined.

**`reduce` without an initial value** on empty or single-element arrays.

**`find` vs `filter[0]`** — `find` stops early; `filter` scans everything.

**`async` inside `map` without `Promise.all`.** Yields an array of pending promises.

**Confusing `slice` (copy) with `splice` (mutate).** `splice` returns the removed elements.

## Summary

Arrays are ordered collections with a rich API. **`map`/`filter`/`reduce`** are the main style for processing shop lists. Mutators (`push`, `sort`) vs immutable alternatives (`toSorted`, spread) — pick deliberately. Sorting numbers requires a comparator. Chains stay readable for ETL over JSON from `:8090`; async work needs `Promise.all`.

## Checklist

- [ ] How does `slice` differ from `splice`?
- [ ] What does `[10,2,1].sort()` return without a comparator?
- [ ] What happens with `reduce` on `[]` and no initial value?
- [ ] When does `find` return `undefined`?
- [ ] Write `totalByCategory(products)` using a single `reduce`
- [ ] Why is `setItems(items.sort())` dangerous in React?
- [ ] How do you get the actual data out of `ids.map(async ...)`?

Next lesson: [09. Lab: objects and arrays](09-lab-objects-arrays.md).
