# 33. Caching: django-redis, per-view cache, low-level API

## Overview

Catalog list **hot read** — 5k RPS on same query. Redis cache — [`redis-basic`](../redis-basic/README.md).

```python
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ.get("REDIS_URL", "redis://redis:6379/1"),
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}
```

---

## per-view cache

```python
from django.views.decorators.cache import cache_page

@cache_page(60 * 5)
def product_list(request):
    ...
```

---

## Low-level

```python
from django.core.cache import cache

def get_category_tree():
    key = "category:tree"
    data = cache.get(key)
    if data is None:
        data = list(Category.objects.values("id", "slug", "name"))
        cache.set(key, data, timeout=300)
    return data
```

**Invalidate** on model save — signal or override `save()`.

---

## Template fragment cache

```html
{% load cache %}
{% cache 500 sidebar %}
...
{% endcache %}
```

---

## Cache aside pitfalls

| Issue | Fix |
|-------|-----|
| Stale after update | delete key on save |
| Cache thundering herd | lock or jitter |

[`fastapi/28-redis-cache`](../fastapi/28-redis-cache.md).

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| cache unbounded keys | TTL always |
| pickle non-serializable | JSON serialize |

## Summary

django-redis backend. cache_page or manual get/set. Invalidate on writes.

Next: [34-lab-cache](34-lab-cache.md).
