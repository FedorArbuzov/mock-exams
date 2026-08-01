# 28. Lab: API filters, search, ordering

## Scenario

The client wants a URL like  
`/products/?category=books&min_price=10&search=django&ordering=-price` — without custom code in every view.

**Prerequisites:** [27-filtering-pagination](27-filtering-pagination.md), `ProductViewSet` running on the stand.

---

## Goal

1. A `ProductFilter` with min/max price and category slug.
2. `search` and `ordering` query params.
3. Pagination with `page` + `PAGE_SIZE=20`.

---

## Step 1. FilterSet

```python
# api/views.py
import django_filters.rest_framework as filters

class ProductFilter(filters.FilterSet):
    min_price = filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = filters.NumberFilter(field_name="price", lookup_expr="lte")
    category = filters.CharFilter(field_name="category__slug")

    class Meta:
        model = Product
        fields = ["is_active", "category", "min_price", "max_price"]
```

---

## Step 2. ViewSet + settings

```python
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer
    filterset_class = ProductFilter
    search_fields = ["sku", "title", "description"]
    ordering_fields = ["price", "created_at", "title"]
    ordering = ["-created_at"]
```

```python
# settings.py REST_FRAMEWORK
"DEFAULT_FILTER_BACKENDS": [
    "django_filters.rest_framework.DjangoFilterBackend",
    "rest_framework.filters.SearchFilter",
    "rest_framework.filters.OrderingFilter",
],
"DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
"PAGE_SIZE": 20,
```

---

## Step 3. Seed data (shell)

```bash
docker exec -it mock-django-web python manage.py shell
```

```python
from catalog.models import Category, Product
c, _ = Category.objects.get_or_create(slug="books", defaults={"name": "Books"})
Product.objects.get_or_create(sku="B1", defaults={"title": "Django Book", "price": "29.99", "category": c})
Product.objects.get_or_create(sku="B2", defaults={"title": "Python Guide", "price": "9.99", "category": c})
```

---

## Step 4. curl matrix

```bash
BASE=http://localhost:8092/api/v1/products

curl -s "$BASE/?category=books"
curl -s "$BASE/?min_price=20"
curl -s "$BASE/?search=django"
curl -s "$BASE/?ordering=price"
curl -s "$BASE/?page=2"
```

---

## Step 5. Invalid ordering

```bash
curl -s "$BASE/?ordering=hacked_field"
```

DRF ignores fields not listed in `ordering_fields` — built-in protection against sort injection.

---

## Comparison with FastAPI

FastAPI: query params + Depends. DRF: FilterSet + backends — convention over wiring. See [`fastapi/18-query-params`](../fastapi/18-query-params.md).

---

## Acceptance criteria

- [ ] `?category=books` filters by slug
- [ ] `?min_price=20` excludes the 9.99 item
- [ ] `?search=django` finds B1
- [ ] `?ordering=price` sorts ascending by price
- [ ] The response contains `count`, `next`, `previous`, `results`

Next: [29-drf-auth-permissions](29-drf-auth-permissions.md).
