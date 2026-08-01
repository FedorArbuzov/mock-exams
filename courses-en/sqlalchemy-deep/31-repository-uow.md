# 31. Repository pattern, Unit of Work

## Introduction

Views/services with raw `select()` everywhere — duplication. **Repository** encapsulates persistence; **Unit of Work** = one Session per request.

## What you'll learn

- Repository interface.
- UoW with FastAPI Depends.
- Testing with fake repos.

[`fastapi/14-sessions-repos`](../fastapi/14-sessions-repos.md) — API angle.

---

## Repository

```python
class ProductRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_sku(self, sku: str) -> Product | None:
        return self.session.scalar(select(Product).where(Product.sku == sku))

    def list_active(self, limit: int = 20) -> list[Product]:
        stmt = select(Product).where(Product.is_active == True).limit(limit)
        return self.session.scalars(stmt).all()
```

Async variant — [22-lab-async-repository](22-lab-async-repository.md).

---

## Unit of Work

```python
class UnitOfWork:
    def __init__(self, session_factory):
        self.session_factory = session_factory

    def __enter__(self):
        self.session = self.session_factory()
        self.products = ProductRepository(self.session)
        return self

    def __exit__(self, exc_type, exc, tb):
        if exc_type:
            self.session.rollback()
        else:
            self.session.commit()
        self.session.close()

with UnitOfWork(SessionLocal) as uow:
    p = uow.products.get_by_sku("BK-001")
    p.stock -= 1
```

---

## FastAPI integration

```python
def get_uow():
    with UnitOfWork(SessionLocal) as uow:
        yield uow

@app.get("/products/{sku}")
def get_product(sku: str, uow: UnitOfWork = Depends(get_uow)):
    return uow.products.get_by_sku(sku)
```

Async: yield AsyncSession, async repos.

---

## Service layer

```python
class OrderService:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def place_order(self, items):
        # business rules here
        ...
```

Repository = SQL; Service = business rules.

---

## Testing

Mock repository interface — service tests without DB. Integration tests hit real Postgres — [34-lab-pytest-db](34-lab-pytest-db.md).

---

## Over-engineering warning

Small app — Session in route + few queries OK. Repos shine when **10+ queries** reused.

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Repo commits internally | UoW commits once |
| Leaking Session from repo | repo doesn't close session |
| God repository | split by aggregate |

## Summary

Repository per aggregate. UoW bounds transaction. Service for business logic. Don't commit inside repo methods.

Next: [32-lab-repository](32-lab-repository.md).
