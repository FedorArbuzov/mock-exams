# 09. Lab: a typed product catalog

## Why this lab

In [`javascript-basic/09-lab-objects-arrays`](../javascript-basic/09-lab-objects-arrays.md) you loaded `products.json` and ran into shallow copy. Here — a **typed** shop catalog: `interface Product`, a union of statuses, a `readonly` snapshot, narrowing for «raw» JSON. This is a mini data model that `nodejs-basic` will wire to FastAPI **:8090**; for now the source is a local file or an inline array.

Skills:

1. Assemble a **types module** and functions on top of it.
2. Separate the **DTO** (as received) from the **domain** logic (filters, prices).
3. Apply a **type guard** to `unknown` after `JSON.parse`.

## Prerequisites

- Read [07](07-interfaces-objects.md) and [08](08-narrowing.md).
- Completed [06-lab-unions](06-lab-unions.md).
- Directory: `courses/typescript-basic/examples/`.

```bash
cd courses/typescript-basic/examples
mkdir -p lab/data
```

Create `lab/data/products.json`:

```json
[
  {
    "id": 1,
    "sku": "KB-001",
    "title": "Keyboard",
    "price": 79.99,
    "status": "active",
    "discount": null,
    "category": "electronics"
  },
  {
    "id": 2,
    "sku": "MS-002",
    "title": "Mouse",
    "price": 29.99,
    "status": "active",
    "discount": 5,
    "category": "electronics"
  },
  {
    "id": 3,
    "sku": "DS-010",
    "title": "Desk",
    "price": 199.0,
    "status": "archived",
    "discount": null,
    "category": "furniture"
  }
]
```

---

## Task 1. The types module

`lab/09-types.ts`:

```typescript
export type ProductStatus = "active" | "archived" | "draft";

export interface Product {
  readonly id: number;
  sku: string;
  title: string;
  price: number;
  status: ProductStatus;
  discount: number | null;
  category: string;
}

export type Catalog = readonly Product[];
```

Export the types for use in the other lab files.

---

## Task 2. Loading and a guard

`lab/09-load-catalog.ts`:

```typescript
import { readFileSync } from "node:fs";
import type { Catalog, Product, ProductStatus } from "./09-types.js";

const VALID_STATUSES: ProductStatus[] = ["active", "archived", "draft"];

function isProductStatus(s: string): s is ProductStatus {
  return (VALID_STATUSES as string[]).includes(s);
}

function isProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "number" &&
    typeof o.sku === "string" &&
    typeof o.title === "string" &&
    typeof o.price === "number" &&
    typeof o.status === "string" &&
    isProductStatus(o.status) &&
    (o.discount === null || typeof o.discount === "number") &&
    typeof o.category === "string"
  );
}

function loadCatalog(path: string): Catalog {
  const raw: unknown = JSON.parse(readFileSync(path, "utf-8"));
  if (!Array.isArray(raw)) {
    throw new Error("Catalog must be an array");
  }
  const products: Product[] = [];
  for (const item of raw) {
    if (!isProduct(item)) {
      throw new Error("Invalid product in catalog");
    }
    products.push(item);
  }
  return products;
}

const catalog = loadCatalog("lab/data/products.json");
console.log("Loaded:", catalog.length, "products");
```

```bash
npx tsx lab/09-load-catalog.ts
```

**Success criteria:** `Loaded: 3 products`. Corrupt one `status` in the JSON — the script should throw.

---

## Task 3. Filters and effective price

`lab/09-catalog-utils.ts`:

```typescript
import type { Catalog, Product } from "./09-types.js";

export function filterActive(catalog: Catalog): Product[] {
  return catalog.filter((p) => p.status === "active");
}

export function effectivePrice(p: Product): number {
  if (p.discount === null) {
    return p.price;
  }
  return Math.max(0, p.price - p.discount);
}

export function totalActiveValue(catalog: Catalog): number {
  return filterActive(catalog).reduce((sum, p) => sum + effectivePrice(p), 0);
}
```

`lab/09-report.ts`:

```typescript
import { loadCatalog } from "./09-load-catalog.js"; // move loadCatalog to an export or copy the catalog import
import { filterActive, totalActiveValue } from "./09-catalog-utils.js";

// Simplify: import catalog from a single place
```

More practical: in `09-load-catalog.ts` add `export { loadCatalog }` and in the report:

```typescript
import { loadCatalog } from "./09-load-catalog.js";
import { filterActive, totalActiveValue } from "./09-catalog-utils.js";

const catalog = loadCatalog("lab/data/products.json");
const active = filterActive(catalog);
console.log("Active:", active.map((p) => p.sku).join(", "));
console.log("Total value (active):", totalActiveValue(catalog).toFixed(2));
```

Expected: `KB-001, MS-002` and the sum `79.99 + 24.99 = 104.98`.

---

## Task 4. Index signature for attributes (optional)

`lab/09-attributes.ts`:

```typescript
interface ProductAttributes {
  color?: string;
  warranty?: string;
  [key: string]: string | undefined;
}

function formatAttributes(attrs: ProductAttributes): string {
  return Object.entries(attrs)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

console.log(formatAttributes({ color: "black", material: "plastic" }));
```

---

## Task 5. Connection to :8090 (a comment)

In `lab/09-notes.md` briefly answer (5–10 sentences):

1. How is this `Product` similar to the FastAPI `GET /api/v1/items` response?
2. What is **missing** compared to Pydantic on the backend?
3. What's the next step in `nodejs-basic` for real HTTP?

---

## Success criteria

- [ ] Types in `09-types.ts`; `Catalog` is readonly
- [ ] `loadCatalog` accepts only valid JSON
- [ ] `filterActive` and `totalActiveValue` — correct numbers
- [ ] `tsc --noEmit` with no errors on `lab/09-*.ts`
- [ ] `09-notes.md` — the connection to mock-exams :8090

## If something went wrong

| Symptom | Direction |
|---------|-------------|
| ENOENT products.json | path from `examples/`; cwd under `tsx` |
| Invalid product | check `status` and the types in the JSON |
| Cannot assign readonly | `Catalog` is readonly — return a new array from filter |
| import .js in .ts | `moduleResolution: NodeNext` — the `.js` extension in the import |

## Related courses

| Next | Relation |
|--------|-------|
| Next chapters of typescript-basic | generics, tsconfig strict flags |
| `nodejs-basic` | `fetch` to :8090, shared types |
| [`javascript-basic/09`](../javascript-basic/09-lab-objects-arrays.md) | the same domain without types |
| [`fastapi`](../fastapi/README.md) | the contract source |

Congratulations on the **types + objects** block in typescript-basic. Next in the course plan — generics, utility types, `strict` flags; per [`javascript-path`](../javascript-path.md) — a deeper TS dive and the transition to Node.

Next lesson (per the course plan): **10. Arrays and tuples** *(the file will be added in later course iterations)*.

## Checklist

- [ ] The types module is separated from the logic
- [ ] `isProduct` narrows `unknown` → `Product`
- [ ] You understand the readonly catalog snapshot
- [ ] You can explain the gap between a TS interface and Pydantic
- [ ] You're ready to wire a real API on :8090 in nodejs-basic
