# 13. Migrations: makemigrations, migrate, squash, conflicts

## Introduction

"Works on my machine" — a teammate hits a **migration conflict**, 0172 vs 0172. Django migrations are **version control for your schema**.

## Commands

```bash
python manage.py makemigrations catalog
python manage.py migrate
python manage.py showmigrations catalog
python manage.py sqlmigrate catalog 0001
```

| Command | Action |
|---------|--------|
| makemigrations | diff models → Python migration |
| migrate | apply to DB |
| migrate app zero | unapply all (dev only) |
| squashmigrations | merge history |

---

## Migration file

[`0001_initial.py`](../../deploy/django/stack/web/catalog/migrations/0001_initial.py) — `CreateModel`, indexes.

**Never edit applied migrations in prod** — write a new migration for the fix.

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

Two branches both add `0002_*` — merge with a migration that depends on both.

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

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Edit old migration | new migration |
| Forget commit migration files | team drift |
| RunPython without apps.get_model | historical model |

## Summary

Run makemigrations + migrate in CI. Use data migrations to seed data. Don't rewrite history in prod.

Next: [14-lab-migrations](14-lab-migrations.md).
