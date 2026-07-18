# 13. Migrations: makemigrations, migrate, squash, conflicts

## Введение

«Works on my machine» — у коллеги **migration conflict** 0172 vs 0172. Django migrations — **version control для schema**.

## Команды

```bash
python manage.py makemigrations catalog
python manage.py migrate
python manage.py showmigrations catalog
python manage.py sqlmigrate catalog 0001
```

| Команда | Действие |
|---------|----------|
| makemigrations | diff models → Python migration |
| migrate | apply to DB |
| migrate app zero | unapply all (dev only) |
| squashmigrations | merge history |

---

## Файл migration

[`0001_initial.py`](../../deploy/django/stack/web/catalog/migrations/0001_initial.py) — `CreateModel`, indexes.

**Never edit applied migrations in prod** — новая migration для fix.

---

## Data migrations

```python
from django.db import migrations

def seed_categories(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    Category.objects.create(name="Default", slug="default")

class Migration(migrations.Migration):
    dependencies = [("catalog", "0001_initial")]
    operations = [
        migrations.RunPython(seed_categories, migrations.RunPython.noop),
    ]
```

---

## Conflicts

Two branches add `0002_*` — merge migration with dependencies on both.

---

## Zero downtime (preview)

Expand-contract pattern — [`postgresql-developer`](../postgresql-developer/README.md).

---

## CI

```yaml
script:
  - python manage.py migrate --plan
  - python manage.py migrate --noinput
```

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| Edit old migration | new migration |
| Forget commit migration files | team drift |
| RunPython without apps.get_model | historical model |

## Резюме

makemigrations + migrate in CI. Data migrations for seed. Don't rewrite history in prod.

Далее: [14-lab-migrations](14-lab-migrations.md).
