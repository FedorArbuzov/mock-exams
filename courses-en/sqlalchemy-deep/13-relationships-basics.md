# 13. relationship, back_populates, lazy

## Intro

An FK column alone doesn't give you `product.category.name` — you need a **`relationship()`**. The lazy loading setting determines **when** the SQL fires.

## What you'll learn

- `relationship()`, `back_populates`.
- lazy: select, joined, selectin, raise.
- cascade delete-orphan.

---

## One-to-many

```python
class Category(Base):
    products: Mapped[list["Product"]] = relationship(back_populates="category")

class Product(Base):
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    category: Mapped["Category"] = relationship(back_populates="products")
```

`back_populates` — sync both sides in memory.

---

## lazy strategies

```python
products: Mapped[list["Product"]] = relationship(lazy="selectin")
category: Mapped["Category"] = relationship(lazy="joined")
```

| lazy | Behavior |
|------|----------|
| `select` (default) | separate SELECT on access — **N+1 risk** |
| `joined` | JOIN in parent query |
| `selectin` | IN query for collection |
| `raise` | forbid implicit load — explicit loader only |

Production list endpoints: **never default lazy** on hot paths — [15-eager-loading](15-eager-loading.md).

---

## cascade

```python
items: Mapped[list["OrderItem"]] = relationship(
    back_populates="order",
    cascade="all, delete-orphan",
)
```

Delete order → delete items. `delete-orphan` removes items removed from collection.

---

## ForeignKey ondelete

```python
ForeignKey("categories.id", ondelete="PROTECT")
```

DB rejects category delete if products exist — matches Django PROTECT.

---

## uselist

```python
category: Mapped["Category"] = relationship(uselist=False)  # many-to-one scalar
```

---

## viewonly

```python
stats: Mapped["Stats"] = relationship(viewonly=True)
```

No cascade writes — read-only link.

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Missing FK | relationship can't join |
| Circular back_populates typo | one side broken |
| lazy select in loop | N+1 |

## Summary

relationship() maps object graph. back_populates both sides. lazy controls load timing — default select dangerous in lists.

Next: [14-lab-fk-relationship](14-lab-fk-relationship.md).
