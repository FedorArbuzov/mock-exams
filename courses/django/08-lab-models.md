# 08. Лаба: расширение catalog models

## Сценарий

Product team просит поле **`stock`** (остаток на складе) и **`Meta.verbose_name`** для admin. Изменение модели → migration → serializer → API contract.

**Предварительно:** [07-models-basics](07-models-basics.md), стенд [`deploy/django`](../../deploy/django/README.md).

---

## Цель

1. Добавить `stock` и улучшить `Meta` у `Product`.
2. Сгенерировать и применить migration.
3. Прокинуть поле в DRF serializer и проверить JSON.

---

## Задание 1. Изменить model

```python
# catalog/models.py — фрагмент Product
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

`PositiveIntegerField` — не допускает отрицательные значения на уровне формы/validation.

---

## Задание 2. makemigrations + migrate

```bash
cd deploy/django
docker compose up -d

docker exec mock-django-web python manage.py makemigrations catalog --name add_product_stock
docker exec mock-django-web python manage.py migrate
docker exec mock-django-web python manage.py showmigrations catalog
```

Ожидаем: новый файл `catalog/migrations/0002_add_product_stock.py` (номер может отличаться).

**Zero-downtime note:** добавление колонки с `default=0` — безопасная операция в PostgreSQL для больших таблиц (новые строки сразу, старые backfill при migrate).

---

## Задание 3. Admin (опционально)

```python
# catalog/admin.py
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("sku", "title", "price", "stock", "is_active")
    list_filter = ("is_active", "category")
```

---

## Задание 4. ProductSerializer

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

## Задание 5. API smoke

```bash
# получить category id
curl -s http://localhost:8092/api/v1/categories/

# создать product (если POST разрешён)
curl -s -X POST http://localhost:8092/api/v1/products/ \
  -H "Content-Type: application/json" \
  -d '{"sku":"LAB-001","title":"Lab item","price":"19.99","stock":100,"category_id":1}'

curl -s http://localhost:8092/api/v1/products/?search=LAB-001
```

---

## Задание 6. Shell проверка ORM

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

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| `no such column: stock` | забыли migrate |
| Serializer не отдаёт stock | поле не в `fields` |
| Migration conflict | `makemigrations --merge` |

---

## Критерии приёмки

- [ ] migration file в git
- [ ] `GET /api/v1/products/` содержит `"stock": N`
- [ ] admin list показывает колонку stock
- [ ] `manage.py check` без ошибок

Далее: [09-queryset-api](09-queryset-api.md).
