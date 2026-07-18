# 16. Лаба: admin catalog

## Сценарий

Support team живёт в **Django Admin** — фильтры, поиск, bulk actions быстрее, чем raw SQL. Настроим `Category` и `Product` для ежедневной работы.

**Предварительно:** [15-django-admin](15-django-admin.md), стенд **8092**.

---

## Цель

1. Зарегистрировать модели с `list_display`, `search_fields`, `list_filter`.
2. Inline products на странице Category (опционально).
3. Custom action «deactivate selected».

---

## Шаг 1. CategoryAdmin

```python
# catalog/admin.py
from django.contrib import admin
from catalog.models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")
    ordering = ("name",)
```

`prepopulated_fields` — slug из name при создании.

---

## Шаг 2. ProductAdmin

```python
class ProductInline(admin.TabularInline):
    model = Product
    extra = 0
    fields = ("sku", "title", "price", "is_active")
    show_change_link = True


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("sku", "title", "category", "price", "is_active", "created_at")
    list_filter = ("is_active", "category", "created_at")
    search_fields = ("sku", "title", "description")
    list_editable = ("is_active",)
    autocomplete_fields = ("category",)
    readonly_fields = ("created_at", "updated_at")
    actions = ["deactivate_products"]

    @admin.action(description="Deactivate selected products")
    def deactivate_products(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"Deactivated {updated} products.")
```

Добавьте `search_fields` на Category — иначе autocomplete не заработает.

---

## Шаг 3. Inline на Category

```python
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    inlines = [ProductInline]
    ...
```

---

## Шаг 4. createsuperuser + smoke

```bash
docker exec -it mock-django-web python manage.py createsuperuser
# browser: http://localhost:8092/admin/
```

Проверьте:

- Поиск по SKU
- Filter по category
- Bulk action deactivate
- Inline add product на category page

---

## Шаг 5. Readonly для audit

```python
def has_delete_permission(self, request, obj=None):
    return request.user.is_superuser
```

Business rule: только superuser удаляет Product (`on_delete=PROTECT` на category всё равно защищает category).

---

## Admin vs DRF

| Задача | Admin | DRF |
|--------|-------|-----|
| Internal ops | ✓ | |
| Public/mobile API | | ✓ |
| Permissions | Django auth | DRF permissions |

---

## Критерии приёмки

- [ ] `/admin/` login работает
- [ ] Product list: columns sku, title, price, is_active
- [ ] Search по SKU находит товар
- [ ] Action deactivate меняет `is_active` без ошибок

Далее: [17-urls-views](17-urls-views.md).
