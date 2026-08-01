# 36. Capstone: Shop Data Layer

## Goal

A production-ready **data layer** for catalog + orders — **5–7 hours**. An extension of [`deploy/sqlalchemy/stack`](../../deploy/sqlalchemy/stack).

---

## Functional requirements

| # | Feature |
|---|---------|
| 1 | Models: Category, Product, Tag M2M, Order, OrderItem (extend stack) |
| 2 | Sync + Async repositories for Product and Order |
| 3 | UnitOfWork with commit/rollback |
| 4 | `place_order()` atomic: stock check, lock, items, status |
| 5 | Alembic migrations for all changes |
| 6 | N+1 fixed on product list and order detail |
| 7 | Reporting SQL: revenue by category (text()) |
| 8 | pytest ≥12 tests with rollback fixture |
| 9 | README: pool config, migration runbook |

---

## Non-functional

| # | Requirement |
|---|-------------|
| N1 | Numeric for money, no float |
| N2 | FK ondelete documented (PROTECT vs CASCADE) |
| N3 | No create_all in prod path |
| N4 | Indexes on hot filters |
| N5 | ECHO_SQL off default |

---

## Phases

### Phase 1 — Schema (1.5h)

Finalize models, migrations, seed script.

### Phase 2 — Repositories (1.5h)

ProductRepository, OrderRepository sync + async.

### Phase 3 — Transactions (1h)

place_order with_for_update, rollback tests.

### Phase 4 — Performance (1h)

Fix N+1, EXPLAIN hot queries, document loaders chosen.

### Phase 5 — Quality (1.5h)

pytest suite, smoke extended, CAPSTONE.md decisions.

### Phase 6 — Optional (+2h)

- Wire into [`deploy/fastapi`](../../deploy/fastapi/README.md) replacing inline SQLAlchemy
- Compare same domain in [`django`](../django/README.md) ORM doc

---

## Success criteria

```bash
cd deploy/sqlalchemy
docker compose up -d --build
bash scripts/smoke.sh
docker exec mock-sqlalchemy-lab pytest tests/ -v
docker exec mock-sqlalchemy-lab alembic upgrade head
```

| Check | Pass |
|-------|------|
| smoke | ✓ |
| pytest ≥12 | ✓ |
| place_order atomic | ✓ |
| list products ≤2 queries | ✓ |
| migration history linear | ✓ |

---

## Deliverables

1. Git branch with code
2. `CAPSTONE.md` — loader choices, transaction boundaries
3. Post-mortem: "1M products — what indexes and pool size?"

---

## Related courses

| Course | Uses |
|------|------|
| postgresql-performance | EXPLAIN, indexes |
| postgresql-developer | migration patterns |
| fastapi | AsyncSession DI |
| python-testing | pytest fixtures |

Congratulations — the **SQLAlchemy Deep** course is complete.
