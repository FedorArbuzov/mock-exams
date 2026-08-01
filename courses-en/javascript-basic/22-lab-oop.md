# 22. Lab: a domain model (OOP)

## Scenario

You're writing the client-side logic for the mock-exams shop track: a cart, line items, a grand total, and a JSON payload for a POST to FastAPI `:8090` ([29-fetch.md](29-fetch.md)). You need a **domain model** with validation, not a "magic" `{ id, qty }` object with no methods. This lesson puts [20-prototypes.md](20-prototypes.md) and [21-classes.md](21-classes.md) into practice.

## What you'll do

- Implement `CartItem` with validation and a line-total calculation
- Implement `Cart` on top of a `Map` with private storage
- Prepare `toJSON()` for serialization
- (Optional) compare it against a closure-based factory
- Check `instanceof` and the prototype chain

**Time:** ~45-60 minutes.
**Where the code goes:** `courses/javascript-basic/examples/lab/` or your own directory with `"type": "module"`.

---

## Setup

```bash
cd courses/javascript-basic/examples
node --version   # LTS 18+
```

Create these files:

```text
lab/
  cart-item.js
  cart.js
  22-proto.js      # prototype demo
  22-demo.js       # usage scenario
```

---

## Task 1. The `CartItem` class

File `cart-item.js`:

```javascript
export class CartItem {
  constructor(productId, name, unitPrice, quantity = 1) {
    // TODO: validation
    // quantity >= 1, unitPrice >= 0, non-empty productId and name
  }

  lineTotal() {
    // unitPrice * quantity
  }

  increase(q = 1) {
    // increase quantity by q, check >= 1 again
    // return this for chaining (optional)
  }

  decrease(q = 1) {
    // decrease, but quantity can't go below 1 — throw otherwise
  }
}
```

### Requirements

| Rule | Behavior |
|---------|-----------|
| `quantity < 1` on creation | `throw new Error(...)` |
| `unitPrice < 0` | `throw new Error(...)` |
| empty `productId` or `name` | `throw new Error(...)` |
| `lineTotal()` | a number, not a string |

### Usage example (check it in `22-demo.js`)

```javascript
import { CartItem } from "./cart-item.js";

const item = new CartItem("SKU-1", "Keyboard", 79.99, 2);
console.log(item.lineTotal()); // 159.98

item.increase(1);
console.log(item.quantity);    // 3

try {
  new CartItem("x", "Bad", -1);
} catch (e) {
  console.log("caught:", e.message);
}
```

### Hints

- Error messages should be **clear** ("quantity must be >= 1").
- `increase`/`decrease` can return `this` for chaining: `item.increase(2).increase(1)`.

---

## Task 2. The `Cart` class

File `cart.js`:

```javascript
import { CartItem } from "./cart-item.js";

export class Cart {
  #items = new Map(); // productId -> CartItem

  add(item) {
    // if item isn't a CartItem — throw
    // if productId already exists — increase the existing item's quantity
    // otherwise put it in the Map
  }

  remove(productId) {
    // remove the entry; if it's missing — silently or throw (pick one and document it)
  }

  get(productId) {
    // return the CartItem or undefined
  }

  total() {
    // sum of lineTotal() over all items
  }

  get size() {
    // number of unique productId values
  }

  toJSON() {
    // an array of plain objects for the API:
    // [{ productId, name, unitPrice, quantity, lineTotal }, ...]
  }

  *[Symbol.iterator]() {
    // optional: for (const item of cart) — see lesson 23
    for (const item of this.#items.values()) {
      yield item;
    }
  }
}
```

### Merge scenario on a repeated `add`

```javascript
const cart = new Cart();
cart.add(new CartItem("A", "Mouse", 25, 1));
cart.add(new CartItem("A", "Mouse", 25, 2)); // same productId
console.log(cart.get("A").quantity); // 3, not two separate entries
```

### `toJSON` and FastAPI

The format should be ready for `JSON.stringify(cart)`:

