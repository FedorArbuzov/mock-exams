# 16. Lab: catalog admin

## Scenario

The support team lives in **Django Admin** — filters, search, and bulk actions are faster than raw SQL. Let's set up `Category` and `Product` for daily work.

**Prerequisite:** [15-django-admin](15-django-admin.md), stand **8092**.

---

## Goal

1. Register the models with `list_display`, `search_fields`, `list_filter`.
2. Inline products on the Category page (optional).
3. Custom "deactivate selected" action.

---

## Step 1. CategoryAdmin

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

`prepopulated_fields` — derives the slug from name on creation.

---

## Step 2. ProductAdmin

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

Add `search_fields` on Category too — otherwise autocomplete won't work.

---

## Step 3. Inline on Category

```python
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    inlines = [ProductInline]
    ...
```

---

## Step 4. createsuperuser + smoke test

```bash
docker exec -it mock-django-web python manage.py createsuperuser
# browser: http://localhost:8092/admin/
```

Check:

- Search by SKU
- Filter by category
- Bulk deactivate action
- Inline add product on the category page

---

## Step 5. Readonly for audit

```python
def has_delete_permission(self, request, obj=None):
    return request.user.is_superuser
```

Business rule: only a superuser can delete a Product (`on_delete=PROTECT` on category still protects the category either way).

---

## Admin vs DRF

| Task | Admin | DRF |
|------|-------|-----|
| Internal ops | ✓ | |
| Public/mobile API | | ✓ |
| Permissions | Django auth | DRF permissions |

---

## Acceptance criteria

- [ ] `/admin/` login works
- [ ] Product list: columns sku, title, price, is_active
- [ ] Search by SKU finds the product
- [ ] Deactivate action changes `is_active` with no errors

Next: [17-urls-views](17-urls-views.md).
