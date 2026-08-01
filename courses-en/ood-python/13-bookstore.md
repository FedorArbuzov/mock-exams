# 13. Online Bookstore (lite)

## Intro

Catalog, cart, order — a test of **layering** without a full e-commerce build.

---

## MVP scope

- Add/search book
- Cart add/remove
- Checkout creates order (in-memory)

Out: payment, shipping, auth.

---

## Classes

```text
Book, Cart, CartItem, Order
CatalogService, CartService, OrderService
BookRepository (Protocol)
```

[08-layering](08-layering.md).

---

## Use cases

1. `add_to_cart(user_id, isbn, qty)`
2. `checkout(user_id) -> Order`
3. `search(query) -> list[Book]`

---

## Sub-tasks

**Time:** ~75 min.

### 13.1 ER diagram (15 min)

5 entities on the whiteboard.

### 13.2 Services (30 min)

Pseudocode for `checkout` with an inventory check.

### 13.3 Duplicate ISBN (15 min)

Where to catch it — service vs repo?

### 13.4 Test plan (15 min)

3 unit test names + assert.

---

## Checklist

- [ ] Cart vs Order separation?
- [ ] Repository injected?

**Next:** [14. Meeting scheduler](14-meeting-scheduler.md).
