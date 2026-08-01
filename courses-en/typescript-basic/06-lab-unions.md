# 06. Lab: unions and the shop domain

## Why this lab

On FastAPI `:8090` a product has a `status` from a fixed set; the discount is `number | null`. The untyped JavaScript layer lets `status: "activ"` through in the JSON. The lab builds a **typed** piece of the shop catalog — the same entities as in [`javascript-basic/09-lab-objects-arrays`](../javascript-basic/09-lab-objects-arrays.md), but errors are caught by **`tsc`** before `node`.

Two skills:

1. Modeling **unions of literals** and **nullable** fields like in OpenAPI.
2. Writing functions that **narrow** a union ([08-narrowing.md](08-narrowing.md) — a deep dive after the lab).

## Prerequisites

- Read [04](04-primitives-literals.md) and [05](05-unions-intersections.md).
- Directory: `courses/typescript-basic/examples/`.

```bash
cd courses/typescript-basic/examples
```

---

## Task 1. ProductStatus and Product

`lab/06-product-types.ts`:

```typescript
type ProductStatus = "active" | "archived" | "draft";

interface Product {
  id: number;
  sku: string;
  title: string;
  price: number;
  status: ProductStatus;
  discount: number | null;
  description?: string;
}

const keyboard: Product = {
  id: 1,
  sku: "KB-001",
  title: "Keyboard",
  price: 79.99,
  status: "active",
  discount: null,
};

export { Product, ProductStatus, keyboard };
```

Add an **intentionally** invalid object in a `/* ... */` comment with `status: "hidden"` — make sure `tsc` complains. You don't need to uncomment it.

```bash
npx tsc --noEmit lab/06-product-types.ts
```

---

## Task 2. The isActive function

`lab/06-status-guard.ts`:

```typescript
import type { Product, ProductStatus } from "./06-product-types.js";

function isActiveStatus(status: ProductStatus): boolean {
  return status === "active";
}

function filterActiveProducts(products: Product[]): Product[] {
  return products.filter((p) => isActiveStatus(p.status));
}

const catalog: Product[] = [
  keyboard, // import or minimally duplicate it
  { id: 2, sku: "MS-002", title: "Mouse", price: 29.99, status: "archived", discount: 5 },
];

console.log("Active count:", filterActiveProducts(catalog).length);
```

Run: `npx tsx lab/06-status-guard.ts` (or via the shared tsconfig).

**Success criteria:** for a two-product catalog, the output `Active count: 1`.

---

## Task 3. Union ref: id or sku

**Context:** the endpoint `GET /items/{id}` or a search by `sku` — different BFF inputs.

`lab/06-product-ref.ts`:

```typescript
type ProductRef = number | string;

function formatRef(ref: ProductRef): string {
  if (typeof ref === "number") {
    return `id=${ref}`;
  }
  return `sku=${ref}`;
}

console.log(formatRef(42));
console.log(formatRef("KB-001"));
```

In a comment: why you can't call `ref.toFixed()` without `typeof`.

---

## Task 4. ApiResult discriminated union

`lab/06-api-result.ts`:

```typescript
type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; status: number; message: string };
type ApiResult<T> = ApiSuccess<T> | ApiFailure;

function unwrap<T>(result: ApiResult<T>): T {
  if (!result.ok) {
    throw new Error(`HTTP ${result.status}: ${result.message}`);
  }
  return result.data;
}

const ok: ApiResult<Product[]> = {
  ok: true,
  data: [],
};

const fail: ApiResult<Product[]> = {
  ok: false,
  status: 502,
  message: "Bad gateway to FastAPI :8090",
};

// Uncomment one at a time:
// console.log(unwrap(ok));
// console.log(unwrap(fail));
```

Import `Product` — from task 1, or a local type alias `type Product = { id: number }` for brevity.

**Success criteria:** `unwrap(ok)` → `[]`; `unwrap(fail)` throws with text about 502.

---

## Task 5. Nullable discount helper

`lab/06-discount.ts`:

```typescript
function effectivePrice(price: number, discount: number | null): number {
  if (discount === null) {
    return price;
  }
  return Math.max(0, price - discount);
}

console.log(effectivePrice(100, null));
console.log(effectivePrice(100, 15));
console.log(effectivePrice(10, 20));
```

**In a comment:** why `discount?: number` would be different semantics than `number | null` for an API response.

---

## Success criteria

- [ ] `ProductStatus` — a union of three strings; a typo is caught by `tsc`
- [ ] `filterActiveProducts` returns only `active`
- [ ] `formatRef` handles `number` and `string`
- [ ] `unwrap` narrows by the `ok` field
- [ ] `effectivePrice` is correct for null and for discount overflow

## If something went wrong

| Symptom | Direction |
|---------|-------------|
| Cannot find module `./06-product-types.js` | ESM: use the `.js` extension in the import under `module: NodeNext` |
| `status: "hidden"` isn't an error | check strict; the file is outside the tsc project |
| `unwrap` — error on `result.data` | you didn't narrow `ok` — add `if (!result.ok)` |
| `tsx` vs `tsc` paths | run from `examples/` |

## Related courses

| Next | Relation |
|--------|-------|
| [07. Interfaces](07-interfaces-objects.md) | readonly catalog |
| [08. Narrowing](08-narrowing.md) | `in`, `instanceof` |
| [09. Lab objects](09-lab-objects.md) | full catalog |
| [`deploy/fastapi` :8090](../../deploy/fastapi/README.md) | real DTOs |

Next lesson (theory): [07. Interfaces and objects](07-interfaces-objects.md).
