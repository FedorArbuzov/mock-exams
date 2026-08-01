# 24. Lab: dual engine smoke

## Goal

One script: sync count + async count — same result, both engines healthy.

---

## Script

```python
import asyncio
from sqlalchemy import func, select
from shop.db import AsyncSessionLocal, SyncSessionLocal, async_engine, sync_engine
from shop.models import Product


def sync_count() -> int:
    with SyncSessionLocal() as s:
        return s.scalar(select(func.count()).select_from(Product))


async def async_count() -> int:
    async with AsyncSessionLocal() as s:
        return await s.scalar(select(func.count()).select_from(Product))


def main():
    sc = sync_count()
    ac = asyncio.run(async_count())
    print(f"sync={sc} async={ac}")
    assert sc == ac
    sync_engine.dispose()
    asyncio.run(async_engine.dispose())

if __name__ == "__main__":
    main()
```

---

## After seed

Expect `sync=2 async=2` (or more if you added products).

---

## Success criteria

- [ ] Counts match
- [ ] No connection errors
- [ ] Engines disposed cleanly

Next: [25-alembic-intro](25-alembic-intro.md).
