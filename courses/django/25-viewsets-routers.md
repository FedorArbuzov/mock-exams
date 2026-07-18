# 25. ViewSets, Routers, actions

## Введение

ViewSet = **CRUD verbs** one class. Router = **URL boilerplate** elimination.

```python
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer
    filterset_class = ProductFilter
    search_fields = ["sku", "title"]
    ordering_fields = ["price", "created_at"]
```

```python
router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")
```

URLs:

| Method | URL | Action |
|--------|-----|--------|
| GET | /products/ | list |
| POST | /products/ | create |
| GET | /products/{id}/ | retrieve |
| PUT/PATCH | /products/{id}/ | update |
| DELETE | /products/{id}/ | destroy |

---

## ReadOnlyModelViewSet

```python
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    lookup_field = "slug"
```

---

## @action decorator

```python
from rest_framework.decorators import action

class ProductViewSet(viewsets.ModelViewSet):
    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        product = self.get_object()
        product.is_active = False
        product.save()
        return Response({"status": "deactivated"})
```

URL: `/products/{id}/deactivate/`

---

## ViewSet vs APIView

| ViewSet | APIView |
|---------|---------|
| standard CRUD | custom flows |
| less URL code | explicit |

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| queryset all() no filter | override get_queryset |
| basename clash | unique basename |

## Резюме

ModelViewSet + DefaultRouter = REST CRUD. @action for custom endpoints. lookup_field for slug.

Далее: [26-lab-viewsets](26-lab-viewsets.md).
