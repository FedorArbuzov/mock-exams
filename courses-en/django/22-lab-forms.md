# 22. Lab: a Product-creation form

## Scenario

The catalog manager wants an **HTML form** to add a product, no Postman needed. ModelForm + function view + template — the classic Django flow from before the SPA era.

**Prerequisite:** [21-forms](21-forms.md), the `catalog` models, the **8092** stack.

---

## Goal

A **`/shop/add/`** page that creates a `Product` via POST, with CSRF, price validation, and error display.

---

## Step 1. ProductForm

```python
# catalog/forms.py
from django import forms
from catalog.models import Product


class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ["sku", "title", "description", "price", "category", "is_active"]

    def clean_price(self):
        price = self.cleaned_data["price"]
        if price <= 0:
            raise forms.ValidationError("Price must be greater than zero")
        return price
```

---

## Step 2. View

```python
# catalog/views.py
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from catalog.forms import ProductForm


@login_required
def product_create(request):
    if request.method == "POST":
        form = ProductForm(request.POST)
        if form.is_valid():
            product = form.save()
            return redirect("admin:catalog_product_change", product.pk)
    else:
        form = ProductForm()
    return render(request, "catalog/product_form.html", {"form": form})
```

For dev without login, you can temporarily drop `@login_required` — in prod, restrict it to staff only.

---

## Step 3. URL

```python
# catalog/urls.py
from django.urls import path
from catalog import views

urlpatterns = [
    path("shop/add/", views.product_create, name="product-create"),
]
```

```python
# config/urls.py
path("", include("catalog.urls")),
```

---

## Step 4. Template

```html
<!-- catalog/templates/catalog/product_form.html -->
{% extends "base.html" %}
{% block content %}
<h1>New product</h1>
<form method="post">
  {% csrf_token %}
  {{ form.as_p }}
  <button type="submit">Save</button>
</form>
{% if form.errors %}
  <pre>{{ form.errors }}</pre>
{% endif %}
{% endblock %}
```

For a minimal `base.html`, see [20-lab-templates](20-lab-templates.md).

---

## Step 5. Check

1. `createsuperuser` → log in at `/admin/` (the session cookie also covers `/shop/add/`).
2. POST valid data → the product shows up in admin and in `GET /api/v1/products/`.
3. POST `price=-1` → the form comes back with an error, **nothing** written to the DB.

```bash
docker exec mock-django-web python manage.py createsuperuser
curl -s http://localhost:8092/shop/add/ | head -c 300
```

---

## Form vs Serializer, side by side

| Step | Form | DRF Serializer |
|-----|------|----------------|
| Bind input | `request.POST` | `request.data` |
| Validate | `is_valid()` | `is_valid()` |
| Save | `form.save()` | `serializer.save()` |

Same domain, different transport. Next, API-only: [23-drf-intro](23-drf-intro.md).

---

## Acceptance criteria

- [ ] GET `/shop/add/` shows a form with sku, title, price, category fields
- [ ] POST with valid data creates a Product
- [ ] POST with `price=0` shows a validation error
- [ ] The CSRF token is present in the HTML

Next: [23-drf-intro](23-drf-intro.md).
