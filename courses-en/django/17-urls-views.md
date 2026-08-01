# 17. URLs and Views: FBV, CBV, HttpResponse

## Overview

DRF covers the API — but **SSR pages**, health checks, and legacy endpoints use **django.views**.

## URLconf

```python
from django.urls import path
from catalog import views

urlpatterns = [
    path("products/", views.product_list, name="product-list"),
    path("products/<slug:sku>/", views.product_detail, name="product-detail"),
]
```

`path()` converters: int, slug, uuid, path.

---

## Function-Based View

```python
from django.shortcuts import get_object_or_404, render
from catalog.models import Product

def product_list(request):
    products = Product.objects.filter(is_active=True).select_related("category")[:50]
    return render(request, "catalog/product_list.html", {"products": products})

def product_detail(request, sku):
    product = get_object_or_404(Product, sku=sku, is_active=True)
    return render(request, "catalog/product_detail.html", {"product": product})
```

---

## Class-Based Views

```python
from django.views.generic import ListView, DetailView

class ProductListView(ListView):
    model = Product
    template_name = "catalog/product_list.html"
    queryset = Product.objects.filter(is_active=True).select_related("category")
    paginate_by = 20

class ProductDetailView(DetailView):
    model = Product
    slug_field = "sku"
    slug_url_kwarg = "sku"
```

| FBV | CBV |
|-----|-----|
| explicit | reuse generic |
| any logic | CRUD-like |

---

## JsonResponse

```python
from django.http import JsonResponse

def health(request):
    return JsonResponse({"status": "ok"})
```

Used in [`config/urls.py`](../../deploy/django/stack/web/config/urls.py).

---

## Request object

`request.method`, `request.GET`, `request.POST`, `request.user`.

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| get() in view | get_object_or_404 |
| No CSRF on POST form | {% csrf_token %} |

## Summary

URLs route to views. FBVs are flexible; CBVs suit lists/details. JsonResponse handles simple JSON. Templates are next.

Next: [18-lab-views](18-lab-views.md).
