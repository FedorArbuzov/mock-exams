# 26. Lab: ProductViewSet end-to-end

## Scenario

The frontend needs **full CRUD** for products: paginated list, retrieve by id, create/update/delete. A ViewSet + Router means far less boilerplate than five separate APIViews.

**Prerequisites:** [25-viewsets-routers](25-viewsets-routers.md), serializers from [24-lab-serializers](24-lab-serializers.md).

---

## Goal

Wire `ProductViewSet` up to the router, check every HTTP method, and confirm `select_related("category")` on the queryset.

---

## Step 1. ViewSet (reference)

```python
# api/views.py
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer
    filterset_class = ProductFilter
    search_fields = ["sku", "title"]
    ordering_fields = ["price", "created_at", "title"]
```

`ReadOnlyModelViewSet` — GET only; `ModelViewSet` — all verbs.

---

## Step 2. Router

```python
# api/urls.py
from rest_framework.routers import DefaultRouter
from api.views import CategoryViewSet, ProductViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("products", ProductViewSet, basename="product")

urlpatterns = router.urls
```

Auto-generated URLs:

| Method | URL | Action |
|--------|-----|--------|
| GET | `/products/` | list |
| POST | `/products/` | create |
| GET | `/products/{pk}/` | retrieve |
| PUT/PATCH | `/products/{pk}/` | update |
| DELETE | `/products/{pk}/` | destroy |

---

## Step 3. CRUD via curl

```bash
BASE=http://localhost:8092/api/v1

# list + pagination
curl -s "$BASE/products/" | python -m json.tool | head -30

# create
curl -s -X POST "$BASE/products/" -H "Content-Type: application/json" \
  -d '{"sku":"VS-001","title":"ViewSet Lab","price":"49.00","category_id":1}'

# retrieve
curl -s "$BASE/products/1/"

# partial update
curl -s -X PATCH "$BASE/products/1/" -H "Content-Type: application/json" \
  -d '{"price":"39.00"}'

# delete
curl -s -X DELETE "$BASE/products/1/" -w "\nHTTP:%{http_code}\n"
```

---

## Step 4. Checking for N+1

```bash
docker exec mock-django-web python manage.py shell
```

```python
from django.db import connection, reset_queries
from django.conf import settings
settings.DEBUG = True
reset_queries()
list(Product.objects.select_related("category")[:5])
len(connection.queries)  # expect: 1 query
```

Without `select_related`, listing costs 1 + N queries.

---

## Step 5. Custom action (optional)

```python
from rest_framework.decorators import action
from rest_framework.response import Response

class ProductViewSet(viewsets.ModelViewSet):
    ...

    @action(detail=False, methods=["get"])
    def low_stock(self, request):
        qs = self.get_queryset().filter(stock__lt=10)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
```

URL: `GET /api/v1/products/low_stock/`.

---

## Acceptance criteria

- [ ] `GET /products/` returns `count` and `results` (pagination)
- [ ] POST creates a record and returns 201
- [ ] PATCH updates price
- [ ] DELETE returns 204
- [ ] The queryset uses `select_related("category")`

Next: [27-filtering-pagination](27-filtering-pagination.md).
