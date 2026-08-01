# 24. Lab: your first Serializer

## Scenario

The mobile app wants JSON instead of the HTML admin. The first step into DRF is the **Serializer**: validation plus ORM-to-JSON representation.

**Prerequisite:** [23-drf-intro](23-drf-intro.md), the `Category` and `Product` models.

---

## Goal

1. `CategorySerializer` and `ProductSerializer`, with a nested read-only FK and a write-only FK.
2. Verify in `manage.py shell` and through the API list.

---

## Step 1. CategorySerializer

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

## Step 2. ProductSerializer

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

**Pattern:** nested `category` for reads, `category_id` for writes — clients don't need to send a nested object.

---

## Step 3. Validate in the shell

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

## Step 4. Wire it into an APIView (minimal)

```python
# api/views.py — temporary, until the ViewSet
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

You'll swap this for a ViewSet later — [26-lab-viewsets](26-lab-viewsets.md).

---

## Step 5. curl

```bash
curl -s http://localhost:8092/api/v1/products/ | python -m json.tool | head -40
```

You should see a nested `"category": {"id": 1, "name": "...", "slug": "..."}`.

---

## SerializerMethodField (optional)

```python
category_name = serializers.SerializerMethodField()

def get_category_name(self, obj):
    return obj.category.name
```

A flat API without nesting is sometimes more convenient for mobile.

---

## Acceptance criteria

- [ ] Invalid price → ValidationError in the shell
- [ ] Valid save → row in the DB
- [ ] The JSON list contains a nested category
- [ ] POST with `category_id` works

Next: [25-viewsets-routers](25-viewsets-routers.md).
