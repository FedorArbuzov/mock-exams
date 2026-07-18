# 14. Лаба: эволюция схемы (migrations)

## Сценарий

Product получает поле **`is_featured`** (boolean) и **unique constraint** на `(category, title)` для business rule «уникальное имя в категории».

**Предварительно:** [13-migrations](13-migrations.md).

---

## Цель

1. Изменить models → `makemigrations`.
2. Применить на стенде → `migrate`.
3. Data migration (опционально): выставить `is_featured=True` для дорогих товаров.

---

## Шаг 1. Model change

```python
# catalog/models.py — Product
is_featured = models.BooleanField(default=False)

class Meta:
    ...
    constraints = [
        models.UniqueConstraint(
            fields=["category", "title"],
            name="uniq_product_title_per_category",
        ),
    ]
```

---

## Шаг 2. Generate migration

```bash
docker exec mock-django-web python manage.py makemigrations catalog --name product_featured_uniq
docker exec mock-django-web python manage.py sqlmigrate catalog 0002  # номер проверьте
```

Просмотрите SQL — `AddField`, `AddConstraint`.

---

## Шаг 3. Apply

```bash
docker exec mock-django-web python manage.py migrate
docker exec mock-django-web python manage.py showmigrations catalog
```

---

## Шаг 4. Data migration (опционально)

```bash
docker exec mock-django-web python manage.py makemigrations catalog --empty --name set_featured_flag
```

```python
# catalog/migrations/0003_set_featured_flag.py
from django.db import migrations

def forwards(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    Product.objects.filter(price__gte=100).update(is_featured=True)

def backwards(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    Product.objects.update(is_featured=False)

class Migration(migrations.Migration):
    dependencies = [("catalog", "0002_product_featured_uniq")]
    operations = [migrations.RunPython(forwards, backwards)]
```

**Rule:** в RunPython использовать `apps.get_model`, не import models напрямую.

---

## Шаг 5. Проверка constraint

```bash
docker exec -it mock-django-web python manage.py shell
```

```python
from catalog.models import Category, Product
c = Category.objects.first()
Product.objects.create(sku="U1", title="Same", price=1, category=c)
Product.objects.create(sku="U2", title="Same", price=2, category=c)  # IntegrityError
```

---

## Rollback (dev only)

```bash
docker exec mock-django-web python manage.py migrate catalog 0001
```

**Prod:** не откатывайте без плана — [`postgresql-developer`](../postgresql-developer/README.md).

---

## Критерии приёмки

- [ ] Migration files committed
- [ ] `migrate` без ошибок на чистой БД
- [ ] Duplicate title in same category → IntegrityError
- [ ] Data migration (если делали) — featured товары помечены

Далее: [15-django-admin](15-django-admin.md).
