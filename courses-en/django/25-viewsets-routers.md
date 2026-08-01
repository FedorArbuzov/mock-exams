# 25. ViewSets, Routers, actions

## Introduction

A ViewSet packs all the CRUD verbs into one class. A Router eliminates URL boilerplate.

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

## Common mistakes

| Mistake | Fix |
|--------|-----|
| queryset all() no filter | override get_queryset |
| basename clash | unique basename |

## Summary

ModelViewSet + DefaultRouter gives you REST CRUD out of the box. Use @action for custom endpoints, lookup_field for slugs.

Next: [26-lab-viewsets](26-lab-viewsets.md).
