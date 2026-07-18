# 12. Лаба: Tag M2M и prefetch

## Цель

Добавить модель **Tag**, M2M на Product, admin inline, prefetch в API queryset.

## Задание 1. models

```python
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)

class Product(models.Model):
    ...
    tags = models.ManyToManyField(Tag, blank=True, related_name="products")
```

## Задание 2. migrate + tags in admin

## Задание 3. ProductViewSet

```python
queryset = Product.objects.select_related("category").prefetch_related("tags").all()
```

## Задание 4. shell

```python
t = Tag.objects.create(name="Sale", slug="sale")
p = Product.objects.first()
p.tags.add(t)
p.tags.all()
```

## Критерии

- M2M works in admin
- API list doesn't N+1 tags (check query count)

Далее: [13-migrations](13-migrations.md).
