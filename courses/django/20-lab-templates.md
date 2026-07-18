# 20. Лаба: storefront page (templates)

## Сценарий

Marketing просит **лендинг каталога** — HTML-список активных товаров без React. Django templates + static CSS + context из ORM.

**Предварительно:** [19-templates-static](19-templates-static.md), модели `Product`, `Category`.

---

## Цель

1. Base template + CSS static.
2. View `product_list` с фильтром `is_active=True`.
3. URL `/shop/` рендерит таблицу товаров.

---

## Шаг 1. Структура templates

```text
catalog/templates/catalog/
  base.html
  product_list.html
catalog/static/catalog/
  shop.css
```

`APP_DIRS: True` в settings — Django ищет `templates/` внутри apps.

---

## Шаг 2. base.html

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

## Шаг 3. product_list.html

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

## Шаг 4. View + URL

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

## Шаг 5. Static в dev vs prod

| Режим | Static |
|-------|--------|
| DEBUG=True | `runserver` отдаёт из app folders |
| gunicorn + WhiteNoise | `collectstatic` в образ |

Стенд compose: WhiteNoise уже в `MIDDLEWARE`. После добавления CSS:

```bash
docker exec mock-django-web python manage.py collectstatic --noinput
curl -sI http://localhost:8092/static/catalog/shop.css
```

---

## Шаг 6. Проверка

```bash
curl -s http://localhost:8092/shop/ | grep -o '<td>[^<]*</td>' | head -8
```

Откройте в браузере — CSS применился.

---

## Опционально: fragment cache

```html
{% load cache %}
{% cache 300 product_table products.version %}
...
{% endcache %}
```

См. [33-caching-redis](33-caching-redis.md).

---

## Критерии приёмки

- [ ] `/shop/` возвращает 200 HTML
- [ ] В таблице только `is_active=True`
- [ ] CSS загружается (не 404)
- [ ] Нет N+1 — view использует `select_related("category")`

Далее: [21-forms](21-forms.md).
