# 22. Лаба: async repository

## Цель

Implement `AsyncProductRepository` with list, get_by_sku, create.

---

## Шаг 1. Create file

```python
# shop/repositories/product.py
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from shop.models import Product


class AsyncProductRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_active(self, limit: int = 20) -> list[Product]:
        stmt = (
            select(Product)
            .options(joinedload(Product.category))
            .where(Product.is_active == True)
            .limit(limit)
        )
        return (await self.session.scalars(stmt)).unique().all()

    async def get_by_sku(self, sku: str) -> Product | None:
        return await self.session.scalar(select(Product).where(Product.sku == sku))

    async def create(self, *, sku: str, title: str, price: Decimal, category_id: int) -> Product:
        product = Product(sku=sku, title=title, price=price, category_id=category_id)
        self.session.add(product)
        await self.session.flush()
        return product
```

---

## Шаг 2. Usage

```python
async with AsyncSessionLocal() as session:
    repo = AsyncProductRepository(session)
    items = await repo.list_active()
    print(len(items))
    await session.commit()
```

---

## Шаг 3. Sync twin (optional)

Same interface with sync Session — [32-lab-repository](32-lab-repository.md).

---

## Критерии приёмки

- [ ] list_active returns with category loaded (1-2 queries)
- [ ] get_by_sku works
- [ ] create persists after commit

Далее: [23-sync-vs-async-orm](23-sync-vs-async-orm.md).
