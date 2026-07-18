# 07. DeclarativeBase, Mapped, mapped_column

## Введение

ORM model — Python class ↔ table row. SQLAlchemy 2.0 **typed** mappings: IDE autocomplete, mypy-friendly.

## Что вы узнаете

- `DeclarativeBase`, `__tablename__`.
- `Mapped[T]`, `mapped_column()`.
- `relationship()` preview.
- `__table_args__`: indexes, constraints.

---

## Base and model

```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Numeric
from decimal import Decimal

class Base(DeclarativeBase):
    pass

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)

    products: Mapped[list["Product"]] = relationship(back_populates="category")
```

Эталон: [`shop/models.py`](../../deploy/sqlalchemy/stack/shop/models.py).

---

## mapped_column options

```python
price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
stock: Mapped[int] = mapped_column(default=0)
description: Mapped[str] = mapped_column(default="")
is_active: Mapped[bool] = mapped_column(default=True)
created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

| Option | Meaning |
|--------|---------|
| `primary_key=True` | PK |
| `unique=True` | unique constraint |
| `index=True` | index |
| `nullable=False` | NOT NULL (default for Mapped without Optional) |
| `server_default` | DB-side default |

---

## Optional columns

```python
from typing import Optional

middle_name: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
```

---

## __table_args__

```python
class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_active_category", "is_active", "category_id"),
        UniqueConstraint("category_id", "title", name="uq_product_title_per_category"),
    )
```

---

## ForeignKey

```python
category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="PROTECT"))
```

`on_delete`: CASCADE, PROTECT, SET NULL — match business rules.

---

## repr and __str__

```python
def __repr__(self) -> str:
    return f"<Product sku={self.sku!r}>"
```

Debugging sessions — not for user display.

---

## Don't create_all in prod

```python
Base.metadata.create_all(engine)  # dev/tests only
```

Production: **Alembic** — [25-alembic-intro](25-alembic-intro.md).

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| Mutable default `default=[]` | use `default=list` callable |
| Missing relationship back_populates | one-sided nav breaks |
| Float for money | Numeric/Decimal |

## Резюме

2.0 models use DeclarativeBase + Mapped types. mapped_column encodes SQL types and constraints. relationships link tables — next chapter.

Далее: [08-lab-declarative-models](08-lab-declarative-models.md).
