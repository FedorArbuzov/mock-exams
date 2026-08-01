# 07. Models: fields, Meta, constraints, __str__

## Intro

The Django ORM is the **single source of truth** for schema. The `Product` model in [`catalog/models.py`](../../deploy/django/stack/web/catalog/models.py) is this course's reference example.

## What you'll learn

- Field types: `CharField`, `DecimalField`, `BooleanField`, `DateTimeField`.
- **`Meta`**: ordering, indexes, verbose_name.
- **`__str__`** for admin and shell readability.
- A preview of **`PROTECT` vs `CASCADE`**.

---

## The Product example

```python
class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    sku = models.CharField(max_length=64, unique=True, db_index=True)
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["is_active", "category"])]

    def __str__(self) -> str:
        return f"{self.sku}: {self.title}"
```

| Field | Why |
|-------|-------|
| DecimalField | for money — never FloatField |
| db_index / Index | speeds up API filters |
| auto_now_add / auto_now | audit trail |

---

## Field options

| Option | Meaning |
|--------|-------|
| null=True | allows DB NULL (avoid on CharField unless you actually need it) |
| blank=True | optional in forms/admin |
| default= | default value |
| unique=True | uniqueness constraint |
| choices= | enum-like restriction |

---

## Validators

```python
from django.core.validators import MinValueValidator

price = models.DecimalField(..., validators=[MinValueValidator(0)])
```

Also see `clean()` on Model — [21-forms](21-forms.md).

---

## default_auto_field

```python
class CatalogConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
```

BigAutoField is the recommended PK type for new projects on Django 4+.

---

## SQL preview

```python
print(Product.objects.filter(is_active=True).query)
```

See [`postgresql-developer/06-n-plus-one`](../postgresql-developer/06-n-plus-one.md).

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| FloatField for price | use DecimalField |
| null=True on a CharField | prefer blank=True |
| No __str__ | admin shows "Product object (1)" |

## Summary

Models are schema plus a Python API. Meta handles ordering/indexes. Use Decimal for money. __str__ improves the UX.

Next: [08-lab-models](08-lab-models.md).
