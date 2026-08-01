# 18. Lab: function views and a JSON health check

## Scenario

You need a **`/stats/`** endpoint — count of active products and categories — no DRF, plain Django FBV + JsonResponse.

**Prerequisite:** [17-urls-views](17-urls-views.md).

---

## Goal

1. FBV `catalog_stats`.
2. URL + optional 60s cache.
3. Compare with `/health/` in `config/urls.py`.

---

## Step 1. View

```python
# catalog/views.py
from django.http import JsonResponse
from catalog.models import Category, Product

def catalog_stats(_request):
    return JsonResponse({
        "products_active": Product.objects.filter(is_active=True).count(),
        "products_total": Product.objects.count(),
        "categories": Category.objects.count(),
    })
```

---

## Step 2. URL

```python
# catalog/urls.py
path("stats/", views.catalog_stats, name="catalog-stats"),
```

The root `config/urls.py` already includes the catalog urls (or add `path("", include("catalog.urls"))`).

---

## Step 3. Cache wrapper (optional)

```python
from django.views.decorators.cache import cache_page

@cache_page(60)
def catalog_stats(_request):
    ...
```

Or go low-level — [34-lab-cache](34-lab-cache.md).

---

## Step 4. CBV equivalent (for comparison)

```python
from django.views import View

class CatalogStatsView(View):
    def get(self, request):
        return JsonResponse({...})
```

FBV is simpler for a single method; use CBV when you need several HTTP verbs.

---

## Step 5. Smoke test

```bash
curl -s http://localhost:8092/stats/ | python -m json.tool
curl -s http://localhost:8092/health/
```

---

## When not to use FBV

| Case | Choice |
|------|-------|
| CRUD API | DRF ViewSet |
| HTML forms | FBV + render |
| Reusable mixins | CBV |

---

## Acceptance criteria

- [ ] `GET /stats/` returns 200 JSON with three numbers
- [ ] The numbers match the admin counts
- [ ] `@cache_page` (if added) — second request is faster

Next: [19-templates-static](19-templates-static.md).
