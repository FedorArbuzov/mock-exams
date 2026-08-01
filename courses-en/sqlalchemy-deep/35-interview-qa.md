# 35. Interview Q&A: SQLAlchemy (top 40)

## Core vs ORM

**1. Core vs ORM?** Core = SQL expressions; ORM = mapped classes on top.

**2. SQLAlchemy 2.0 change?** `select()` everywhere; `Mapped[]`; no `Query`.

**3. Engine vs Session?** Engine = pool; Session = ORM unit of work.

**4. Connection vs Session?** Connection = Core; Session wraps connection + identity map.

---

## Queries

**5. N+1?** Lazy load in loop; fix joinedload/selectinload.

**6. joinedload vs selectinload?** JOIN for many-to-one; IN query for collections.

**7. Why .unique() after joinedload?** JOIN duplicates parent rows.

**8. scalar vs scalars?** One object vs collection.

**9. flush vs commit?** flush sends SQL; commit makes durable.

---

## Relationships

**10. back_populates?** Sync both sides of relationship.

**11. lazy strategies?** select, joined, selectin, raise.

**12. cascade delete-orphan?** Delete children removed from collection.

**13. M2M pattern?** secondary= association Table.

---

## Async

**14. AsyncSession driver?** asyncpg typically.

**15. Sync Session in async route?** Blocks event loop.

**16. Celery + ORM?** Sync Session in workers.

---

## Migrations & prod

**17. create_all vs Alembic?** create_all dev; Alembic prod.

**18. autogenerate trust?** Always review diff.

**19. pool_pre_ping?** Detect stale connections.

**20. expire_on_commit?** Attributes expired after commit unless False.

---

## Transactions

**21. with_for_update?** Row lock for concurrent updates.

**22. Isolation levels PG?** READ COMMITTED default.

**23. Savepoint?** begin_nested partial rollback.

---

## Patterns

**24. Repository pattern?** Encapsulate persistence queries.

**25. Unit of Work?** One session per business transaction.

**26. hybrid_property?** Python + SQL expression.

**27. Bulk insert fast path?** Core insert multi values.

---

## Troubleshooting

**28. DetachedInstanceError?** Access object outside session scope.

**29. Multiple heads Alembic?** merge revisions.

**30. QueuePool timeout?** Increase pool or reduce workers.

**31. IntegrityError?** Constraint violation — business or race.

**32. Object already attached?** Two sessions same PK — merge or expunge.

---

## Compare

**33. SQLAlchemy vs Django ORM?** Decoupled vs framework; both sync-first history.

**34. SQLAlchemy vs raw asyncpg?** ORM productivity vs max control.

**35. SQLModel?** Pydantic + SQLAlchemy convenience.

---

## Design

**36. When Core only?** Bulk ETL, migrations, complex SQL.

**37. Identity map benefit?** One PK = one Python instance per session.

**38. JSON vs ORM for API?** Pydantic from_attributes from ORM models.

**39. Soft delete?** is_deleted flag vs hard delete cascade.

**40. Multi-tenant?** tenant_id column + session filter vs schema per tenant.

---

Practice: [36-capstone](36-capstone.md). Cheatsheet: [interview-cheatsheet](interview-cheatsheet.md).

Next: [36-capstone](36-capstone.md).