```javascript
const payload = JSON.stringify(cart);
// sending it: await fetch("http://localhost:8090/...", { method: "POST", body: payload })
```

A `lineTotal` field in the JSON is handy for display; the server can recompute the price itself.

---

## Task 3. Demo scenario `22-demo.js`

```javascript
import { Cart } from "./cart.js";
import { CartItem } from "./cart-item.js";

const cart = new Cart();
cart.add(new CartItem("KB-1", "Keyboard", 99, 1));
cart.add(new CartItem("MS-1", "Mouse", 29, 2));
cart.add(new CartItem("KB-1", "Keyboard", 99, 1)); // merge

console.log("size:", cart.size);
console.log("total:", cart.total());
console.log(JSON.stringify(cart, null, 2));
```

Run it:

```bash
node lab/22-demo.js
```

Check `total` by hand: Keyboard 99x2 + Mouse 29x2 = 198 + 58 = 256 (assuming the KB-1 merge produced quantity 2).

---

## Task 4. Prototypes — `22-proto.js`

Show how the class connects to its prototype ([20-prototypes.md](20-prototypes.md)):

```javascript
import { Cart } from "./cart.js";

const cart = new Cart();

console.log(cart instanceof Cart); // true
console.log(Object.getPrototypeOf(cart) === Cart.prototype); // true
console.log("add" in cart);              // true — method lives on the prototype
console.log(Object.hasOwn(cart, "add")); // false
```

Add a comment: where does the `add` method physically live, and why is `instanceof Cart` true?

---

## Task 5. (Optional) A factory without classes

File `cart-factory.js`:

```javascript
export function createCart() {
  const items = new Map();
  return {
    add(item) { /* same contract */ },
    total() { /* ... */ },
    toJSON() { /* ... */ },
  };
}
```

In a comment at the bottom of the file, compare **roughly how many lines of code** each takes, and answer:

- Which gives you easier privacy (`#items` vs. a `Map` in a closure)?
- Do you actually need `instanceof` in this project?
- What would you pick for the shop client, and why?

---

## Success criteria

- [ ] A negative price or `quantity < 1` on creation throws an `Error`
- [ ] Calling `add` again with the same `productId` **increases** the quantity instead of duplicating the key
- [ ] `total()` matches your manual calculation
- [ ] `toJSON()` / `JSON.stringify(cart)` produces a valid JSON array with no circular references
- [ ] `22-proto.js` includes a comment about the prototype
- [ ] (Optional) the factory comparison comment is there

---

## Common mistakes in this lab

1. **Storing items in an array** — merging gets complicated; a `Map` keyed by `productId` is simpler.

2. **Forgetting the `item instanceof CartItem` check in `add`** — plain objects with no `lineTotal` end up in the cart.

3. **`toJSON` returning the `Map` itself** — `JSON.stringify` would produce `{}`; you need an array or a plain object.

4. **Confusing the cart's `size` with total `quantity`** — size is the number of SKUs, not the sum of units.

5. **Mutating the input `CartItem` during a merge without copying** — if the same item instance is shared across two carts, that's a bug; for this lab, merging the quantity into the existing object already stored in the `Map` is enough.

---

## Connections to the course

- Theory: [20-prototypes.md](20-prototypes.md), [21-classes.md](21-classes.md), [23-iterators-generators.md](23-iterators-generators.md) (the cart's iterator).
- Next: HTTP — [29-fetch.md](29-fetch.md), the [deploy/fastapi](../../deploy/fastapi/README.md) stand.
- Modules: [30-es-modules.md](30-es-modules.md) — `export class`.

---

## Lab summary

You built a small domain layer: validation in the constructor, encapsulation via `#items`, serialization for the API. It's the same approach used in FastAPI's backend layers, just applied on the client before the `fetch` call goes out.

---

## Checklist before submitting

- Does `node lab/22-demo.js` run without errors?
- Do you have `try/catch` tests for invalid data?
- Are the `Error` messages clear?
- Is the JSON ready to POST to `:8090` (fields and types)?

Next lesson: [23. Iterators and generators](23-iterators-generators.md).
