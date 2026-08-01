# 39. Lab: prod-like compose rebuild

## Scenario

"Works on my runserver" isn't an argument. Let's rebuild the image the way **CI/CD** would: migrate on start, gunicorn workers, WhiteNoise static, green smoke test.

**Prerequisites:** [38-docker-gunicorn](38-docker-gunicorn.md), [`deploy/django`](../../deploy/django/README.md).

---

## Goal

1. `docker compose up --build` from scratch.
2. Logs show migrate + gunicorn boot.
3. Admin CSS returns 200, smoke script passes.

---

## Step 1. Clean rebuild

```bash
cd deploy/django
docker compose down -v   # -v only if you need a clean DB
docker compose build --no-cache web
docker compose up -d
docker compose ps
```

---

## Step 2. Logs checklist

```bash
docker compose logs web | tail -40
```

Expected:

```text
Operations to perform:
  Apply all migrations: ...
Running migrations:
  ...
[INFO] Booting worker with pid: ...
```

Entrypoint: [`entrypoint.sh`](../../deploy/django/stack/web/entrypoint.sh) — `migrate` then `exec gunicorn`.

---

## Step 3. Health + API

```bash
curl -s http://localhost:8092/health/
curl -s http://localhost:8092/api/v1/products/ | head -c 200
```

---

## Step 4. Static / admin

```bash
curl -sI http://localhost:8092/admin/ | head -5
curl -sI http://localhost:8092/static/admin/css/base.css | head -5
```

If static returns 404, add `collectstatic` to the Dockerfile or entrypoint:

```dockerfile
RUN python manage.py collectstatic --noinput
```

---

## Step 5. Smoke scripts

```bash
bash scripts/smoke.sh
# Windows:
powershell -File scripts/smoke.ps1
```

---

## Step 6. Prod env profile (optional)

```yaml
# docker-compose.override.yml (local, not committed as a git secret)
services:
  web:
    environment:
      DJANGO_DEBUG: "0"
      DJANGO_SECRET_KEY: "change-me-in-real-prod"
```

Check that stack traces are hidden and `ALLOWED_HOSTS` is configured.

---

## Step 7. Worker count experiment

```bash
docker exec mock-django-web ps aux | grep gunicorn
```

2 workers in the CMD is plenty for 1 CPU. More workers means more DB connections.

---

## Common problems

| Symptom | Fix |
|---------|-----|
| migrate permission denied | entrypoint runs before USER switch, or missing DB permissions |
| 502 right after up | postgres not ready yet — add `depends_on` + healthcheck |
| Static 404 | collectstatic + WhiteNoise |

---

## Acceptance criteria

- [ ] `docker compose up -d --build` completes without errors
- [ ] gunicorn workers show up in logs
- [ ] `/admin/` CSS returns 200
- [ ] `smoke.sh` exits 0

Next: [40-nginx-static](40-nginx-static.md).
