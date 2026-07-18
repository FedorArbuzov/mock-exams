# 14. Лаба: Product → Category FK

## Цель

Navigate `product.category`, `category.products`; test PROTECT on delete.

---

## Шаг 1. Navigate

```python
with SyncSessionLocal() as s:
    p = s.scalar(select(Product).where(Product.sku == "BK-001"))
    print(p.category.name)
    c = s.scalar(select(Category).where(Category.slug == "books"))
    print(len(c.products))
```

Enable echo — count queries for `len(c.products)`.

---

## Шаг 2. Create with relationship

```python
with SyncSessionLocal() as s:
    books = s.scalar(select(Category).where(Category.slug == "books"))
    s.add(Product(sku="BK-NEW", title="New Book", price="19.99", category=books))
    s.commit()
```

No manual `category_id` if relationship set.

---

## Шаг 3. PROTECT test

```python
with SyncSessionLocal() as s:
    books = s.scalar(select(Category).where(Category.slug == "books"))
    s.delete(books)
    s.commit()  # IntegrityError
```

---

## Шаг 4. lazy="raise" experiment

Set `relationship(lazy="raise")` on Product.category — access without loader raises.

---

## Критерии приёмки

- [ ] Both directions navigate
- [ ] PROTECT prevents category delete
- [ ] Observed query count with echo

Далее: [15-eager-loading](15-eager-loading.md).
