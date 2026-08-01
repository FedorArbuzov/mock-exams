# 42. Capstone: Catalog Platform API

## Goal

Build a **production-ready** catalog service on Django 5 + DRF — **6–8 hours**. You can fork [`deploy/django/stack/web`](../../deploy/django/stack/web) or extend it in place.

---

## Functional requirements

| # | Feature |
|---|---------|
| 1 | Models: Category, Product, Tag (M2M), Order |
| 2 | Admin: filters, actions, inlines Order |
| 3 | API v1: products CRUD, categories read, filters/search/order |
| 4 | JWT auth: read public, write authenticated |
| 5 | Redis cache: category list + invalidation |
| 6 | Custom middleware: request timing header |
| 7 | Tests: ≥15 APITestCase, coverage ≥80% models+api |
| 8 | Docker compose + gunicorn + migrate entrypoint |
| 9 | README ops: env vars, createsuperuser, smoke |

---

## Non-functional

| # | Requirement |
|---|-------------|
| N1 | DEBUG off in compose prod profile |
| N2 | No secrets in git |
| N3 | select_related on product list |
| N4 | Pagination default 20 |
| N5 | Migrations committed |

---

## Phases

### Phase 1 — Domain (2h)

Models, migrations, seed data, admin polish.

### Phase 2 — API (2h)

Serializers, ViewSets, filters, JWT, permissions.

### Phase 3 — Ops (1.5h)

Cache, middleware, docker rebuild, smoke.sh green.

### Phase 4 — Quality (1.5h)

Tests, coverage, fix N+1, README.

### Phase 5 — Optional (+2h)

- nginx front [`deploy/nginx`](../../deploy/nginx/README.md)
- drf-spectacular OpenAPI
- pytest-django migration from manage.py test
- Compare same API in [`fastapi`](../fastapi/README.md) — architecture doc

---

## Acceptance criteria

```bash
cd deploy/django && docker compose up -d --build
bash scripts/smoke.sh
docker exec mock-django-web python manage.py test
curl http://localhost:8092/api/v1/products/?search=...
```

| Check | Pass |
|-------|------|
| smoke.sh | ✓ |
| test suite | ✓ |
| admin usable | ✓ |
| JWT write | ✓ |
| cache hit | ✓ |

---

## Deliverables

1. Git branch / fork with code
2. `CAPSTONE.md` — decisions (why PROTECT, cache keys)
3. Post-mortem: what would you do for 100k products?

---

## Related courses

| Course | Capstone uses |
|------|---------------|
| postgresql-* | indexes, explain |
| redis-basic | cache-aside |
| python-testing | test patterns |
| gitlab-basic | CI job test |
| nginx-basic | optional TLS |

Congratulations — the **Django** course is complete.
