# 21. ES6 Classes

## A scenario from work

In a product catalog service, every `Product` needs a name, price, and SKU; the price can't go negative; a discounted product overrides the displayed price. A junior dev writes it all into one unstructured object. Code review asks for "a class with validation." In legacy code you see `function User() { ... }` and `User.prototype.save`; in new code, `class User`. At an interview: "Where do a class's methods physically live?" and "How is `#balance` different from `_balance`?"

ES6 classes are the familiar OOP syntax on top of **prototypes** ([20-prototypes.md](20-prototypes.md)). Without them, reading NestJS, DOM errors, or a modern Node backend gets hard.

## What you'll learn

- How to declare a class, a constructor, and instance fields
- Getters, setters, and computed properties
- Static methods and when you need them (factories, utilities)
- `extends` inheritance, calling `super`, and initialization order
- Private fields `#` and how they differ from the `_` convention
- How `class` relates to `prototype` and `instanceof`
- When a class fits and when a closure-based factory is better
- Common mistakes: a forgotten `super`, arrow-methods duplicated per instance

---

## Declaring a class: syntax and what's underneath

```javascript
class Product {
  constructor(name, price, sku) {
    this.name = name;
    this.price = price;
    this.sku = sku;
  }

  describe() {
    return `${this.name} (${this.sku})`;
  }
}

const keyboard = new Product("Keyboard", 79.99, "KB-001");
console.log(keyboard.describe()); // "Keyboard (KB-001)"
```

A class is a **function**; its methods end up on `Product.prototype`:

```javascript
console.log(typeof Product); // "function"
console.log(keyboard.describe === Product.prototype.describe); // true
```

A class body always runs in **strict mode**. Calling `Product()` without `new` throws a `TypeError` (unlike old-style constructors, which had no such guard).

```javascript
// Product(); // TypeError: Class constructor Product cannot be invoked without 'new'
```

---

## Class fields

ES2022 lets you declare fields directly in the class body:

```javascript
class Counter {
  count = 0;           // instance field, initialized on every new
  static max = 100;      // lives on the Counter function itself
  #secret = 0;          // private (see below)

  inc() {
    this.count += 1;
    this.#secret += 1;
    return this.count;
  }
}

const c = new Counter();
console.log(c.inc()); // 1
console.log(c.count); // 1
console.log(Counter.max); // 100
// console.log(c.#secret); // SyntaxError — only accessible inside the class
```

