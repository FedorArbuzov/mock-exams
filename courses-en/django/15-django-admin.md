# 15. Django Admin: ModelAdmin, inlines, actions

## Introduction

Ops: "we need a UI for moderating products **by tomorrow**." Admin is Django's killer feature.

## ModelAdmin features

```python
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("sku", "title", "category", "price", "is_active", "updated_at")
    list_filter = ("is_active", "category")
    search_fields = ("sku", "title")
    list_editable = ("is_active",)
    prepopulated_fields = {"slug": ("name",)}  # Category
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-updated_at",)
```

---

## Inlines

```python
class OrderInline(admin.TabularInline):
    model = Order
    extra = 0

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = [OrderInline]
```

---

## Actions

```python
@admin.action(description="Deactivate selected")
def deactivate(modeladmin, request, queryset):
    queryset.update(is_active=False)

class ProductAdmin(admin.ModelAdmin):
    actions = [deactivate]
```

---

## Permissions

Admin respects the model's **add/change/delete** permissions per user/group.

---

## Custom admin site (optional)

```python
admin_site = AdminSite(name="catalog_admin")
```

---

## Admin vs DRF

| Admin | DRF |
|-------|-----|
| Internal users | Public/partner API |
| Rapid CRUD | Versioned contract |

---

## Security

- Strong superuser passwords
- `/admin/` not exposed publicly without VPN/IP allowlist
- 2FA plugins for prod

---

## Common mistakes

| Mistake | Fix |
|---------|-----|
| list_editable + pagination without save | use actions |
| Expose admin publicly | IP restrict |

## Summary

ModelAdmin gives you a quick internal UI: list_filter, search, actions. It's not a replacement for a public API.

Next: [16-lab-admin](16-lab-admin.md).
