# 14. Lab: schema evolution (migrations)

## Scenario

Product gets an **`is_featured`** boolean field and a **unique constraint** on `(category, title)` for the business rule "unique name within a category."

**Prerequisite:** [13-migrations](13-migrations.md).

---

## Goal

1. Change the models → `makemigrations`.
2. Apply on the stand → `migrate`.
3. Data migration (optional): set `is_featured=True` for expensive products.

---

## Step 1. Model change

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

## Step 2. Generate migration

```bash
docker exec mock-django-web python manage.py makemigrations catalog --name product_featured_uniq
docker exec mock-django-web python manage.py sqlmigrate catalog 0002  # check the number
```

Review the SQL — `AddField`, `AddConstraint`.

---

## Step 3. Apply

```bash
docker exec mock-django-web python manage.py migrate
docker exec mock-django-web python manage.py showmigrations catalog
```

---

## Step 4. Data migration (optional)

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

**Rule:** in RunPython, use `apps.get_model`, not a direct import of the models.

---

## Step 5. Verify the constraint

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

**Prod:** don't roll back without a plan — [`postgresql-developer`](../postgresql-developer/README.md).

---

## Acceptance criteria

- [ ] Migration files committed
- [ ] `migrate` runs with no errors on a clean DB
- [ ] Duplicate title in the same category → IntegrityError
- [ ] Data migration (if you did it) — featured products are flagged

Next: [15-django-admin](15-django-admin.md).
