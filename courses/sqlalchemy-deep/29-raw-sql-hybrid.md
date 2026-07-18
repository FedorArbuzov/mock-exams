# 29. Raw SQL, text(), hybrid queries

## Введение

Reporting, PG-specific features (window functions, JSONB) — ORM awkward. **Hybrid**: ORM for domain, raw for analytics.

## Что вы узнаете

- text() with mappings.
- From ORM to Core in one stmt.
- Hybrid properties.
- Server-side defaults vs Python.

---

## Reporting query

```python
from sqlalchemy import text

sql = text("""
    SELECT c.slug, COUNT(p.id) AS cnt, AVG(p.price) AS avg_price
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
    GROUP BY c.id
    ORDER BY cnt DESC
""")

with engine.connect() as conn:
    for row in conn.execute(sql).mappings():
        print(dict(row))
```

---

## Bind parameters

```python
sql = text("SELECT * FROM products WHERE price >= :min_price")
conn.execute(sql, {"min_price": 20})
```

---

## ORM + text fragment

```python
from sqlalchemy import literal_column

stmt = select(Product, literal_column("price * 1.2").label("with_vat")).where(...)
```

Rare — usually full text for complex.

---

## hybrid_property

```python
from sqlalchemy.ext.hybrid import hybrid_property

class Product(Base):
    @hybrid_property
    def price_with_tax(self):
        return self.price * Decimal("1.20")

    @price_with_tax.expression
    def price_with_tax(cls):
        return cls.price * 1.20
```

Use in Python and SQL WHERE.

---

## When ORM still wins

Simple CRUD — maintainability beats 5% SQL micro-optimization.

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| String concat SQL | text() + binds |
| Mixing engines in one txn | same connection |
| Window functions in ORM 1.4 style | use text() |

## Резюме

text() for complex SQL. mappings() for dict rows. hybrid_property bridges Python/SQL. ORM for CRUD, raw for reports.

Далее: [30-lab-reporting-sql](30-lab-reporting-sql.md).
