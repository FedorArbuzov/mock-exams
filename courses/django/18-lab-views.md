# 18. Лаба: function views и JSON health

## Сценарий

Нужен **`/stats/`** endpoint — количество активных товаров и категорий — без DRF, чистый Django FBV + JsonResponse.

**Предварительно:** [17-urls-views](17-urls-views.md).

---

## Цель

1. FBV `catalog_stats`.
2. URL + optional cache 60s.
3. Сравнить с `/health/` в `config/urls.py`.

---

## Шаг 1. View

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

## Шаг 2. URL

```python
# catalog/urls.py
path("stats/", views.catalog_stats, name="catalog-stats"),
```

Root `config/urls.py` уже включает catalog urls (или добавьте `path("", include("catalog.urls"))`).

---

## Шаг 3. Cache wrapper (опционально)

```python
from django.views.decorators.cache import cache_page

@cache_page(60)
def catalog_stats(_request):
    ...
```

Или low-level — [34-lab-cache](34-lab-cache.md).

---

## Шаг 4. CBV equivalent (для сравнения)

```python
from django.views import View

class CatalogStatsView(View):
    def get(self, request):
        return JsonResponse({...})
```

FBV проще для одного метода; CBV — когда несколько HTTP verbs.

---

## Шаг 5. Smoke

```bash
curl -s http://localhost:8092/stats/ | python -m json.tool
curl -s http://localhost:8092/health/
```

---

## Когда не FBV

| Case | Выбор |
|------|-------|
| CRUD API | DRF ViewSet |
| HTML forms | FBV + render |
| Reusable mixins | CBV |

---

## Критерии приёмки

- [ ] `GET /stats/` → 200 JSON с тремя числами
- [ ] Числа совпадают с admin counts
- [ ] `@cache_page` (если добавили) — второй запрос быстрее

Далее: [19-templates-static](19-templates-static.md).
