# 26. Лаба: migration add column

## Цель

Add `is_featured` boolean to Product — autogenerate, upgrade, verify downgrade.

---

## Шаг 1. Model change

```python
is_featured: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
```

---

## Шаг 2. Autogenerate

```bash
docker exec mock-sqlalchemy-lab alembic revision --autogenerate -m "add product is_featured"
docker exec mock-sqlalchemy-lab alembic upgrade head
```

---

## Шаг 3. Verify

```sql
\d products
SELECT sku, is_featured FROM products;
```

---

## Шаг 4. Data backfill (optional)

Edit migration:

```python
op.execute("UPDATE products SET is_featured = true WHERE price > 30")
```

---

## Шаг 5. Downgrade test (dev)

```bash
docker exec mock-sqlalchemy-lab alembic downgrade -1
docker exec mock-sqlalchemy-lab alembic upgrade head
```

---

## Критерии приёмки

- [ ] Migration file committed
- [ ] Column exists after upgrade
- [ ] Downgrade removes column (dev)

Далее: [27-transactions-isolation](27-transactions-isolation.md).
