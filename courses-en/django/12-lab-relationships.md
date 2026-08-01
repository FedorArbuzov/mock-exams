# 12. Lab: Tag M2M and prefetch

## Goal

Add a **Tag** model, an M2M relation to Product, an admin inline, and prefetch in the API queryset.

## Task 1. Models

```python
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)

class Product(models.Model):
    ...
    tags = models.ManyToManyField(Tag, blank=True, related_name="products")
```

## Task 2. Migrate + tags in admin

## Task 3. ProductViewSet

```python
queryset = Product.objects.select_related("category").prefetch_related("tags").all()
```

## Task 4. Shell

```python
t = Tag.objects.create(name="Sale", slug="sale")
p = Product.objects.first()
p.tags.add(t)
p.tags.all()
```

## Acceptance criteria

- M2M works in admin
- API list doesn't N+1 on tags (check the query count)

Next: [13-migrations](13-migrations.md).
