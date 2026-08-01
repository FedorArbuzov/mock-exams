# 20. Lab: async setup + queries

## Goal

CRUD through AsyncSession; compare syntax with sync.

---

## Step 1. Async select

```python
import asyncio
from sqlalchemy import select
from shop.db import AsyncSessionLocal
from shop.models import Product

async def main():
    async with AsyncSessionLocal() as session:
        products = (await session.scalars(select(Product).limit(5))).all()
        for p in products:
            print(p.sku)

asyncio.run(main())
```

Run: `docker exec mock-sqlalchemy-lab python your_script.py`

---

## Step 2. Async insert

```python
async def create_product():
    async with AsyncSessionLocal() as session:
        session.add(Product(sku="ASYNC-2", title="Lab", price="2.00", category_id=1))
        await session.commit()
```

---

## Step 3. joinedload async

```python
from sqlalchemy.orm import joinedload

async with AsyncSessionLocal() as session:
    stmt = select(Product).options(joinedload(Product.category)).limit(5)
    products = (await session.scalars(stmt)).unique().all()
    for p in products:
        print(p.sku, p.category.slug)
```

---

## Step 4. pytest-asyncio (preview)

```python
import pytest

@pytest.mark.asyncio
async def test_async_count():
    async with AsyncSessionLocal() as session:
        n = await session.scalar(select(func.count()).select_from(Product))
    assert n >= 0
```

---

## Success criteria

- [ ] Async select prints products
- [ ] Async insert committed
- [ ] joinedload works without lazy IO errors

Next: [21-async-patterns](21-async-patterns.md).
