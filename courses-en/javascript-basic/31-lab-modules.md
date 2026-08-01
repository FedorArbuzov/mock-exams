# 31. Lab: splitting into modules

The goal is to **assemble a mini-package** `shop/` from separate ES modules: a public API via `index.js`, private helpers inside the files, and a CLI script as the consumer. This is the same cycle as in a real refactor of a monolith from [30-es-modules.md](30-es-modules.md).

**Time:** ~25–35 minutes after the theory (~50–70 min for the 30+31 pair).

## Stand

```bash
cd courses/javascript-basic/examples
node --version   # v20+ or v22+
```

In `package.json` there's already `"type": "module"`. All import paths — **with the `.js` extension**.

The reference — `solutions/lab/shop/` (open it **after** your own attempt).

---

## Architecture

Create a `lab/shop/` directory:

```text
lab/
├── shop/
│   ├── index.js       # re-export of the public API
│   ├── cart.js        # Cart, CartItem (lesson 22)
│   ├── catalog.js     # loadProducts, filterByCategory
│   ├── format.js      # formatPrice(amount, currency)
│   └── data/
│       └── products.json
└── 31-cli.js          # CLI entry point
```

You can copy `lab/data/products.json` from the repository or create your own with at least 3 products (`id`, `name`, `price`, `category`).

---

## Task 1. `format.js` — price formatting

```javascript
// lab/shop/format.js
export function formatPrice(amount, currency = "USD") {
  // Intl.NumberFormat, style: "currency"
}
```

**Verification in the REPL or a temporary file:**

```javascript
import { formatPrice } from "./shop/format.js";
console.log(formatPrice(79.9, "USD"));  // $79.90
console.log(formatPrice(1234.5, "RUB")); // per the ru-RU locale
```

Don't export internal locale constants if they aren't needed outside.

---

## Task 2. `catalog.js` — loading the catalog

Two acceptable approaches (choose one, document it in a comment):

**A. readFile + JSON.parse** (practice with `import.meta.url`):

```javascript
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadProducts() {
  const path = join(__dirname, "data", "products.json");
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}
```

**B. static import of JSON** (Node 20+):

```javascript
import products from "./data/products.json" with { type: "json" };
export async function loadProducts() {
  return products;
}
```

Add:

```javascript
export function filterByCategory(products, category) {
  return products.filter((p) => p.category === category);
}
```

---

## Task 3. `cart.js` — the cart

Move or rewrite it from lab 22:

```javascript
export class CartItem {
  constructor(productId, name, unitPrice, quantity = 1) {
    if (quantity < 1) throw new Error("quantity must be >= 1");
    if (unitPrice < 0) throw new Error("negative price");
    this.productId = productId;
    this.name = name;
    this.unitPrice = unitPrice;
    this.quantity = quantity;
  }

  lineTotal() {
    return this.unitPrice * this.quantity;
  }
}

export class Cart {
  #items = new Map();

  add(item) { /* merge by productId */ }
  total() { /* sum line totals */ }
  toJSON() { /* array for the API */ }
}
```

**Don't import** `catalog.js` from `cart.js` — otherwise it's easy to get a cycle.

---

## Task 4. `index.js` — the public facade

```javascript
// lab/shop/index.js
export { Cart, CartItem } from "./cart.js";
export { loadProducts, filterByCategory } from "./catalog.js";
export { formatPrice } from "./format.js";
```

Internal functions (if any appear) — **without** re-export.

---

## Task 5. CLI `31-cli.js`

```javascript
// lab/31-cli.js
import { Cart, CartItem, loadProducts, formatPrice } from "./shop/index.js";

const products = await loadProducts();
const cart = new Cart();

// TODO: add 2 different products from products
// TODO: print each line item and the total via formatPrice

console.log("Items:", cart.toJSON());
console.log("Total:", formatPrice(cart.total(), "USD"));
```

Run:

```bash
node lab/31-cli.js
```

**Expected output (example):**

```text
Keyboard x1 — $79.90
Mouse x1 — $29.99
Items: [ ... ]
Total: $109.89
```

---

## Task 6. Checking the dependency graph

In a comment in `31-cli.js`, draw an ASCII graph:

```text
31-cli.js → shop/index.js → cart.js, catalog.js, format.js
catalog.js → data/products.json (or fs)
```

Make sure there's **no** arrow `cart.js → catalog.js`.

---

## Success criteria

- [ ] `node lab/31-cli.js` runs without errors
- [ ] `formatPrice(79.9, "USD")` → `$79.90`
- [ ] Public API only via `shop/index.js`
- [ ] No circular imports
- [ ] `Cart` uses a `Map` for line items
- [ ] A module graph in a comment

## If something went wrong

| Symptom | What to check |
|---------|----------|
| `ERR_MODULE_NOT_FOUND` | The `.js` extension in import; the path relative to the file |
| `require is not defined` | A file in an ESM package — only `import` |
| `JSON parse error` | UTF-8, valid JSON in `products.json` |
| `Cart is not defined` | Re-export in `index.js`; import from `./shop/index.js` |
| Empty catalog | `loadProducts` reads the correct path via `import.meta.url` |

## Reflection (2–3 sentences in a comment)

Ask yourself: how would named export simplify the refactor if you rename `formatPrice` to `priceLabel`?

---

Next lesson: [32. Error handling](32-error-handling.md).
