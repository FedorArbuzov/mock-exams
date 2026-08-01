# 19. Templates, static files, context processors

## Overview

The Django Template Language is **not** arbitrary Python — by design — which is what keeps SSR safe.

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

**WhiteNoise** is in the stack — it serves static files from gunicorn without nginx (fine for dev/small prod). For larger prod deployments, use nginx — [40-nginx-static](40-nginx-static.md).

---

## Template loaders

`APP_DIRS=True` — searches `app/templates/`.

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

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Logic in templates | move to view |
| Missing collectstatic | 404 on css in prod |

## Summary

DTL handles SSR. static + collectstatic. WhiteNoise for simple deployments.

Next: [20-lab-templates](20-lab-templates.md).
