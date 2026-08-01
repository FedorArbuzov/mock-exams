# 08. Lab: extending the catalog models

## Scenario

The product team wants a **`stock`** field (units on hand) and a **`Meta.verbose_name`** for the admin. Any model change flows through: migration → serializer → API contract.

**Prerequisites:** [07-models-basics](07-models-basics.md), the [`deploy/django`](../../deploy/django/README.md) stack.

---

## Goal

1. Add `stock` and improve `Meta` on `Product`.
2. Generate and apply the migration.
3. Wire the field into the DRF serializer and verify the JSON.

---

## Task 1. Change the model

```python
# catalog/models.py — Product fragment
stock = models.PositiveIntegerField(default=0, help_text="Units available")

class Meta:
    ordering = ["-created_at"]
    verbose_name = "product"
    verbose_name_plural = "products"
    indexes = [
        models.Index(fields=["is_active", "category"]),
        models.Index(fields=["stock"]),  # optional: filter low stock
    ]
```

`PositiveIntegerField` rejects negative values at the form/validation level.

---

## Task 2. makemigrations + migrate

```bash
cd deploy/django
docker compose up -d

docker exec mock-django-web python manage.py makemigrations catalog --name add_product_stock
docker exec mock-django-web python manage.py migrate
docker exec mock-django-web python manage.py showmigrations catalog
```

Expect a new file, `catalog/migrations/0002_add_product_stock.py` (the number may differ).

**Zero-downtime note:** adding a column with `default=0` is a safe operation in PostgreSQL for large tables (new rows get it immediately; existing rows are backfilled during migrate).

---

## Task 3. Admin (optional)

```python
# catalog/admin.py
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("sku", "title", "price", "stock", "is_active")
    list_filter = ("is_active", "category")
```

---

## Task 4. ProductSerializer

```python
# api/serializers.py
class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )

    class Meta:
        model = Product
        fields = [
            "id", "sku", "title", "description", "price", "stock",
            "is_active", "category", "category_id", "created_at",
        ]
        read_only_fields = ["created_at"]
```

---

## Task 5. API smoke test

```bash
# get a category id
curl -s http://localhost:8092/api/v1/categories/

# create a product (if POST is allowed)
curl -s -X POST http://localhost:8092/api/v1/products/ \
  -H "Content-Type: application/json" \
  -d '{"sku":"LAB-001","title":"Lab item","price":"19.99","stock":100,"category_id":1}'

curl -s http://localhost:8092/api/v1/products/?search=LAB-001
```

---

## Task 6. Verify via the ORM shell

```bash
docker exec -it mock-django-web python manage.py shell
```

```python
from catalog.models import Product
p = Product.objects.first()
p.stock, p.stock.__class__
Product.objects.filter(stock=0).count()
```

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| `no such column: stock` | forgot to migrate |
| Serializer doesn't return stock | field missing from `fields` |
| Migration conflict | `makemigrations --merge` |

---

## Acceptance criteria

- [ ] migration file is in git
- [ ] `GET /api/v1/products/` includes `"stock": N`
- [ ] admin list shows the stock column
- [ ] `manage.py check` reports no errors

Next: [09-queryset-api](09-queryset-api.md).
