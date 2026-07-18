# 17. Many-to-many, association table

## Введение

Product имеет many **Tags**; Tag на many **Products**. Junction table **`product_tags`** — Core `Table`, not ORM class (usually).

## Что вы узнаете

- Association table pattern.
- secondary= on relationship.
- Association object pattern (extra columns on link).

---

## Simple M2M

```python
product_tags = Table(
    "product_tags", Base.metadata,
    Column("product_id", ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

class Product(Base):
    tags: Mapped[list["Tag"]] = relationship(secondary=product_tags, back_populates="products")

class Tag(Base):
    products: Mapped[list["Product"]] = relationship(secondary=product_tags, back_populates="tags")
```

Эталон: [`models.py`](../../deploy/sqlalchemy/stack/shop/models.py).

---

## Manipulate M2M

```python
sale = Tag(name="sale")
product = session.scalar(select(Product).where(Product.sku == "BK-001"))
product.tags.append(sale)
session.commit()
```

Or:

```python
product.tags = [tag1, tag2]  # replaces collection
```

---

## selectinload M2M

```python
select(Product).options(selectinload(Product.tags))
```

Two queries: products, then tags+association.

---

## Association object (when link has data)

If junction needs `added_at`, `weight`:

```python
class ProductTag(Base):
    __tablename__ = "product_tags"
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), primary_key=True)
    tag_id: Mapped[int] = mapped_column(ForeignKey("tags.id"), primary_key=True)
    added_at: Mapped[datetime] = mapped_column(server_default=func.now())
    product: Mapped["Product"] = relationship(back_populates="tag_links")
    tag: Mapped["Tag"] = relationship(back_populates="product_links")
```

More verbose — use when metadata on link matters.

---

## Django comparison

| Django | SQLAlchemy |
|--------|------------|
| `tags = models.ManyToManyField` | secondary= Table |
| through= model | association object |

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| Duplicate tags in list | set semantics manually |
| Forgot cascade on M2M table | orphan links |
| Appending unsaved Tag | flush first |

## Резюме

M2M via secondary Table or association class. append()/remove() on relationship. selectinload for eager tags.

Далее: [18-lab-tags-m2m](18-lab-tags-m2m.md).
