# 14. Lab: Product → Category FK

## Goal

Navigate `product.category`, `category.products`; test PROTECT on delete.

---

## Step 1. Navigate

```python
with SyncSessionLocal() as s:
    p = s.scalar(select(Product).where(Product.sku == "BK-001"))
    print(p.category.name)
    c = s.scalar(select(Category).where(Category.slug == "books"))
    print(len(c.products))
```

Enable echo — count queries for `len(c.products)`.

---

## Step 2. Create with relationship

```python
with SyncSessionLocal() as s:
    books = s.scalar(select(Category).where(Category.slug == "books"))
    s.add(Product(sku="BK-NEW", title="New Book", price="19.99", category=books))
    s.commit()
```

No manual `category_id` if relationship set.

---

## Step 3. PROTECT test

```python
with SyncSessionLocal() as s:
    books = s.scalar(select(Category).where(Category.slug == "books"))
    s.delete(books)
    s.commit()  # IntegrityError
```

---

## Step 4. lazy="raise" experiment

Set `relationship(lazy="raise")` on Product.category — access without loader raises.

---

## Success criteria

- [ ] Both directions navigate
- [ ] PROTECT prevents category delete
- [ ] Observed query count with echo

Next: [15-eager-loading](15-eager-loading.md).
