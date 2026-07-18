# 22. Лаба: форма создания Product

## Сценарий

Менеджер каталога хочет **HTML-форму** «добавить товар» без Postman. ModelForm + function view + template — классический Django flow до эры SPA.

**Предварительно:** [21-forms](21-forms.md), модели `catalog`, стенд **8092**.

---

## Цель

Страница **`/shop/add/`** — создание `Product` через POST с CSRF, валидацией цены и отображением ошибок.

---

## Шаг 1. ProductForm

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
            raise forms.ValidationError("Цена должна быть больше нуля")
        return price
```

---

## Шаг 2. View

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

Для dev без login можно временно убрать `@login_required` — в prod только staff.

---

## Шаг 3. URL

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

## Шаг 4. Template

```html
<!-- catalog/templates/catalog/product_form.html -->
{% extends "base.html" %}
{% block content %}
<h1>Новый товар</h1>
<form method="post">
  {% csrf_token %}
  {{ form.as_p }}
  <button type="submit">Сохранить</button>
</form>
{% if form.errors %}
  <pre>{{ form.errors }}</pre>
{% endif %}
{% endblock %}
```

Минимальный `base.html` — см. [20-lab-templates](20-lab-templates.md).

---

## Шаг 5. Проверка

1. `createsuperuser` → login `/admin/` (session cookie для `/shop/add/`).
2. POST валидные данные → product в admin и `GET /api/v1/products/`.
3. POST `price=-1` → форма с ошибкой, **без** записи в БД.

```bash
docker exec mock-django-web python manage.py createsuperuser
curl -s http://localhost:8092/shop/add/ | head -c 300
```

---

## Связь Form ↔ Serializer

| Шаг | Form | DRF Serializer |
|-----|------|----------------|
| Bind input | `request.POST` | `request.data` |
| Validate | `is_valid()` | `is_valid()` |
| Save | `form.save()` | `serializer.save()` |

Тот же domain — разный transport. Далее API-only: [23-drf-intro](23-drf-intro.md).

---

## Критерии приёмки

- [ ] GET `/shop/add/` — форма с полями sku, title, price, category
- [ ] POST с валидными данными создаёт Product
- [ ] POST с `price=0` показывает ошибку validation
- [ ] CSRF token присутствует в HTML

Далее: [23-drf-intro](23-drf-intro.md).
