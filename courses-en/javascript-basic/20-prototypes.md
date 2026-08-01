# 20. Prototypes and the `[[Prototype]]` chain

## A scenario from work

You're debugging a bug: a `toJSON` method "suddenly" appeared on a plain dictionary object, even though you never added it. A colleague asks: "Why is `Array.prototype.map` available on an array, but `map` doesn't show up in `Object.keys(arr)`?" In a code review someone suggests "adding a convenient method" directly to `Object.prototype`. In an interview you hear: "How does inheritance work in JavaScript?" — and the answer "through ES6 classes" is only half right.

Without understanding **prototypes** you can't see where built-in methods come from, how `new` and `class` work, and why modifying global prototypes breaks the whole project.

## What you'll learn

- What the internal `[[Prototype]]` reference is and how it differs from a function's `prototype`
- How the engine looks up a property along the **prototype chain**
- How to create objects with a given prototype via `Object.create`
- How constructor functions work and what the `new` operator does
- How to inherit behavior before `class` existed
- How `hasOwnProperty` / `Object.hasOwn` differ from the `in` operator
- Why you must not extend `Array.prototype` in libraries
- How prototypes relate to the lessons on objects, `this`, and classes

---

## Objects aren't "empty": each one has a prototype

In JavaScript an object is not just a key–value hash table. Every ordinary object has a hidden internal reference **`[[Prototype]]`** (in the ECMAScript specification). Through it an object **inherits** properties and methods from another object if it doesn't find them on itself.

