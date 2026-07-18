# 15. Django Admin: ModelAdmin, inlines, actions

## Введение

Ops: «нужен UI для модерации товаров **завтра**». Admin — killer feature Django.

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

Admin respects model **add/change/delete** permissions per user/group.

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
- `/admin/` not public without VPN/IP allow
- 2FA plugins for prod

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| list_editable + pagination without save | use actions |
| Expose admin publicly | IP restrict |

## Резюме

ModelAdmin = quick internal UI. list_filter, search, actions. Not a replacement for public API.

Далее: [16-lab-admin](16-lab-admin.md).
