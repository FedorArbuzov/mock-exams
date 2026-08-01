# 27. Filtering, search, ordering, pagination

## Introduction

An API without filters means the client downloads **10k products**. django-filter + DRF is the standard fix.

```python
class ProductFilter(filters.FilterSet):
    min_price = filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = filters.NumberFilter(field_name="price", lookup_expr="lte")
    category = filters.CharFilter(field_name="category__slug")

    class Meta:
        model = Product
        fields = ["is_active", "category", "min_price", "max_price"]
```

Query:

```text
GET /api/v1/products/?category=books&min_price=10&ordering=-price
GET /api/v1/products/?search=django
```

---

## Pagination

```python
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}
```

Response:

```json
{"count": 100, "next": "...", "previous": null, "results": [...]}
```

CursorPagination for large feeds — a common interview topic.

---

## Ordering

`ordering_fields` is a whitelist — **never** let users pass a raw ORDER BY without one (ORM edge cases can open up SQL-injection-style issues).

---

## FastAPI parallel

[`fastapi/17-pagination-filters`](../fastapi/17-pagination-filters.md).

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Unbounded list | pagination required |
| filter every field | indexed fields only |

## Summary

FilterSet + search + ordering + pagination together make a production-ready list API.

Next: [28-lab-api-filters](28-lab-api-filters.md).
