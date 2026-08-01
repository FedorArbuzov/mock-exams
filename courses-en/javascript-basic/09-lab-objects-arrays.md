# 09. Lab: objects and arrays

## Why this lab

The response of `GET http://localhost:8090/api/v1/items` from FastAPI is JSON: an array of objects with `id`, `title`, `price`. The shop React admin and the Node BFF **don't see** Pydantic models — only **plain JavaScript objects** after `JSON.parse` or `res.json()`. Before [29-fetch.md](29-fetch.md) and the `:8090` sandbox, you model the same **catalog domain** locally: `products.json` + `filter`, `map`, `reduce` functions.

The lab ties [07-objects.md](07-objects.md) and [08-arrays.md](08-arrays.md) into a mini-pipeline:

```text
products.json  →  parse  →  query/filter  →  aggregate  →  immutable update
```

This is the same data flow as in [`fastapi/06-lab-crud`](../fastapi/06-lab-crud.md) and the django catalog, but without HTTP — so that the bugs are **yours** (shallow copy, mutate sort), not "CORS" or "502."

**Immutability** in task 4 is a rehearsal for React state: `applyDiscount` must not mutate the array that "came from the server" and sits in the cache. The **shallow trap** in task 5 is a rehearsal for the "but we copied with spread" code review.

## Prerequisites

- Read [07. Objects](07-objects.md) and [08. Arrays](08-arrays.md).
- `"type": "module"` in [`examples/package.json`](examples/package.json) — tasks 2+ can use `export`/`import`.
- Working directory:

```bash
cd courses/javascript-basic/examples
```

---

## Data setup

Create `lab/data/products.json`:

```json
[
  { "id": 1, "name": "Keyboard", "price": 79.99, "category": "electronics" },
  { "id": 2, "name": "Mouse", "price": 29.99, "category": "electronics" },
  { "id": 3, "name": "Desk", "price": 199.0, "category": "furniture" }
]
```

The structure is deliberately close to the shop items API; the `name` vs `title` fields — in the real OpenAPI at `:8090` it may be `title` — when integrating you'll make a mapper `{ ...item, name: item.title }`.

---

## Task 1. Load and overview

**Context:** the offline CLI `node scripts/export-catalog.js` reads a JSON snapshot the same way it will later read an API response into a file.

`lab/09-load.js`:

```javascript
import { readFileSync } from "node:fs";

const raw = readFileSync("lab/data/products.json", "utf-8");
const products = JSON.parse(raw);

console.log("count:", products.length);
console.log("first:", products[0].name);
console.log("categories:", [...new Set(products.map((p) => p.category))]);
```

```bash
node lab/09-load.js
```

**Success criterion:** `count: 3`, first name, two categories with no errors. If `ENOENT` — you're not in `examples/` or there's no `lab/data/products.json`.

Optional: wrap `JSON.parse` in try/catch ([32-error-handling.md](32-error-handling.md)) and print a clear message.

---

## Task 2. Filter and map

**Context:** the "Electronics under €50" UI block — a typical `filter` + `map` on the client before server-side pagination ([`fastapi/17-pagination`](../fastapi/17-pagination-filters.md)).

`lab/09-query.js`:

```javascript
export function filterByCategory(products, category) {
  // return new array, do not mutate products
}

export function namesUnderPrice(products, maxPrice) {
  // names (strings) where price < maxPrice, preserve order
}
```

Check in the same file or `lab/09-query-run.js`:

```javascript
import { readFileSync } from "node:fs";
import { filterByCategory, namesUnderPrice } from "./09-query.js";

const products = JSON.parse(
  readFileSync("lab/data/products.json", "utf-8")
);

console.log(filterByCategory(products, "electronics").length); // 2
console.log(namesUnderPrice(products, 50)); // ["Mouse"]
```

If `import assert { type: "json" }` is supported by your Node — you can import the JSON directly; otherwise `readFileSync` is canonical for the course.

---

## Task 3. Reduce: sum by category

**Context:** an "inventory value by category" dashboard for merchandising.

```javascript
export function totalByCategory(products) {
  // return { electronics: 109.98, furniture: 199 }
  // use reduce; optional round to 2 decimals
}
```

```javascript
console.log(totalByCategory(products));
// { electronics: 109.98, furniture: 199 }
// 79.99 + 29.99 = 109.98
```

**Hint:** the reduce initial value is `{}`; don't forget `return acc`. Floating point: `Math.round(x * 100) / 100`.

---

## Task 4. Immutable update

**Context:** a flash sale −10% — the UI shows the new prices, but the **cache** of the original catalog must not change (TanStack Query, Redux — later).

```javascript
export function applyDiscount(products, percent) {
  // NEW array; each product NEW object; price reduced by percent%;
  // original products unchanged (shallow check: products[0] same ref ok,
  // but products[0].price must match JSON before call)
}
```

Check:

```javascript
const snapshot = JSON.parse(JSON.stringify(products));
const discounted = applyDiscount(products, 10);
console.log(products[0].price === snapshot[0].price); // true
console.log(discounted[0].price < snapshot[0].price);   // true
console.log(discounted !== products);                   // true
```

Use `map` + spread `{ ...p, price: newPrice }`, not `products[i].price = …`.

---

## Task 5. Shallow trap

**Context:** "we cloned the config" — but the nested `meta` is shared; a bug like in the intro of [07-objects.md](07-objects.md).

`lab/09-shallow.js` — code:

```javascript
const a = { meta: { views: 1 }, name: "Keyboard" };
const b = { ...a };
b.name = "Mouse";
b.meta.views = 99;
console.log(a.name);        // ?
console.log(a.meta.views);  // ?
```

**In a comment (5–8 sentences):** the actual output, why `name` and `views` behave differently, how to fix it for nested data (`structuredClone`, deep path copy). The connection to `applyDiscount` — why a spread over a product is enough for the flat `price` but not for the nested `meta`.

Run the file and compare with your prediction.

---

## Task 6 (optional). Sorting the storefront

```javascript
export function sortByName(products) {
  // return NEW array sorted by name localeCompare; do not mutate input
}
```

Use `toSorted` (ES2023) or `[...products].sort(...)`. Verify that `products` is in its original order after the call.

---

## Success criteria

- [ ] JSON reads without crashing from `examples/`
- [ ] `filterByCategory` / `namesUnderPrice` — without mutating the input
- [ ] `totalByCategory` — an object with keys `electronics` and `furniture` for the sample data
- [ ] `applyDiscount` doesn't change `products[0].price` from before the call
- [ ] The comment in `09-shallow.js` explains the nested shared reference
- [ ] The code has at least one `filter`/`map`/`reduce` chain, not just `for`

## If something went wrong

| Symptom | Solution |
|---------|---------|
| `ENOENT lab/data/products.json` | `cd examples`; create the JSON |
| `applyDiscount` changes the original | you mutate in place; use `map` + new objects |
| `109.98000000000002` in reduce | round cents |
| `import` SyntaxError | run from `examples/` with `"type": "module"` |
| `filterByCategory` returns 3 | category comparison is case-sensitive; `"Electronics"` ≠ `"electronics"` |

## Course connection

| Next | Connection |
|--------|-------|
| [10. Functions](10-functions.md) | export functions, pure functions |
| [17. Destructuring](17-destructuring-spread.md) | `{ ...p }` in applyDiscount |
| [29. fetch](29-fetch.md) | products from `:8090` instead of a file |
| [31. Lab modules](31-lab-modules.md) | splitting the query into files |
| [`deploy/fastapi` items API](../../deploy/fastapi/README.md) | the real JSON contract |

Next lesson (theory): [10. Functions](10-functions.md).
