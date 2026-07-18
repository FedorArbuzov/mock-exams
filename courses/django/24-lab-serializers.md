# 24. Лаба: первый Serializer

## Сценарий

Mobile app просит JSON вместо HTML admin. Первый шаг DRF — **Serializer**: validation + representation ORM → JSON.

**Предварительно:** [23-drf-intro](23-drf-intro.md), модели `Category`, `Product`.

---

## Цель

1. `CategorySerializer`, `ProductSerializer` с nested read / write-only FK.
2. Проверка в `manage.py shell` и через API list.

---

## Шаг 1. CategorySerializer

```python
# api/serializers.py
from rest_framework import serializers
from catalog.models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "created_at"]
        read_only_fields = ["created_at"]
```

---

## Шаг 2. ProductSerializer

```python
class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        write_only=True,
    )

    class Meta:
        model = Product
        fields = [
            "id", "sku", "title", "description", "price",
            "is_active", "category", "category_id", "created_at",
        ]
        read_only_fields = ["created_at"]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be positive")
        return value
```

**Паттерн:** nested `category` на read, `category_id` на write — клиенту не нужно слать вложенный объект.

---

## Шаг 3. Shell validation

```bash
docker exec -it mock-django-web python manage.py shell
```

```python
from catalog.models import Category, Product
from api.serializers import ProductSerializer

cat = Category.objects.first()
data = {"sku": "SER-1", "title": "Serializer Lab", "price": "10.00", "category_id": cat.id}
s = ProductSerializer(data=data)
s.is_valid(), s.errors
s.save()
s.data
```

---

## Шаг 4. Подключить к APIView (минимум)

```python
# api/views.py — временно, до ViewSet
from rest_framework.views import APIView
from rest_framework.response import Response

class ProductListCreate(APIView):
    def get(self, request):
        qs = Product.objects.select_related("category").all()[:20]
        return Response(ProductSerializer(qs, many=True).data)

    def post(self, request):
        ser = ProductSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=201)
```

Позже замените на ViewSet — [26-lab-viewsets](26-lab-viewsets.md).

---

## Шаг 5. curl

```bash
curl -s http://localhost:8092/api/v1/products/ | python -m json.tool | head -40
```

Ожидаем nested `"category": {"id": 1, "name": "...", "slug": "..."}`.

---

## SerializerMethodField (опционально)

```python
category_name = serializers.SerializerMethodField()

def get_category_name(self, obj):
    return obj.category.name
```

Flat API без nesting — иногда удобнее для mobile.

---

## Критерии приёмки

- [ ] Invalid price → ValidationError в shell
- [ ] Valid save → row in DB
- [ ] JSON list содержит nested category
- [ ] POST с `category_id` работает

Далее: [25-viewsets-routers](25-viewsets-routers.md).
