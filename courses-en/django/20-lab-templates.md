# 20. Lab: storefront page (templates)

## Scenario

Marketing wants a **catalog landing page** — an HTML list of active products, no React. Django templates + static CSS + context from the ORM.

**Prerequisite:** [19-templates-static](19-templates-static.md), the `Product` and `Category` models.

---

## Goal

1. Base template + static CSS.
2. `product_list` view filtering on `is_active=True`.
3. `/shop/` URL renders a table of products.

---

## Step 1. Template layout

```text
catalog/templates/catalog/
  base.html
  product_list.html
catalog/static/catalog/
  shop.css
```

`APP_DIRS: True` in settings — Django looks for `templates/` inside each app.

---

## Step 2. base.html

```html
{% load static %}
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>{% block title %}Shop{% endblock %}</title>
  <link rel="stylesheet" href="{% static 'catalog/shop.css' %}">
</head>
<body>
  <header><h1>Course Catalog</h1></header>
  <main>{% block content %}{% endblock %}</main>
</body>
</html>
```

---

## Step 3. product_list.html

```html
{% extends "catalog/base.html" %}
{% block title %}Products{% endblock %}
{% block content %}
<table>
  <thead><tr><th>SKU</th><th>Title</th><th>Price</th><th>Category</th></tr></thead>
  <tbody>
  {% for p in products %}
    <tr>
      <td>{{ p.sku }}</td>
      <td>{{ p.title }}</td>
      <td>{{ p.price }}</td>
      <td>{{ p.category.name }}</td>
    </tr>
  {% empty %}
    <tr><td colspan="4">No products</td></tr>
  {% endfor %}
  </tbody>
</table>
{% endblock %}
```

---

## Step 4. View + URL

```python
# catalog/views.py
from django.shortcuts import render
from catalog.models import Product

def product_list(request):
    products = Product.objects.filter(is_active=True).select_related("category")
    return render(request, "catalog/product_list.html", {"products": products})
```

```python
path("shop/", views.product_list, name="product-list"),
```

---

## Step 5. Static in dev vs prod

| Mode | Static |
|-------|--------|
| DEBUG=True | `runserver` serves straight from app folders |
| gunicorn + WhiteNoise | `collectstatic` into the image |

In the sample compose stack, WhiteNoise is already in `MIDDLEWARE`. After adding the CSS:

```bash
docker exec mock-django-web python manage.py collectstatic --noinput
curl -sI http://localhost:8092/static/catalog/shop.css
```

---

## Step 6. Check

```bash
curl -s http://localhost:8092/shop/ | grep -o '<td>[^<]*</td>' | head -8
```

Open it in a browser — the CSS should be applied.

---

## Optional: fragment cache

```html
{% load cache %}
{% cache 300 product_table products.version %}
...
{% endcache %}
```

See [33-caching-redis](33-caching-redis.md).

---

## Acceptance criteria

- [ ] `/shop/` returns 200 HTML
- [ ] The table only shows `is_active=True` rows
- [ ] The CSS loads (no 404)
- [ ] No N+1 — the view uses `select_related("category")`

Next: [21-forms](21-forms.md).
