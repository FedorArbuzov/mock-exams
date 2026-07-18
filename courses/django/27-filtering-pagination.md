# 27. Filtering, search, ordering, pagination

## Введение

API без фильтров — клиент качает **10k products**. django-filter + DRF — standard.

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

CursorPagination for large feeds — interview topic.

---

## Ordering

`ordering_fields` whitelist — **never** raw user ORDER BY without whitelist (SQL injection style issues via ORM edge cases).

---

## FastAPI parallel

[`fastapi/17-pagination-filters`](../fastapi/17-pagination-filters.md).

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| Unbounded list | pagination required |
| filter every field | indexed fields only |

## Резюме

FilterSet + search + ordering + pagination = production list API.

Далее: [28-lab-api-filters](28-lab-api-filters.md).
