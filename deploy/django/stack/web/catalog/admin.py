from django.contrib import admin

from catalog.models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("sku", "title", "category", "price", "is_active", "updated_at")
    list_filter = ("is_active", "category")
    search_fields = ("sku", "title")
    list_editable = ("is_active",)