Instance fields are created **after** `super()` runs in a subclass (if there's a parent constructor). Order matters for anything with complex initialization.

---

## Getters and setters

They encapsulate access **logic** without separate `getPrice` / `setPrice` methods:

```javascript
class PricedItem {
  constructor(price) {
    this._price = price;
  }

  get price() {
    return this._price;
  }

  set price(value) {
    if (value < 0) {
      throw new Error("Price cannot be negative");
    }
    this._price = value;
  }

  get displayPrice() {
    return `$${this._price.toFixed(2)}`;
  }
}

const item = new PricedItem(10);
console.log(item.displayPrice); // "$10.00"
item.price = 15;
// item.price = -1; // Error: Price cannot be negative
```

A getter is invoked as a property: `item.displayPrice`, not `item.displayPrice()`.

**Important:** don't write `set price` that assigns `this.price = value` without a backing field — that's infinite recursion. That's why the internal field is usually `_price` or `#price`.

---

## Private fields `#`

Real privacy at the language level (not just a convention):

```javascript
class Wallet {
  #balance = 0;

  deposit(amount) {
    if (amount <= 0) throw new Error("amount must be positive");
    this.#balance += amount;
  }

  get balance() {
    return this.#balance;
  }
}

const w = new Wallet();
w.deposit(100);
console.log(w.balance); // 100
// console.log(w.#balance); // SyntaxError outside the class
```

| Approach | Accessible from outside | Checked at parse time |
|--------|----------------|----------------------------|
| `_balance` | Can be read/written | No |
| `#balance` | Blocked by syntax | Yes |

Private fields **don't** show up in JSON from `JSON.stringify` — only public data does.

---

## Static methods and properties

They belong to the **class**, not the instance:

```javascript
class Product {
  constructor(name, price, sku) {
    this.name = name;
    this.price = price;
    this.sku = sku;
  }

  static fromJSON(json) {
    return new Product(json.name, json.price, json.sku);
  }

  static isValidSku(sku) {
    return typeof sku === "string" && sku.length > 0;
  }
}

const raw = { name: "Mouse", price: 29.5, sku: "MS-01" };
const mouse = Product.fromJSON(raw);
console.log(mouse.name); // "Mouse"
console.log(Product.isValidSku("")); // false
```

The `fromJSON` / `fromAPI` pattern is a convenient validation point when parsing a `fetch` response ([29-fetch.md](29-fetch.md)).

```javascript
console.log(mouse.fromJSON); // undefined — statics aren't on the instance
```

---

## Inheritance: `extends` and `super`

```javascript
class DiscountProduct extends Product {
  constructor(name, price, sku, discount) {
    super(name, price, sku); // must come before `this` in the constructor
    this.discount = discount;
  }

  get displayPrice() {
    const discounted = this.price * (1 - this.discount);
    return `$${discounted.toFixed(2)}`;
  }

  describe() {
    return `${super.describe()} -${this.discount * 100}%`;
  }
}

const sale = new DiscountProduct("Keyboard", 100, "KB-1", 0.2);
console.log(sale.displayPrice); // "$80.00"
console.log(sale.describe());   // "Keyboard (KB-1) -20%"
```

**Rules for `super`:**

- In a subclass's `constructor`, `super(...)` must run **before** the first access to `this`.
- In methods, `super.method()` calls the parent's implementation.

The prototype chain:

```javascript
console.log(sale instanceof DiscountProduct); // true
console.log(sale instanceof Product);         // true
console.log(Object.getPrototypeOf(DiscountProduct.prototype) === Product.prototype); // true
```

---

## `instanceof` and runtime type checks

```javascript
const p = new Product("A", 1, "X");
console.log(p instanceof Product); // true
console.log(p instanceof Object);  // true
```

`instanceof` looks at prototypes, not at "class" in the sense of an interface. For duck typing, checking that a method exists is often enough:

```javascript
function canDescribe(obj) {
  return obj && typeof obj.describe === "function";
}
```

In TypeScript, these checks move to compile time ([typescript-basic](../javascript-path.md)).

---

## Methods: regular vs. arrow fields

```javascript
class Handler {
  label = "btn";

  onClick() {
    console.log(this.label);
  }

  onClickArrow = () => {
    console.log(this.label);
  };
}
```

| Kind | Lives on | `this` when passed as a callback |
|-----|-----------|----------------------------------|
| `onClick() {}` | prototype | lost without bind ([14-this.md](14-this.md)) |
| `onClickArrow = () => {}` | each instance | lexical `this` from the class/constructor |

An arrow field creates a **new function on every instance** — more expensive memory-wise, but convenient for `addEventListener` without `bind`. This was a typical trade-off in React class components; hooks use functions without `this`.

---

## Classes vs. closure-based factories

**Class** — when you need inheritance, `instanceof`, or a single shared method prototype.

**Factory** ([12-closures.md](12-closures.md)) — when a counter or a small API without subclasses is enough:

```javascript
function createCounter(start = 0) {
  let count = start;
  return {
    inc() { return ++count; },
    value() { return count; },
  };
}
```

| Criterion | `class` | factory + closure |
|----------|---------|-------------------|
| Inheritance | `extends` | manual composition |
| Privacy | `#` | variables in the closure |
| Method memory | one on the prototype | per instance, or a shared object |
| Familiarity | Java/C#/OOP | functional style |

React leans on functional components today; classes stick around in Node (errors, some SDKs), NestJS, and the DOM API (`classList` isn't a class, but OOP is everywhere there).

---

## Example: a model for the shop track

A simplified fragment from the mock-exams domain (the full lab is [22-lab-oop.md](22-lab-oop.md)):

```javascript
class CartItem {
  constructor(productId, name, unitPrice, quantity = 1) {
    if (quantity < 1) throw new Error("quantity must be >= 1");
    if (unitPrice < 0) throw new Error("unitPrice cannot be negative");
    this.productId = productId;
    this.name = name;
    this.unitPrice = unitPrice;
    this.quantity = quantity;
  }

  lineTotal() {
    return this.unitPrice * this.quantity;
  }
}
```

Classes like this later get serialized to JSON for a POST to FastAPI `:8090` in the nodejs/react courses.

---

## Connections to the course

- [20-prototypes.md](20-prototypes.md) — the prototype model underneath classes.
- [14-this.md](14-this.md) — class methods and losing `this` in callbacks.
- [22-lab-oop.md](22-lab-oop.md) — a cart, `Map`, `toJSON`.
- [29-fetch.md](29-fetch.md) — `static fromJSON` and request bodies.
- [30-es-modules.md](30-es-modules.md) — `export class Cart` from modules.

---

## Common mistakes

1. **Forgetting `super()` in a subclass constructor** — `ReferenceError: Must call super constructor`.

2. **Using `this` before `super()`** — the same error.

3. **Treating an arrow-as-method in an object literal the same as a class arrow field** — they behave differently; don't confuse them with a regular method.

4. **Expecting `_` to give real privacy** — it's just a team convention.

5. **Duplicating methods per instance without a reason** — unnecessary arrow fields on hot paths.

6. **Calling the class without `new`** — a `TypeError` by design.

7. **A getter with a recursive setter** — `set price(v) { this.price = v }` with no backing field.

---

## Summary

`class` in JavaScript is syntactic sugar over a constructor function and a prototype. The constructor initializes the instance; methods live on `ClassName.prototype`; statics live on the function itself. `extends` and `super` wire up the prototype chain. Private `#` fields give real privacy; getters/setters give controlled access. Choosing between a class and a factory depends on inheritance needs, memory, and team style. For APIs and JSON, what matters is your own enumerable fields and methods like `toJSON` — not class magic — when sending data over the wire.

---

## Checklist

- Where does the `describe()` method physically live for `class Product`?
- Why is `super(name, price, sku)` required in a subclass constructor?
- How does `#sku` differ from `_sku` for code outside the class?
- Why have a static `fromJSON`?
- What happens when you call `Product()` without `new`?
- When is an arrow field preferable to a prototype method?
- What does `p instanceof Product` check?

Next lesson: [22. Lab: OOP](22-lab-oop.md).
