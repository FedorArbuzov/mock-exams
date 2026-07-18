# 19. Templates, static files, context processors

## Введение

Django Template Language — **не** произвольный Python (by design) — безопасность в SSR.

## DTL basics

```html
{% extends "base.html" %}
{% block content %}
<h1>{{ category.name }}</h1>
{% for product in products %}
  <article>{{ product.title|truncatewords:10 }}</article>
{% empty %}
  <p>No products.</p>
{% endfor %}
{% if user.is_authenticated %}Hi {{ user.username }}{% endif %}
{% endblock %}
```

| Tag/Filter | Role |
|------------|------|
| {% for %} | loop |
| {% if %} | branch |
| {{ x\|escape }} | auto-escape HTML |
| {% url 'name' %} | reverse URL |
| {% static 'app/style.css' %} | static path |

---

## Static files

```python
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
```

```bash
python manage.py collectstatic
```

**WhiteNoise** in stack — serve static in gunicorn without nginx (dev/small prod). Prod large — nginx [40-nginx-static](40-nginx-static.md).

---

## Template loaders

`APP_DIRS=True` — search `app/templates/`.

---

## Custom tags (optional)

```python
@register.filter
def currency(value):
    return f"${value:.2f}"
```

---

## CSRF in forms

```html
<form method="post">{% csrf_token %}...</form>
```

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| Logic in templates | move to view |
| Missing collectstatic | 404 css prod |

## Резюме

DTL for SSR. static + collectstatic. WhiteNoise for simple deploy.

Далее: [20-lab-templates](20-lab-templates.md).
