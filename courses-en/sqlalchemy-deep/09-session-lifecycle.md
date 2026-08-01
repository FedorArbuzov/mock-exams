# 09. Session: add, flush, commit, rollback

## Intro

**Session** — ORM workspace: identity map, unit of work, transaction boundary. Confusing flush and commit is the #1 source of bugs.

## What you'll learn

- Session lifecycle.
- add, delete, flush, commit, rollback, refresh.
- expire_on_commit.
- merge for detached objects.

---

## sessionmaker

```python
from sqlalchemy.orm import sessionmaker, Session

SessionLocal = sessionmaker(engine, expire_on_commit=False)

with SessionLocal() as session:
    ...
# session.close() automatic
```

Stand: [`SyncSessionLocal`](../../deploy/sqlalchemy/stack/shop/db.py).

---

## add and flush

```python
cat = Category(name="Tools", slug="tools")
session.add(cat)
session.flush()  # sends INSERT, assigns cat.id — still in transaction
product = Product(sku="T-1", title="Hammer", price="9.99", category_id=cat.id)
session.add(product)
session.commit()  # COMMIT transaction
```

| Step | DB state |
|------|----------|
| add | pending in session |
| flush | SQL executed, not committed |
| commit | durable |

---

## rollback

```python
try:
    session.add(Product(...))
    session.flush()
    raise ValueError("business rule failed")
except Exception:
    session.rollback()
```

All pending changes discarded.

---

## get vs scalar select

```python
product = session.get(Product, 1)  # PK lookup, identity map
product = session.scalar(select(Product).where(Product.sku == "BK-001"))
```

`get()` uses cache — may not hit DB if already loaded.

---

## delete

```python
session.delete(product)
session.commit()
```

Or bulk:

```python
session.execute(delete(Product).where(Product.is_active == False))
```

2.0 style bulk delete — [11-orm-select-20-style](11-orm-select-20-style.md).

---

## expire_on_commit

```python
sessionmaker(..., expire_on_commit=True)  # default
```

After commit, attributes expired — next access lazy reloads. API responses: set `expire_on_commit=False` or load before commit.

---

## merge (detached)

```python
detached = Product(id=1, title="Updated")  # from API payload
merged = session.merge(detached)
session.commit()
```

Updates existing row by PK.

---

## Common mistakes

| Mistake | Symptom |
|---------|---------|
| Long-lived session | stale data, memory |
| commit per row loop | slow — batch flush once |
| Access after close | DetachedInstanceError |

## Summary

Session tracks changes until flush/commit. One session per request/unit of work. rollback on error. expire_on_commit affects post-commit access.

Next: [10-lab-sync-session](10-lab-sync-session.md).
