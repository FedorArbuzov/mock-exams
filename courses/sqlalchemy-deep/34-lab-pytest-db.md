# 34. Лаба: pytest + test DB

## Цель

Add pytest suite with rollback fixture; test repository and order transaction.

---

## tests/conftest.py

```python
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from shop.config import settings
from shop.models import Base

engine = create_engine(settings.database_url)
TestingSessionLocal = sessionmaker(engine, expire_on_commit=False)

@pytest.fixture
def db_session():
    connection = engine.connect()
    tx = connection.begin()
    session = TestingSessionLocal(bind=connection)
    connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart(sess, transaction):
        if transaction.nested and not transaction._parent.nested:
            connection.begin_nested()

    yield session
    session.close()
    tx.rollback()
    connection.close()
```

---

## tests/test_product_repo.py

```python
from shop.repositories.product import SyncProductRepository
from shop.models import Product

def test_list_active(db_session, seeded_products):
    repo = SyncProductRepository(db_session)
    items = repo.list_active_with_category()
    assert len(items) >= 1
    assert items[0].category is not None
```

Use existing seed from smoke or fixture creating Category+Product.

---

## Run

```bash
docker exec mock-sqlalchemy-lab pytest tests/ -v
```

---

## Критерии приёмки

- [ ] pytest green
- [ ] Tests don't leave garbage (rollback)
- [ ] ≥3 test functions

Далее: [35-interview-qa](35-interview-qa.md).
