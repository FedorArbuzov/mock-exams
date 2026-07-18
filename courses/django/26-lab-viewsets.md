# 26. Лаба: ProductViewSet end-to-end

## Сценарий

Frontend нужен **полный CRUD** по товарам: list с pagination, retrieve по id, create/update/delete. ViewSet + Router — меньше boilerplate, чем пять отдельных APIView.

**Предварительно:** [25-viewsets-routers](25-viewsets-routers.md), serializers из [24-lab-serializers](24-lab-serializers.md).

---

## Цель

Подключить `ProductViewSet` к router, проверить все HTTP-методы, `select_related("category")` на queryset.

---

## Шаг 1. ViewSet (эталон)

```python
# api/views.py
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer
    filterset_class = ProductFilter
    search_fields = ["sku", "title"]
    ordering_fields = ["price", "created_at", "title"]
```

`ReadOnlyModelViewSet` — только GET; `ModelViewSet` — все verbs.

---

## Шаг 2. Router

```python
# api/urls.py
from rest_framework.routers import DefaultRouter
from api.views import CategoryViewSet, ProductViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("products", ProductViewSet, basename="product")

urlpatterns = router.urls
```

Авто-URLs:

| Method | URL | Action |
|--------|-----|--------|
| GET | `/products/` | list |
| POST | `/products/` | create |
| GET | `/products/{pk}/` | retrieve |
| PUT/PATCH | `/products/{pk}/` | update |
| DELETE | `/products/{pk}/` | destroy |

---

## Шаг 3. CRUD curl

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

## Шаг 4. Проверка N+1

```bash
docker exec mock-django-web python manage.py shell
```

```python
from django.db import connection, reset_queries
from django.conf import settings
settings.DEBUG = True
reset_queries()
list(Product.objects.select_related("category")[:5])
len(connection.queries)  # orientir: 1 query
```

Без `select_related` — 1 + N запросов на list.

---

## Шаг 5. Custom action (опционально)

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

## Критерии приёмки

- [ ] `GET /products/` → `count`, `results` (pagination)
- [ ] POST создаёт запись, возвращает 201
- [ ] PATCH меняет price
- [ ] DELETE → 204
- [ ] queryset использует `select_related("category")`

Далее: [27-filtering-pagination](27-filtering-pagination.md).
