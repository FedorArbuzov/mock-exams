# 07. Models: поля, Meta, constraints, __str__

## Введение

ORM Django — **single source of truth** для schema. Модель `Product` в [`catalog/models.py`](../../deploy/django/stack/web/catalog/models.py) — эталон курса.

## Что вы узнаете

- Field types: `CharField`, `DecimalField`, `BooleanField`, `DateTimeField`.
- **`Meta`**: ordering, indexes, verbose_name.
- **`__str__`** для admin и shell.
- **`PROTECT` vs `CASCADE`** preview.

---

## Пример Product

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

| Field | Зачем |
|-------|-------|
| DecimalField | деньги — не FloatField |
| db_index / Index | фильтры API |
| auto_now_add / auto_now | audit |

---

## Field options

| Option | Смысл |
|--------|-------|
| null=True | DB NULL (не для CharField без need) |
| blank=True | форма/admin optional |
| default= | значение по умолчанию |
| unique=True | constraint |
| choices= | enum-like |

---

## Validators

```python
from django.core.validators import MinValueValidator

price = models.DecimalField(..., validators=[MinValueValidator(0)])
```

Also: `clean()` on Model — [21-forms](21-forms.md).

---

## default_auto_field

```python
class CatalogConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
```

BigAutoField — PK для новых projects Django 4+.

---

## SQL preview

```python
print(Product.objects.filter(is_active=True).query)
```

См. [`postgresql-developer/06-n-plus-one`](../postgresql-developer/06-n-plus-one.md).

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| FloatField для price | DecimalField |
| null=True на CharField | prefer blank=True |
| Нет __str__ | admin показывает Product object (1) |

## Резюме

Models = schema + Python API. Meta для ordering/indexes. Decimal для money. __str__ для UX.

Далее: [08-lab-models](08-lab-models.md).
