# 23. DRF: архитектура, Serializer, Response

## Введение

**Django REST Framework** — de-facto REST слой. Эталон: [`api/`](../../deploy/django/stack/web/api/).

## Компоненты

```mermaid
flowchart LR
  Request --> View/APIView
  View --> Serializer
  Serializer --> Model
  View --> Response JSON
```

| Piece | Role |
|-------|------|
| Serializer | validation + to/from JSON |
| View / ViewSet | HTTP methods |
| Router | URL registration |
| Permission | authz |
| Pagination | list size |

---

## ModelSerializer

```python
class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = ("id", "sku", "title", "price", "category", "category_name", ...)
```

---

## APIView example

```python
from rest_framework.views import APIView
from rest_framework.response import Response

class ProductListAPIView(APIView):
    def get(self, request):
        qs = Product.objects.filter(is_active=True)[:20]
        return Response(ProductSerializer(qs, many=True).data)
```

ViewSets preferred for CRUD — [25-viewsets-routers](25-viewsets-routers.md).

---

## Browsable API

HTML helper in DEBUG — disable in prod or restrict.

---

## vs FastAPI

| DRF | FastAPI |
|-----|---------|
| Serializer | Pydantic |
| Tied to Django ORM | agnostic |
| Admin same project | separate often |

[`fastapi/04-pydantic-v2`](../fastapi/04-pydantic-v2.md).

---

## REST_FRAMEWORK settings

```python
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}
```

---

## Типичные ошибки

| Ошибение | Fix |
|----------|-----|
| Serializer without validation | is_valid in APIView post |
| N+1 in list serializer | select_related in queryset |

## Резюме

DRF = serializers + views + routers. ModelSerializer mirrors ModelForm. ViewSets next.

Далее: [24-lab-serializers](24-lab-serializers.md).
