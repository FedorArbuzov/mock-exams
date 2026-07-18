# 18. Лаба: Product tags M2M

## Цель

Create tags, attach to products, query products by tag, eager load tags.

---

## Шаг 1. Seed tags

```python
with SyncSessionLocal() as s:
    sale = Tag(name="sale")
    bestseller = Tag(name="bestseller")
    s.add_all([sale, bestseller])
    s.commit()
```

---

## Шаг 2. Attach

```python
with SyncSessionLocal() as s:
    p = s.scalar(select(Product).where(Product.sku == "BK-001"))
    sale = s.scalar(select(Tag).where(Tag.name == "sale"))
    p.tags.append(sale)
    s.commit()
```

Verify:

```sql
SELECT * FROM product_tags;
```

---

## Шаг 3. Query by tag

```python
stmt = (
    select(Product)
    .join(Product.tags)
    .where(Tag.name == "sale")
)
products = session.scalars(stmt).unique().all()
```

---

## Шаг 4. Eager load

```python
stmt = select(Product).options(selectinload(Product.tags)).limit(20)
```

Count queries with event listener — [16-lab-n-plus-one](16-lab-n-plus-one.md).

---

## Критерии приёмки

- [ ] Tags linked in product_tags
- [ ] Filter products by tag name
- [ ] selectinload avoids N+1 on tags

Далее: [19-async-engine-session](19-async-engine-session.md).
