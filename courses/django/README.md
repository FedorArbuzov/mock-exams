# Django — полный курс

Мега-подробный курс по **Django 5** и **Django REST Framework**: от **MTV и ORM** до **production API** с PostgreSQL, Redis cache, JWT, admin, тестами, Gunicorn и nginx. **42 урока** + capstone + interview cheatsheet.

**Предварительно:** Python 3.11+, базовый SQL ([`postgresql-basic`](../postgresql-basic/README.md)), HTTP ([`nginx-basic`](../nginx-basic/README.md)), контейнеры ([`containers-basic`](../containers-basic/README.md)). Полезно: [`fastapi`](../fastapi/README.md) для сравнения API-подходов, [`python-testing`](../python-testing/README.md) для pytest.

**Локально:** [`deploy/django`](../../deploy/django/README.md) — `docker compose up -d --build`:

| Сервис | URL |
|--------|-----|
| Health | [http://localhost:8092/health/](http://localhost:8092/health/) |
| Admin | [http://localhost:8092/admin/](http://localhost:8092/admin/) |
| DRF products | [http://localhost:8092/api/v1/products/](http://localhost:8092/api/v1/products/) |
| DRF categories | [http://localhost:8092/api/v1/categories/](http://localhost:8092/api/v1/categories/) |

PostgreSQL и Redis **внутри** compose. Smoke: `bash scripts/smoke.sh` в `deploy/django`.

## Как читать

1. **Теория** — сценарий → концепции → код → типичные ошибки.
2. **Лаба** — стенд `:8092` или локальный venv + `manage.py`.
3. После **41** — [`interview-cheatsheet.md`](interview-cheatsheet.md).
4. [42-capstone.md](42-capstone.md) — **6–8 часов**.

**Время:** ~50–70 мин на пару «теория + лаба»; весь курс **~45–55 часов**.

## Программа (42 урока)

### Фаза 1. Ландшафт и проект (01–06)
| 01 | [Django vs FastAPI vs монолит](01-django-landscape.md) |
| 02 | [Первый проект: MTV, manage.py](02-first-project.md) |
| 03 | [Лаба: explore стенд](03-lab-explore-stack.md) |
| 04 | [Settings и окружения](04-settings-environments.md) |
| 05 | [Apps, структура репозитория](05-apps-structure.md) |
| 06 | [Лаба: новое приложение](06-lab-new-app.md) |

### Фаза 2. ORM и модели (07–12)
| 07 | [Models: поля, Meta, __str__](07-models-basics.md) |
| 08 | [Лаба: модели catalog](08-lab-models.md) |
| 09 | [QuerySet API: filter, exclude, Q](09-queryset-api.md) |
| 10 | [Лаба: запросы ORM](10-lab-queries.md) |
| 11 | [FK, M2M, related_name](11-relationships.md) |
| 12 | [Лаба: связи и select_related](12-lab-relationships.md) |

### Фаза 3. Миграции и Admin (13–18)
| 13 | [Migrations: makemigrations, migrate](13-migrations.md) |
| 14 | [Лаба: эволюция схемы](14-lab-migrations.md) |
| 15 | [Django Admin](15-django-admin.md) |
| 16 | [Лаба: admin catalog](16-lab-admin.md) |
| 17 | [URLs, views, CBV vs FBV](17-urls-views.md) |
| 18 | [Лаба: function views](18-lab-views.md) |

### Фаза 4. Templates и Forms (19–22)
| 19 | [Templates, static, context](19-templates-static.md) |
| 20 | [Лаба: storefront page](20-lab-templates.md) |
| 21 | [Forms, ModelForm, validation](21-forms.md) |
| 22 | [Лаба: форма заказа](22-lab-forms.md) |

### Фаза 5. Django REST Framework (23–30)
| 23 | [DRF: Serializer, APIView](23-drf-intro.md) |
| 24 | [Лаба: первый serializer](24-lab-serializers.md) |
| 25 | [ViewSets, Routers](25-viewsets-routers.md) |
| 26 | [Лаба: ProductViewSet](26-lab-viewsets.md) |
| 27 | [Filtering, search, ordering](27-filtering-pagination.md) |
| 28 | [Лаба: API filters](28-lab-api-filters.md) |
| 29 | [Permissions, authentication DRF](29-drf-auth-permissions.md) |
| 30 | [Лаба: JWT SimpleJWT](30-lab-jwt.md) |

### Фаза 6. Middleware, cache, signals (31–34)
| 31 | [Middleware, request lifecycle](31-middleware.md) |
| 32 | [Лаба: custom middleware](32-lab-middleware.md) |
| 33 | [Caching: Redis, django-redis](33-caching-redis.md) |
| 34 | [Лаба: cache-aside view](34-lab-cache.md) |

### Фаза 7. Тестирование (35–37)
| 35 | [TestCase, Client, APITestCase](35-testing-django.md) |
| 36 | [Лаба: tests catalog API](36-lab-testing.md) |
| 37 | [Factories, fixtures, coverage](37-testing-advanced.md) |

### Фаза 8. Production (38–40)
| 38 | [Gunicorn, Docker, collectstatic](38-docker-gunicorn.md) |
| 39 | [Лаба: prod-like compose](39-lab-docker.md) |
| 40 | [nginx, static, TLS probes](40-nginx-static.md) |

### Фаза 9. Senior (41–42)
| 41 | [Interview Q&A (топ-40)](41-interview-qa.md) |
| 42 | [Capstone: Catalog API](42-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## Что должно получиться

- Объясняете **MTV**, **ORM**, когда Django vs FastAPI.
- Проектируете **models**, **migrations**, **Admin**.
- Строите **REST API** на DRF: serializers, viewsets, filters, JWT.
- Настраиваете **Redis cache**, **middleware**, **tests**.
- Деплоите за **Gunicorn** + **nginx** с health probes.

## Связь с курсами

| Курс | Связь |
|------|-------|
| [`fastapi`](../fastapi/README.md) | альтернативный API stack |
| [`postgresql-basic`](../postgresql-basic/README.md) | SQL под ORM |
| [`postgresql-developer`](../postgresql-developer/README.md) | миграции, N+1 |
| [`redis-basic`](../redis-basic/README.md) | cache patterns |
| [`python-testing`](../python-testing/README.md) | pytest основы |
| [`nginx-basic`](../nginx-basic/README.md) | reverse proxy |

## Эталонный код

[`deploy/django/stack/web`](../../deploy/django/stack/web) — проект `config` + apps `catalog`, `api`.
