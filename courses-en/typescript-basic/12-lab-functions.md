# 12. Lab: typed functions for shop

## Why this lab

In [javascript-basic/09-lab-objects-arrays](../javascript-basic/09-lab-objects-arrays.md) you wrote `filterByCategory` and `applyDiscount` in plain JS. Now the same scenarios — with **types**: a `Product[]` catalog, query parameters as a tuple, an id parser for `GET /api/v1/items/{id}` on FastAPI `:8090`. The goal is for `tsc` to catch errors **before** `node`/`fetch`, and for the signatures to read like a mini OpenAPI.

**Time:** ~50–60 minutes. **Environment:** Node LTS, TypeScript (`strict`).

---

## Setup

```bash
cd courses/typescript-basic/examples
npm init -y && npm install -D typescript @types/node tsx
```

`tsconfig.json`: `"strict": true`, `"module": "NodeNext"`, `"include": ["lab/**/*.ts"]`.

`lab/data/products.json` — as in the JS course (3 products: Keyboard, Mouse, Desk).

```text
lab/types.ts  12-query.ts  12-parse.ts  12-format.ts  12-run.ts
```

---

## Task 1. Domain types

`lab/types.ts`:

```typescript
export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
};

/** A filter pair: [category, maxPrice] */
export type CategoryPriceFilter = readonly [category: string, maxPrice: number];
```

---

## Task 2. Filter and map

`lab/12-query.ts` — implement `filterByCategory`, `filterByCategoryAndMaxPrice` (tuple destructuring), `productLabels` (`map` → `"${name} ($${price})"`). Input — `readonly Product[]`, return — a **new** array.

**Success criteria:** electronics = 2; `["electronics", 50]` → only Mouse; labels for three products.

---

## Task 3. Immutable discount

`applyDiscount(products, percent)` — `percent` 0–100, otherwise `throw`; new objects, price to 2 decimals. The original array is unchanged (`structuredClone` to verify).

---

## Task 4. Id parser (overload)

`lab/12-parse.ts`:

```typescript
export function parseIds(input: string): number[];
export function parseIds(input: readonly string[]): number[];
export function parseIds(input: string | readonly string[]): number[] { /* TODO */ }

export function parseItemId(raw: string): number | null { /* TODO: integer > 0 */ }
```

`parseIds("1,2,foo,3")` → `[1,2,3]`. `parseItemId` — for the path segment before the fetch to `:8090`.

---

## Task 5. Price formatting

`FormatPriceFn`, `formatPrice`, `formatLine`. Comment out `products.map(formatPrice)` and save the `tsc` message in a comment — the lesson on callbacks [10-functions](10-functions.md).

---

## Task 6 (optional). Readonly snapshot

`freezeCatalog(products): readonly Product[]` — a comment: why `readonly` doesn't protect against `products[0].price = 0` at runtime.

---

## Running

```bash
npx tsc && node dist/lab/12-run.js
# or: npx tsx lab/12-run.ts
```

---

## Success criteria

- [ ] `npx tsc` strict with no errors
- [ ] Filters don't mutate the input
- [ ] Overloads `parseIds`; `parseItemId("abc")` → `null`
- [ ] A comment about the `map(formatPrice)` error

## If something went wrong

| Symptom | Solution |
|---------|---------|
| `Cannot find module './types.js'` | `moduleResolution: NodeNext`, imports with `.js` |
| `readonly` vs `Product[]` | filter returns a new `Product[]` |
| `parseIds` float | `Number.isInteger` |

## Related courses

| Next | Relation |
|--------|-------|
| [13-generics](13-generics.md) | `first<T>(arr)` |
| [javascript-basic/29-fetch](../javascript-basic/29-fetch.md) | the real `:8090` |
| [`fastapi/06-lab-crud`](../fastapi/06-lab-crud.md) | items contract |

Next lesson: [13. Generics](13-generics.md).

## Checklist

- [ ] Tuple `CategoryPriceFilter` in the filter
- [ ] Overload `parseIds` compiles
- [ ] You understand shallow readonly vs deep immutability
