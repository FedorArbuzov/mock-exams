# 07. Objects: properties, references, copying

## Intro: a story from work

A bug in the shop cart: a user applied a promo code, and the discount "kicked in" for every active session. Root cause — a **single** `defaultConfig` object in the module; the function `applyPromo(cart, config = defaultConfig)` **mutated** `config.discount`, so every call saw the latest value. In Python you'd copy a dict with `.copy()`; in JS, spreading `{ ...config }` gives a **shallow** copy — the nested `config.rules` is still shared.

Code review:

```javascript
const user = JSON.parse(req.body);
if (user.isAdmin) grantAccess();
```

Reviewer: "What if the body is `{"isAdmin": true}`?" — objects from JSON are **not validated**; in FastAPI, Pydantic would strip out anything extra on `:8090`. In the JS layer, that's your contract to enforce.

Interview question: "How does `in` differ from `hasOwnProperty`?" — without an answer, you can't figure out where the `toString` property on a "blank" order object came from.

Objects are the shape of **JSON** from an API, of **state** in React, of **options** passed into functions. Understanding **references**, **shallow/deep copy**, and **iteration** is required before you get to prototypes and classes.

## What you'll learn

- Object literals, property access, computed keys.
- **Reference semantics** — why two names can point to one object.
- **Shallow vs deep** copying, `structuredClone`, JSON pitfalls.
- Object **methods** and a preview of `this`.
- **Iterating** properties: `keys`, `entries`, `values`.
- **`in` vs `hasOwn`**, `Object.freeze` / `seal`.
- **JSON** as the exchange format with the FastAPI shop API.

## An object: a key-value collection

```javascript
const product = {
  id: 1,
  name: "Keyboard",
  price: 79.99,
  category: "electronics",
  inStock: true,
};
```

Keys are **strings** or **Symbol**s (ES6). The number `1` becomes `"1"`.

### Accessing properties

```javascript
product.name;           // dot — when the key is known and a valid identifier
product["price"];       // bracket — dynamic key
const field = "category";
product[field];         // "electronics"

// Invalid identifier keys
const row = { "order-id": 8842, "1st": true };
row["order-id"];
```

### Computed property names

```javascript
const prefix = "shipping";
const order = {
  id: 8842,
  [prefix + "Address"]: "Berlin",
  [`${prefix}Method`]: "express",
};
order.shippingAddress; // "Berlin"
```

Handy when building an object out of variables — a typical mapper pattern for turning an API response into a UI model.

## Reference semantics: the main source of bugs

**Primitives** are copied by value; **objects** by **reference**:

```javascript
const a = { price: 79.99 };
const b = a;           // b points to the same object
b.price = 59.99;
console.log(a.price);  // 59.99 — a "changed" without a direct assignment

const c = { price: 79.99 };
console.log(a === b);  // true — same reference
console.log(a === c);  // false — different objects, same shape
```

Functions receive a **reference** to the object:

```javascript
function addTax(item) {
  item.price = item.price * 1.2; // mutates caller's object!
  return item;
}

const keyboard = { name: "Keyboard", price: 79.99 };
addTax(keyboard);
console.log(keyboard.price); // 95.988 — a surprise for the caller
```

The **immutable** style is to return a **new** object ([08-arrays.md](08-arrays.md), React):

```javascript
function addTaxImmutable(item) {
  return { ...item, price: item.price * 1.2 };
}
```

## Copying: shallow vs deep

### Shallow copy

```javascript
const original = {
  id: 1,
  name: "Desk",
  meta: { views: 10, featured: false },
};

const copy = { ...original };           // spread
const copy2 = Object.assign({}, original); // equivalent shallow

copy.name = "Standing Desk";
copy.meta.views = 999;

console.log(original.name);       // "Desk" — top-level ok
console.log(original.meta.views); // 999 — nested SHARED!
```

Spread copies only the **top level** of properties. Nested objects and arrays are **shared references**.

### Deep copy

The **JSON hack** (limited):

```javascript
const deep = JSON.parse(JSON.stringify(original));
// Loses: undefined, Symbol, Function, Date (→ string), BigInt
// Doesn't handle circular references
```

**structuredClone** (Node 17+, modern browsers):

```javascript
const clone = structuredClone(original);
clone.meta.views = 1;
console.log(original.meta.views); // 10 — independent
```

