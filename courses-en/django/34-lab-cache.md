# 34. Lab: cache-aside for the category list

## Scenario

`GET /api/v1/categories/` gets called on **every** product list on the frontend — 500 RPS hitting one plain SELECT. Set up cache-aside in Redis with **invalidation on save** of Category.

**Prerequisites:** [33-caching-redis](33-caching-redis.md), `CACHES` already configured in [`settings.py`](../../deploy/django/stack/web/config/settings.py).

---

## Goal

1. Cache the category list JSON response for **5 minutes**.
2. **Clear** the key on Category create/update/delete.
3. Confirm hit/miss via redis-cli or logs.

---

## Step 1. Key constant

```python
# api/cache_keys.py
CATEGORY_LIST_KEY = "api:v1:categories:list"
CATEGORY_LIST_TTL = 300  # seconds
```

A single `api:v1:` prefix makes `KEYS api:v1:*` handy in dev (in prod, use explicit deletes, not `KEYS`).

---

## Step 2. Override list in CategoryViewSet

```python
# api/views.py
from django.core.cache import cache
from rest_framework.response import Response

from api.cache_keys import CATEGORY_LIST_KEY, CATEGORY_LIST_TTL


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = "slug"

    def list(self, request, *args, **kwargs):
        cached = cache.get(CATEGORY_LIST_KEY)
        if cached is not None:
            return Response(cached)
        response = super().list(request, *args, **kwargs)
        cache.set(CATEGORY_LIST_KEY, response.data, timeout=CATEGORY_LIST_TTL)
        return response
```

**Note:** we cache the **serialized data** (`response.data`), not the QuerySet — pickling a QuerySet across workers is risky.

---

## Step 3. Signal invalidation

```python
# catalog/signals.py
from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from api.cache_keys import CATEGORY_LIST_KEY
from catalog.models import Category


@receiver([post_save, post_delete], sender=Category)
def invalidate_category_list_cache(sender, **kwargs):
    cache.delete(CATEGORY_LIST_KEY)
```

```python
# catalog/apps.py
class CatalogConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "catalog"

    def ready(self):
        import catalog.signals  # noqa: F401
```

Replace `default_app_config` / use `CatalogConfig` in `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    ...
    "catalog.apps.CatalogConfig",
]
```

---

## Step 4. Verification

```bash
# cold
curl -s http://localhost:8092/api/v1/categories/ -w "\nTIME:%{time_total}\n"
# warm — usually faster
curl -s http://localhost:8092/api/v1/categories/ -w "\nTIME:%{time_total}\n"

docker exec mock-django-redis redis-cli KEYS '*categories*'

# invalidate — create a category via admin or POST (if a write endpoint exists)
docker exec mock-django-redis redis-cli DEL "api:v1:categories:list"
```

---

## Alternative: cache_page

For function views — `@cache_page(300)`. For a ViewSet list — override it or use a **custom action**; you still need signals for invalidation either way.

---

## Common problems

| Symptom | Cause | Fix |
|---------|---------|-----|
| Stale data after edit | signal not wired up | `ready()` + import signals |
| Cache always misses | different key per worker | one shared key, JSON serializable |
| Pagination in cache | list cached without pagination | cache only unpaginated data, or key + page |

---

## Acceptance criteria

- [ ] Two consecutive GETs — the second is faster (rough signal), or the key is visible in redis
- [ ] After editing a Category in admin, the next GET recomputes the list
- [ ] TTL = 300 sec (check with `TTL api:v1:categories:list` in redis-cli)

Next: [35-testing-django](35-testing-django.md).
