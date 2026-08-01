# 16. Classes with types: `implements`, private, modifiers

## A scenario from work

You're porting [javascript-basic/21-classes](../javascript-basic/21-classes.md) to TypeScript: `DiscountProduct extends Product`, a private `#stock`, an interface `Sellable`. In review: «Why doesn't `implements` duplicate the fields?», «Why `private` in TS if JS already has `#`?», «Why does `readonly` in a parameter property break assignment from outside?»

Classes in TS are runtime JS **plus** a compile-time check; `implements` generates no code but enforces the contract.

## What you'll learn

- Classes with **field types** and **modifiers**
- **`implements`** for an interface
- **`private` (#)** vs **`private` (TS)** vs **`protected`**
- **Parameter properties**, **abstract class**, **generic class**
- When class vs interface/type

---

## A basic class with types

```typescript
class Product {
  constructor(
    public readonly id: number,
    public name: string,
    private _price: number,
    public category: string
  ) {
    if (_price < 0) throw new Error("price cannot be negative");
  }

  get price(): number {
    return this._price;
  }

  set price(value: number) {
    if (value < 0) throw new Error("price cannot be negative");
    this._price = value;
  }

  describe(): string {
    return `${this.name} (${this.id})`;
  }
}
```

**Parameter properties:** `public readonly id` — a field + assignment in one line.

---

## `implements`: a contract without copying

```typescript
interface Sellable {
  readonly price: number;
  describe(): string;
}

class PhysicalProduct extends Product implements Sellable {
  constructor(
    id: number,
    name: string,
    price: number,
    category: string,
    public sku: string
  ) {
    super(id, name, price, category);
  }
}
```

| | `extends` | `implements` |
|---|-----------|--------------|
| Inheritance | Yes | No |
| Runtime | Code | **Erased** |

---

## Private: three levels

```typescript
class Inventory {
  #warehouseStock = new Map<number, number>();

  private log(msg: string): void {
    console.log(msg);
  }

  protected adjust(id: number, delta: number): void {
    const cur = this.#warehouseStock.get(id) ?? 0;
    this.#warehouseStock.set(id, cur + delta);
  }
}
```

| Modifier | Compile-time | Runtime |
|-------------|--------------|---------|
| `#field` | Class | Real privacy |
| `private` | TS | Public in JS |
| `protected` | Class + subclasses | Public in JS |

**In production** for npm packages — `#` if you need a runtime guarantee.

---

## Inheritance with types

```typescript
class DiscountProduct extends Product {
  constructor(
    id: number,
    name: string,
    price: number,
    category: string,
    public readonly discountRate: number
  ) {
    super(id, name, price, category);
    if (discountRate < 0 || discountRate > 1) {
      throw new Error("discountRate must be 0..1");
    }
  }

  get displayPrice(): number {
    return this.price * (1 - this.discountRate);
  }

  override describe(): string {
    return `${super.describe()} -${this.discountRate * 100}%`;
  }
}
```

`override` catches typos in a method name under `noImplicitOverride`.

---

## Static members

```typescript
class Product {
  static fromDto(dto: { id: number; title: string; price: number }): Product {
    return new Product(dto.id, dto.title, dto.price, "general");
  }

  static isValidPrice(n: number): boolean {
    return Number.isFinite(n) && n >= 0;
  }
}
```

Mapping `title` → `name` for the `:8090` response — the DTO / domain boundary.

---

## Abstract class

```typescript
abstract class CatalogEntity {
  abstract get displayName(): string;
  log(): void {
    console.log(this.displayName);
  }
}
```

You can't `new CatalogEntity()` — only subclasses.

---

## Generic class

```typescript
class IdentifiedBox<T extends { id: number }> {
  constructor(private item: T) {}
  get(): T { return this.item; }
}
```

Connection to [13-generics](13-generics.md), [15-lab-generics](15-lab-generics.md).

---

## Class vs interface vs type

| Entity | When |
|----------|-------|
| `interface` | Shape, contract, `implements` |
| `type` | Union, mapped, tuple |
| `class` | Runtime, `new`, invariants |

JSON DTO — interface/type; `Product` with validation — class.

---

## Related courses

| Lesson | Relation |
|------|-------|
| [javascript-basic/21-classes](../javascript-basic/21-classes.md) | prototype, `#` |
| [18-lab-classes](18-lab-classes.md) | Product hierarchy |
| [22-lab-oop](../javascript-basic/22-lab-oop.md) | Cart JS → TS |

---

## Common mistakes

| Mistake | Cause | Fix |
|--------|---------|-------------|
| Expecting fields from `implements` | An interface doesn't create fields | Declare them in the class |
| `private` for secrets in a lib | Erased in JS | `#` |
| Forgetting `super()` | Subclass rule | Before `this` |
| Getter + recursive setter | `this.price = v` | Internal `_price` |

---

## In production

- DTOs from `:8090` — interfaces; the domain with invariants — classes.
- `toJSON()` — explicit fields for POST, not spreading a class instance with extras.
- Arrows as class fields — memory per instance ([javascript-basic/21-classes](../javascript-basic/21-classes.md)).

---

## Summary

TS classes add types, modifiers and `implements`. `#` is runtime privacy; `private`/`protected` are mostly compile-time. Parameter properties reduce boilerplate.

---

## Checklist

- How does `implements Sellable` differ from `extends Product`?
- Why is `#stock` preferable to `private stock`?
- What does `public readonly id` do in a constructor?
- When is `type Product = { ... }` enough?

Next lesson: [17. Enum, const assertions, satisfies](17-enums-const.md).