For complex graphs and class instances, reach for a library (lodash's cloneDeep) or a domain-specific copy function. For this course, **understanding shallow copy** covers 80% of the bugs you'll hit.

## Object methods

A function stored as a property is a **method**:

```javascript
const cart = {
  items: [],
  add(product) {
    this.items.push(product); // this — cart, when called as cart.add(...)
    return this.items.length;
  },
  total() {
    return this.items.reduce((s, i) => s + i.price, 0);
  },
};

cart.add({ name: "Mouse", price: 29.99 });
console.log(cart.total()); // 29.99
```

ES6 shorthand: `add(product) { }` instead of `add: function(product) { }`. **`this`** gets its own chapter, [14-this.md](14-this.md); for now, just know the method is called through the dot: `cart.add`.

## Iterating over properties

```javascript
const user = { name: "Ann", role: "admin", active: true };

for (const key of Object.keys(user)) {
  console.log(key, user[key]);
}

for (const [key, value] of Object.entries(user)) {
  console.log(`${key}=${value}`);
}

Object.values(user); // ["Ann", "admin", true]
```

`Object.keys` gives you **own** enumerable properties. Properties inherited from `Object.prototype` (`toString`, …) don't show up in `keys`, but **`"toString" in obj`** can still be `true` via the prototype chain — see [20-prototypes.md](20-prototypes.md).

```javascript
const sym = Symbol("internal");
const obj = { a: 1, [sym]: "secret" };
Object.keys(obj);           // ["a"]
Object.getOwnPropertySymbols(obj); // [sym]
```

## Checking whether a property exists

```javascript
"name" in user;                    // true, includes inherited
Object.hasOwn(user, "name");       // true — ES2022, number
user.hasOwnProperty("name");       // true — avoid on objects with null prototype issues

Object.hasOwn(user, "toString");   // false — inherited
"toString" in user;                // true — from prototype
```

For JSON data from an API, you'll usually want **`Object.hasOwn(obj, key)`** or **`key in obj`** if the prototype is a clean plain object.

## Modifying, deleting, descriptors (overview)

```javascript
product.discount = 0.1;
delete product.inStock;

Object.defineProperty(product, "id", { writable: false }); // advanced
```

**Freezing:**

```javascript
Object.freeze(product);  // no add/delete/reassign properties (shallow!)
Object.seal(product);    // can change values, no add/delete
```

`freeze` isn't recursive — nested objects are still mutable.

## Destructuring (preview)

```javascript
const { name, price, category = "misc" } = product;
const { name: productName } = product; // rename

function printItem({ name, price }) {
  console.log(name, price);
}
```

Covered in full in [17-destructuring-spread.md](17-destructuring-spread.md).

## JSON: the bridge to FastAPI and the shop API

An HTTP body run through `JSON.parse` gives you **plain objects**:

```javascript
const json = JSON.stringify(product);
// '{"id":1,"name":"Keyboard","price":79.99,...}'

const parsed = JSON.parse(json);
parsed.id; // 1
```

Quirks of `JSON.stringify`:

- keys are always strings in the JSON text;
- `undefined`, functions, and Symbol are **dropped** from objects or turned into `null` in arrays;
- `Date` becomes an ISO string.

A response from FastAPI on `:8090`:

```javascript
// const res = await fetch("http://localhost:8090/api/v1/items/1");
// const item = await res.json(); // plain object
```

Client-side validation before TypeScript comes in — manual checks, or Zod later on. **try/catch** around `JSON.parse` on user input — see [32-error-handling.md](32-error-handling.md).

```javascript
function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
```

## Plain objects vs Map (preview)

Objects have string keys, a prototype, and are JSON-native. **Map** accepts any key type and preserves insertion order — see [34-map-set.md](34-map-set.md). For turning a list into `{ id → product }`, `reduce` or a Map both work well.

## How this connects to the rest of the course

| Lesson | Connection |
|------|------|
| [04. Primitives](04-primitives.md) | object vs primitive |
| [08. Arrays](08-arrays.md) | arrays are objects too; arrays of product objects |
| [09. Lab](09-lab-objects-arrays.md) | products.json, the shallow-copy trap |
| [14. this](14-this.md) | object methods |
| [17. Destructuring](17-destructuring-spread.md) | spread copy |
| [20. Prototypes](20-prototypes.md) | the chain, `hasOwn` vs `in` |
| [29. fetch](29-fetch.md) | JSON bodies |
| [`api-design`](../api-design/README.md) | JSON field contracts |

## Common mistakes

**Mutating a shared config/default object.** Copy it at the function's entry point: `{ ...defaults, ...overrides }`.

**Assuming spread means deep clone.** Shared nested data — the classic trap in lab 09.

**Thinking `const obj` locks its fields.** It only prevents reassigning `obj` itself.

**`JSON.parse` without try/catch** on user or admin input.

**Confusing `==` for a nested comparison.** `{a:1} === {a:1}` is `false` (different references).

**Trusting `JSON.parse` against prototype pollution** (a legacy-library concern) — plain objects from `JSON.parse` are safe in modern Node.

**Using objects with integer-like keys as if they were arrays.** Use arrays for lists.

## Summary

Objects are associative collections with **reference** semantics. Shallow copy (`spread`, `assign`) doesn't clone nested data. `structuredClone` and JSON give you deep copies, with caveats. Iterate with `Object.keys/entries/values`; check ownership with `Object.hasOwn`. JSON is the lingua franca with the FastAPI shop API. Building new objects instead of mutating sets you up for React and for predictable functions.

## Checklist

- [ ] How does dot access differ from bracket access?
- [ ] After `const b = a` and `b.x = 1` — what is `a.x`?
- [ ] Why isn't `{ ...obj }` a deep copy?
- [ ] How does `in` differ from `Object.hasOwn`?
- [ ] What does `JSON.stringify({ a: 1, b: undefined })` produce?
- [ ] Why avoid mutating a default config object?
- [ ] What does `Object.keys({ a: 1, [Symbol()]: 2 })` return?

Next lesson: [08. Arrays](08-arrays.md).