Imagine a library: you have a shelf of books (the object's own properties). If a book isn't on the shelf, you go to the **general catalog** (the prototype) — and so on, until the catalog runs out.

Accessing the prototype in modern code:

```javascript
const animal = {
  eats: true,
  walk() {
    console.log("animal walks");
  },
};

const rabbit = Object.create(animal);
rabbit.jumps = true;

console.log(rabbit.jumps); // true — own property
rabbit.walk();               // "animal walks" — method found on animal
```

**What happens on `rabbit.walk()`:**

1. The engine looks for `walk` on `rabbit` itself — doesn't find it.
2. Follows `[[Prototype]]` to `animal` — finds the `walk` function.
3. Calls it with `this = rabbit` (that's why inside the method `this` points to the calling object).

This is the same mechanic as for `this` in [14-this.md](14-this.md): the method "lives" on the prototype, but `this` when calling `rabbit.walk()` is `rabbit`.

### The deprecated `__proto__`

Old textbooks use `rabbit.__proto__ = animal`. This is a **getter/setter** for `[[Prototype]]`, not a separate data field. In production code prefer `Object.getPrototypeOf`, `Object.setPrototypeOf` (carefully), and `Object.create`.

```javascript
console.log(Object.getPrototypeOf(rabbit) === animal); // true
```

---

## The prototype chain: from rabbit to `null`

Property lookup goes along the chain until it hits `null`:

```text
rabbit  →  animal  →  Object.prototype  →  null
```

```javascript
const rabbit = Object.create(animal);

console.log(rabbit.toString()); // "[object Object]"
```

`toString` is on neither `rabbit` nor `animal` — it comes from **`Object.prototype`**, the root prototype of almost all objects.

Checking "is a property **somewhere** in the chain":

```javascript
console.log("walk" in rabbit);   // true — inherited from animal
console.log("jumps" in rabbit);  // true — own

console.log(rabbit.hasOwnProperty("walk"));  // false
console.log(rabbit.hasOwnProperty("jumps")); // true

console.log(Object.hasOwn(rabbit, "walk"));   // false — modern replacement for hasOwnProperty
```

| Approach | What it checks |
|--------|----------------|
| `obj.key` / `obj["key"]` | The value; `undefined` if absent (or if the value is `undefined`) |
| `"key" in obj` | The key in the object **or** in the prototype chain |
| `Object.hasOwn(obj, "key")` | Only the object's **own** enumerable/non-enumerable properties |

On arrays, `for...in` iterates over inherited enumerable keys too — another reason to prefer `for...of` and array methods ([23-iterators-generators.md](23-iterators-generators.md)).

---

## Constructor functions and `prototype`

Before ES6 classes, objects with shared behavior were created via **constructor functions**:

```javascript
function User(name) {
  this.name = name; // instance fields
}

User.prototype.greet = function () {
  return `Hi, ${this.name}`;
};

const ann = new User("Ann");
const bob = new User("Bob");

console.log(ann.greet()); // "Hi, Ann"
console.log(bob.greet()); // "Hi, Bob"
```

The **function** `User` has a property **`User.prototype`** — the object that becomes the `[[Prototype]]` of the instances.

```javascript
console.log(Object.getPrototypeOf(ann) === User.prototype); // true
console.log(ann.greet === bob.greet); // true — one method on the prototype, not a copy on each instance
```

Memory savings: methods on the prototype, data (`name`) on the instance.

### What `new` does (step by step)

When you write `new User("Ann")`, the engine roughly:

1. Creates a new empty object.
2. Sets its `[[Prototype]]` to `User.prototype`.
3. Calls `User` as an ordinary function with `this` pointing to that object.
4. If `User` didn't return another object, returns the created instance.

The "manual" equivalent (for understanding, not for copying into code):

```javascript
function manualNew(Constructor, ...args) {
  const obj = Object.create(Constructor.prototype);
  const result = Constructor.apply(obj, args);
  return result instanceof Object ? result : obj;
}
```

If you forget `new`, `this` inside the constructor will be the wrong thing (often `undefined` in modules), and the fields will "hang" in the global scope or you'll get an error.

```javascript
function Broken() {
  this.x = 1;
}
// const b = Broken(); // TypeError in strict / garbage in global in non-strict
const ok = new Broken();
```

---

## Inheritance via prototypes (before `class`)

Suppose you need an `Admin` that extends `User`:

```javascript
function Admin(name, level) {
  User.call(this, name); // "call the parent constructor" on this instance
  this.level = level;
}

Admin.prototype = Object.create(User.prototype);
Admin.prototype.constructor = Admin;

Admin.prototype.describe = function () {
  return `${this.greet()}, level ${this.level}`;
};

const root = new Admin("Root", 99);
console.log(root.describe()); // "Hi, Root, level 99"
console.log(root instanceof User);  // true
console.log(root instanceof Admin); // true
```

**Why `Admin.prototype = Object.create(User.prototype)` and not `= User.prototype`?**

The second variant **mutates** the shared `User` prototype when you add `Admin` methods. The first creates an intermediate object as a link in the chain.

The `class Admin extends User` syntax does the same thing, but more safely and readably — [21-classes.md](21-classes.md).

---

## `instanceof` and prototypes

```javascript
console.log(ann instanceof User);   // true
console.log(ann instanceof Object); // true

console.log([] instanceof Array);   // true
console.log([] instanceof Object);  // true
```

`instanceof` checks whether `Constructor.prototype` is in the object's `[[Prototype]]` chain. This is not a "type" check in the TypeScript sense — only a prototype relationship.

In practice: for plain objects people more often check the shape of the data (fields, Zod in typescript-basic) rather than `instanceof Object`.

---

## Built-in prototypes: where `map`, `slice`, `trim` come from

| Constructor | Instance prototype | Example methods |
|-------------|---------------------|-----------------|
| `Array` | `Array.prototype` | `map`, `filter`, `push` |
| `Object` | `Object.prototype` | `toString`, `hasOwnProperty` |
| `String` | `String.prototype` | `trim`, `slice` |
| `Function` | `Function.prototype` | `call`, `apply`, `bind` |

```javascript
const nums = [1, 2, 3];
console.log(Object.getPrototypeOf(nums) === Array.prototype); // true

console.log(Object.keys(nums)); // ["0", "1", "2"] — only own indexes
console.log("map" in nums);     // true — method on Array.prototype
```

When you access properties, primitives are **temporarily wrapped** in objects (boxing):

```javascript
const s = "  hi  ";
console.log(s.trim()); // "hi" — a call to String.prototype.trim
```

### Don't extend other people's prototypes

```javascript
// NEVER do this in a library or shared code
Array.prototype.last = function () {
  return this[this.length - 1];
};
```

If two packages add `last` differently, iteration breaks, or polyfills conflict. In your own code — plain functions or classes.

---

## `Object.create(null)` — a dictionary without inheritance

```javascript
const dict = Object.create(null);
dict.count = 1;

console.log(dict.toString); // undefined — no Object.prototype
console.log("toString" in dict); // false
```

Handy for **pure map-like** structures where keys may be `"constructor"` or `"__proto__"` without surprises. In modern code `Map` is often enough ([34-map-set.md](34-map-set.md)).

---

## `class` — syntactic sugar over prototypes

```javascript
class User {
  constructor(name) {
    this.name = name;
  }
  greet() {
    return `Hi, ${this.name}`;
  }
}

console.log(typeof User); // "function"
console.log(User.prototype.greet); // function — method on the prototype
```

Classes do **not** copy the C++/Java model with separate virtual method tables. Under the hood — the same prototypes and `[[Prototype]]`. The differences are in syntax: a `class` body is in strict mode, methods are non-enumerable, `new` is required.

Comparison of approaches:

| Approach | When it fits |
|--------|----------------|
| Literal `{}` + `Object.create` | Simple objects, one-offs |
| Factory + closure ([12-closures.md](12-closures.md)) | Private state without `#` |
| Constructor + `.prototype` | Legacy, reading old code |
| `class` | New OOP code, inheritance, `extends` |

---

## Relation to the course

- [07-objects.md](07-objects.md) — own properties and references; the prototype explains where the "extra" methods come from.
- [14-this.md](14-this.md) — when calling `obj.method()` the method may live on the prototype, but `this` is `obj`.
- [21-classes.md](21-classes.md) — modern syntax on top of the same model.
- [22-lab-oop.md](22-lab-oop.md) — practice: a cart, `instanceof`, `getPrototypeOf`.
- Later on the track: TypeScript adds **static** types; runtime inheritance stays prototype-based.

In the mock-exams ecosystem, FastAPI/Django models are serialized to JSON — **prototypes are not involved when transferring over the network**. `JSON.stringify` sees only own enumerable data.

---

## Common mistakes

1. **Confusing `__proto__` and `prototype`.** `__proto__` (better: `getPrototypeOf`) is on the **instance**. `prototype` is on the **constructor function** (except arrows and async functions as constructors).

2. **Mutating `Object.prototype` or `Array.prototype`.** You break the entire runtime and third-party libraries.

3. **Thinking `class` is a different inheritance model.** It's a wrapper; in an interview they expect an explanation via the prototype chain.

4. **Checking for methods via `Object.keys`.** On the prototype — use `in` or direct access.

5. **Forgetting `User.call(this, ...)` in the child's constructor** (old style) or `super(...)` in a `class` — the instance ends up without the parent's fields.

6. **Assigning `Child.prototype = Parent.prototype`.** A shared prototype object — the child class's methods overwrite the parent's for everyone.

---

## Summary

Inheritance in JavaScript is **delegation via the `[[Prototype]]` chain**, not copying classes. An object looks for a property on itself, then on the prototype, and so on up to `null`. Constructor functions define shared behavior via `Constructor.prototype`; `new` links the instance to that prototype. `instanceof` and `in` look at the chain; `Object.hasOwn` — only at own keys. ES6 classes are convenient syntax over the same mechanics. Built-in array and object methods live on the built-in prototypes — don't touch them in application code.

---

## Checklist

- Explain the difference between an object's `[[Prototype]]` and a constructor function's `prototype`
- Trace the lookup chain for `toString` on the object `{}`
- What does `new User("Ann")` do in four steps?
- Why is `Object.create(animal)` better than assigning `__proto__` in learning examples?
- Why does `ann.greet === bob.greet` hold for instances of the same constructor?
- Why `Object.create(null)` for dictionaries?
- What does `instanceof` check — and what does it not check?

Next lesson: [21. ES6 classes](21-classes.md).
