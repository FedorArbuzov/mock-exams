# 03. Лаба: explore стенд + psql

## Сценарий

Первый день — поднять Postgres **5433**, migrate, seed, убедиться что SQLAlchemy видит schema.

---

## Шаг 1. Compose up

```bash
cd deploy/sqlalchemy
docker compose up -d --build
docker compose ps
```

---

## Шаг 2. Smoke

```bash
bash scripts/smoke.sh
```

migrate → health → seed → count=2.

---

## Шаг 3. psql tour

```bash
docker exec -it mock-sqlalchemy-postgres psql -U course -d shop
```

```sql
\dt
\d products
SELECT id, sku, title, price FROM products;
SELECT p.sku, c.slug FROM products p JOIN categories c ON c.id = p.category_id;
```

---

## Шаг 4. Python REPL

```bash
docker exec -it mock-sqlalchemy-lab python
```

```python
from sqlalchemy import text
from shop.db import sync_engine

with sync_engine.connect() as conn:
    print(conn.execute(text("SELECT count(*) FROM products")).scalar())

from sqlalchemy import select
from shop.db import SyncSessionLocal
from shop.models import Product

with SyncSessionLocal() as s:
    for p in s.scalars(select(Product)):
        print(p.sku, p.price)
```

---

## Шаг 5. ECHO SQL

```bash
docker exec -e ECHO_SQL=true mock-sqlalchemy-lab python -c "
from sqlalchemy import select
from shop.db import SyncSessionLocal
from shop.models import Product
with SyncSessionLocal() as s:
    s.scalars(select(Product).limit(1)).all()
"
```

---

## Шаг 6. Карта проекта

| Path | Role |
|------|------|
| `shop/models.py` | ORM models |
| `shop/db.py` | engines, sessionmakers |
| `alembic/` | migrations |
| `lab_cli.py` | migrate/seed/health |

---

## Критерии приёмки

- [ ] smoke OK
- [ ] psql shows tables after migrate
- [ ] 2 products after seed
- [ ] Python select works

Далее: [04-metadata-core-crud](04-metadata-core-crud.md).
