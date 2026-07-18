# 13. Online Bookstore (lite)

## Введение

Каталог, корзина, заказ — проверка **layering** без полного e-commerce.

---

## Scope MVP

- Add/search book
- Cart add/remove
- Checkout creates order (in-memory)

Out: payment, shipping, auth.

---

## Классы

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

## Подзадачи

**Время:** ~75 мин.

### 13.1 ER diagram (15 мин)

5 сущностей на доске.

### 13.2 Services (30 мин)

Псевдокод `checkout` с inventory check.

### 13.3 Duplicate ISBN (15 мин)

Где ловить — service vs repo?

### 13.4 Test plan (15 мин)

3 unit tests names + assert.

---

## Чек-лист

- [ ] Cart vs Order separation?
- [ ] Repository injected?

**Дальше:** [14. Meeting scheduler](14-meeting-scheduler.md).
