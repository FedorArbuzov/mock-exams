# 32. Лаба: ProductRepository sync

## Цель

Complete sync `ProductRepository` + `UnitOfWork` with tests.

---

## Implementation

```python
# shop/repositories/product.py — add SyncProductRepository
class SyncProductRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_active_with_category(self, limit: int = 20) -> list[Product]:
        stmt = (
            select(Product)
            .options(joinedload(Product.category))
            .where(Product.is_active == True)
            .limit(limit)
        )
        return self.session.scalars(stmt).unique().all()

    def deactivate_zero_stock(self) -> int:
        result = self.session.execute(
            update(Product).where(Product.stock == 0).values(is_active=False)
        )
        return result.rowcount
```

---

## UoW usage

```python
with SyncSessionLocal() as session:
    repo = SyncProductRepository(session)
    products = repo.list_active_with_category()
    n = repo.deactivate_zero_stock()
    session.commit()
    print(len(products), n)
```

---

## Критерии приёмки

- [ ] Repository methods work
- [ ] No commit inside repository
- [ ] joinedload in list method

Далее: [33-pool-testing](33-pool-testing.md).
