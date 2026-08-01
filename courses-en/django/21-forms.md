# 21. Forms and ModelForm: validation, clean()

## Overview

DRF serializers handle the API — **Forms** cover HTML POSTs and admin-adjacent flows.

```python
from django import forms
from catalog.models import Product

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ["sku", "title", "price", "category", "stock"]

    def clean_price(self):
        price = self.cleaned_data["price"]
        if price <= 0:
            raise forms.ValidationError("Price must be positive")
        return price

    def clean(self):
        cleaned = super().clean()
        # cross-field validation
        return cleaned
```

---

## View handling

```python
def product_create(request):
    if request.method == "POST":
        form = ProductForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("product-list")
    else:
        form = ProductForm()
    return render(request, "catalog/product_form.html", {"form": form})
```

---

## vs Serializer

| Form | Serializer |
|------|------------|
| HTML | JSON |
| ModelForm | ModelSerializer |

The patterns mirror each other — [23-drf-intro](23-drf-intro.md).

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Skip is_valid() | always validate |
| Validation in view not form | clean_* methods |

## Summary

ModelForm binds the model plus validation. clean_field hooks let you customize per-field checks. Pair it with a CSRF-protected POST view.

Next: [22-lab-forms](22-lab-forms.md).
