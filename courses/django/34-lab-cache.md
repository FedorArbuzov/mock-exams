# 34. Лаба: cache-aside для списка категорий

## Сценарий

`GET /api/v1/categories/` вызывают **каждый** product list на фронте — 500 RPS на один простой SELECT. Cache-aside в Redis с **инвалидацией при save** Category.

**Предварительно:** [33-caching-redis](33-caching-redis.md), `CACHES` уже в [`settings.py`](../../deploy/django/stack/web/config/settings.py).

---

## Цель

1. Кэшировать JSON-ответ списка категорий на **5 минут**.
2. При create/update/delete Category — **сбрасывать** ключ.
3. Подтвердить hit/miss через redis-cli или логи.

---

## Шаг 1. Константа ключа

```python
# api/cache_keys.py
CATEGORY_LIST_KEY = "api:v1:categories:list"
CATEGORY_LIST_TTL = 300  # seconds
```

Единый префикс `api:v1:` упрощает `KEYS api:v1:*` в dev (в prod — явные delete, не `KEYS`).

---

## Шаг 2. Override list в CategoryViewSet

```python
# api/views.py
from django.core.cache import cache
from rest_framework.response import Response

from api.cache_keys import CATEGORY_LIST_KEY, CATEGORY_LIST_TTL


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = "slug"

    def list(self, request, *args, **kwargs):
        cached = cache.get(CATEGORY_LIST_KEY)
        if cached is not None:
            return Response(cached)
        response = super().list(request, *args, **kwargs)
        cache.set(CATEGORY_LIST_KEY, response.data, timeout=CATEGORY_LIST_TTL)
        return response
```

**Note:** кэшируем **serialized data** (`response.data`), не QuerySet — pickle QuerySet across workers опасен.

---

## Шаг 3. Signal invalidation

```python
# catalog/signals.py
from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from api.cache_keys import CATEGORY_LIST_KEY
from catalog.models import Category


@receiver([post_save, post_delete], sender=Category)
def invalidate_category_list_cache(sender, **kwargs):
    cache.delete(CATEGORY_LIST_KEY)
```

```python
# catalog/apps.py
class CatalogConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "catalog"

    def ready(self):
        import catalog.signals  # noqa: F401
```

Замените `default_app_config` / используйте `CatalogConfig` в `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    ...
    "catalog.apps.CatalogConfig",
]
```

---

## Шаг 4. Проверка

```bash
# cold
curl -s http://localhost:8092/api/v1/categories/ -w "\nTIME:%{time_total}\n"
# warm — обычно быстрее
curl -s http://localhost:8092/api/v1/categories/ -w "\nTIME:%{time_total}\n"

docker exec mock-django-redis redis-cli KEYS '*categories*'

# invalidate — создать category в admin или POST (если есть write endpoint)
docker exec mock-django-redis redis-cli DEL "api:v1:categories:list"
```

---

## Альтернатива: cache_page

Для function views — `@cache_page(300)`. ViewSet list — override или **custom action**; signals всё равно нужны для invalidation.

---

## Типичные проблемы

| Симптом | Причина | Fix |
|---------|---------|-----|
| Stale data после edit | signal не подключён | `ready()` + import signals |
| Cache always miss | разный key per worker | один ключ, JSON serializable |
| Pagination в cache | list без paginate | кэшировать только unpaginated или key + page |

---

## Критерии приёмки

- [ ] Два подряд GET — второй быстрее (orientir) или ключ виден в redis
- [ ] После изменения Category в admin — следующий GET пересчитывает список
- [ ] TTL = 300 сек (проверить `TTL api:v1:categories:list` в redis-cli)

Далее: [35-testing-django](35-testing-django.md).
