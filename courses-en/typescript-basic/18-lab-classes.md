# 18. Lab: Product class hierarchy

## Why this lab

You reinforce [16-classes](16-classes.md) and [javascript-basic/21-classes](../javascript-basic/21-classes.md): `Product`, `DiscountProduct`, `Sellable`, `#stock` in `Inventory`. Categories from [17-enums-const](17-enums-const.md). `toJSON` / `fromDto` — the bridge to a POST to FastAPI `:8090` (`title` vs `name`).

**Time:** ~50–65 minutes.

---

## Structure

```text
lab/catalog-constants.ts  sellable.ts  product.ts
lab/discount-product.ts  inventory.ts  18-demo.ts
```

---

## Task 1. Category constants

```typescript
export const Category = {
  Electronics: "electronics",
  Furniture: "furniture",
} as const;

export type Category = (typeof Category)[keyof typeof Category];

export const CATEGORY_LABELS = {
  [Category.Electronics]: "Electronics",
  [Category.Furniture]: "Furniture",
} as const satisfies Record<Category, string>;
```

---

## Task 2. `Sellable` and `Product`

`Product implements Sellable`: parameter properties, getter/setter `price`, `describe()`, `toJSON()`, `static fromDto(dto)` — `title` → `name`, category validated via `Object.values(Category)`.

---

## Task 3. `DiscountProduct`

`extends Product`, `discountRate` 0..1, `override displayPrice` and `describe()`.

---

## Task 4. `Inventory`

`#stock = new Map<number, number>()`, `restock`, `reserve` — quantity > 0, boolean when stock is insufficient.

---

## Task 5. Demo

```typescript
const kb = new Product(1, "Keyboard", 100, Category.Electronics, "KB-001");
const sale = new DiscountProduct(2, "Mouse", 50, Category.Electronics, "MS-01", 0.2);
console.log(sale.displayPrice); // $40.00

const inv = new Inventory();
inv.restock(1, 10);
console.log(inv.reserve(1, 3)); // true, stock 7
```

```bash
npx tsc && node dist/lab/18-demo.js
```

---

## Task 6 (optional). `isSellable`

User-defined guard for `unknown` — [19-type-guards](19-type-guards.md).

---

## Success criteria

- [ ] `implements Sellable`; `override` on the subclass
- [ ] `#stock` inaccessible from outside
- [ ] `fromDto` validates category
- [ ] `toJSON` without extra fields for POST

## If something goes wrong

| Symptom | Solution |
|---------|----------|
| `Category` does not accept string | guard + `Object.values` |
| `implements` on displayPrice | add a getter |
| `protected _price` | use `this.price` |

## Related courses

| Next | Relation |
|------|----------|
| [19-type-guards](19-type-guards.md) | `isSellable` |
| [29-fetch](../javascript-basic/29-fetch.md) | POST items :8090 |

Next lesson: [19. Type guards](19-type-guards.md).

## Checklist

- [ ] `#` vs `private` — a deliberate choice
- [ ] DTO mapper `title` → `name`
- [ ] `satisfies` on labels
