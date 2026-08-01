# Django — full course

An in-depth course on **Django 5** and **Django REST Framework**: from **MTV and the ORM** to a **production API** with PostgreSQL, Redis cache, JWT, admin, tests, Gunicorn, and nginx. **42 lessons** + capstone + interview cheatsheet.

**Prerequisites:** Python 3.11+, basic SQL ([`postgresql-basic`](../postgresql-basic/README.md)), HTTP ([`nginx-basic`](../nginx-basic/README.md)), containers ([`containers-basic`](../containers-basic/README.md)). Useful: [`fastapi`](../fastapi/README.md) for comparing API approaches, [`python-testing`](../python-testing/README.md) for pytest.

**Locally:** [`deploy/django`](../../deploy/django/README.md) — `docker compose up -d --build`:

| Service | URL |
|--------|-----|
| Health | [http://localhost:8092/health/](http://localhost:8092/health/) |
| Admin | [http://localhost:8092/admin/](http://localhost:8092/admin/) |
| DRF products | [http://localhost:8092/api/v1/products/](http://localhost:8092/api/v1/products/) |
| DRF categories | [http://localhost:8092/api/v1/categories/](http://localhost:8092/api/v1/categories/) |

PostgreSQL and Redis run **inside** the compose stack. Smoke test: `bash scripts/smoke.sh` in `deploy/django`.

## How to read this

1. **Theory** — scenario → concepts → code → common mistakes.
2. **Lab** — the `:8092` stand or a local venv + `manage.py`.
3. After **41** — [`interview-cheatsheet.md`](interview-cheatsheet.md).
4. [42-capstone.md](42-capstone.md) — **6–8 hours**.

**Time:** ~50–70 min per theory + lab pair; the whole course is **~45–55 hours**.

## Syllabus (42 lessons)

### Phase 1. Landscape and project setup (01–06)
| 01 | [Django vs FastAPI vs monolith](01-django-landscape.md) |
| 02 | [First project: MTV, manage.py](02-first-project.md) |
| 03 | [Lab: explore the stand](03-lab-explore-stack.md) |
| 04 | [Settings and environments](04-settings-environments.md) |
| 05 | [Apps, repository structure](05-apps-structure.md) |
| 06 | [Lab: a new app](06-lab-new-app.md) |

### Phase 2. ORM and models (07–12)
| 07 | [Models: fields, Meta, __str__](07-models-basics.md) |
| 08 | [Lab: catalog models](08-lab-models.md) |
| 09 | [QuerySet API: filter, exclude, Q](09-queryset-api.md) |
| 10 | [Lab: ORM queries](10-lab-queries.md) |
| 11 | [FK, M2M, related_name](11-relationships.md) |
| 12 | [Lab: relationships and select_related](12-lab-relationships.md) |

### Phase 3. Migrations and Admin (13–18)
| 13 | [Migrations: makemigrations, migrate](13-migrations.md) |
| 14 | [Lab: schema evolution](14-lab-migrations.md) |
| 15 | [Django Admin](15-django-admin.md) |
| 16 | [Lab: catalog admin](16-lab-admin.md) |
| 17 | [URLs, views, CBV vs FBV](17-urls-views.md) |
| 18 | [Lab: function views](18-lab-views.md) |

### Phase 4. Templates and Forms (19–22)
| 19 | [Templates, static, context](19-templates-static.md) |
| 20 | [Lab: storefront page](20-lab-templates.md) |
| 21 | [Forms, ModelForm, validation](21-forms.md) |
| 22 | [Lab: order form](22-lab-forms.md) |

### Phase 5. Django REST Framework (23–30)
| 23 | [DRF: Serializer, APIView](23-drf-intro.md) |
| 24 | [Lab: your first serializer](24-lab-serializers.md) |
| 25 | [ViewSets, Routers](25-viewsets-routers.md) |
| 26 | [Lab: ProductViewSet](26-lab-viewsets.md) |
| 27 | [Filtering, search, ordering](27-filtering-pagination.md) |
| 28 | [Lab: API filters](28-lab-api-filters.md) |
| 29 | [Permissions, authentication in DRF](29-drf-auth-permissions.md) |
| 30 | [Lab: JWT with SimpleJWT](30-lab-jwt.md) |

### Phase 6. Middleware, cache, signals (31–34)
| 31 | [Middleware, request lifecycle](31-middleware.md) |
| 32 | [Lab: custom middleware](32-lab-middleware.md) |
| 33 | [Caching: Redis, django-redis](33-caching-redis.md) |
| 34 | [Lab: cache-aside view](34-lab-cache.md) |

### Phase 7. Testing (35–37)
| 35 | [TestCase, Client, APITestCase](35-testing-django.md) |
| 36 | [Lab: catalog API tests](36-lab-testing.md) |
| 37 | [Factories, fixtures, coverage](37-testing-advanced.md) |

### Phase 8. Production (38–40)
| 38 | [Gunicorn, Docker, collectstatic](38-docker-gunicorn.md) |
| 39 | [Lab: prod-like compose](39-lab-docker.md) |
| 40 | [nginx, static, TLS probes](40-nginx-static.md) |

### Phase 9. Senior (41–42)
| 41 | [Interview Q&A (top 40)](41-interview-qa.md) |
| 42 | [Capstone: Catalog API](42-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## What you'll be able to do

- Explain **MTV**, the **ORM**, and when to pick Django vs FastAPI.
- Design **models**, **migrations**, and the **Admin**.
- Build a **REST API** with DRF: serializers, viewsets, filters, JWT.
- Configure **Redis cache**, **middleware**, **tests**.
- Deploy behind **Gunicorn** + **nginx** with health probes.

## Related courses

| Course | Connection |
|------|-------|
| [`fastapi`](../fastapi/README.md) | alternative API stack |
| [`postgresql-basic`](../postgresql-basic/README.md) | SQL under the ORM |
| [`postgresql-developer`](../postgresql-developer/README.md) | migrations, N+1 |
| [`redis-basic`](../redis-basic/README.md) | cache patterns |
| [`python-testing`](../python-testing/README.md) | pytest fundamentals |
| [`nginx-basic`](../nginx-basic/README.md) | reverse proxy |

## Reference code

[`deploy/django/stack/web`](../../deploy/django/stack/web) — the `config` project + the `catalog` and `api` apps.
