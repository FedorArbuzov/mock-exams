# 39. Лаба: prod-like compose rebuild

## Сценарий

«Works on my runserver» — не аргумент. Пересоберём образ как **CI/CD**: migrate on start, gunicorn workers, WhiteNoise static, smoke green.

**Предварительно:** [38-docker-gunicorn](38-docker-gunicorn.md), [`deploy/django`](../../deploy/django/README.md).

---

## Цель

1. `docker compose up --build` с нуля.
2. Logs показывают migrate + gunicorn boot.
3. Admin CSS 200, smoke script pass.

---

## Шаг 1. Clean rebuild

```bash
cd deploy/django
docker compose down -v   # -v только если нужна чистая БД
docker compose build --no-cache web
docker compose up -d
docker compose ps
```

---

## Шаг 2. Logs checklist

```bash
docker compose logs web | tail -40
```

Ожидаем:

```text
Operations to perform:
  Apply all migrations: ...
Running migrations:
  ...
[INFO] Booting worker with pid: ...
```

Entrypoint: [`entrypoint.sh`](../../deploy/django/stack/web/entrypoint.sh) — `migrate` → `exec gunicorn`.

---

## Шаг 3. Health + API

```bash
curl -s http://localhost:8092/health/
curl -s http://localhost:8092/api/v1/products/ | head -c 200
```

---

## Шаг 4. Static / admin

```bash
curl -sI http://localhost:8092/admin/ | head -5
curl -sI http://localhost:8092/static/admin/css/base.css | head -5
```

Если static 404 — `collectstatic` в Dockerfile или entrypoint:

```dockerfile
RUN python manage.py collectstatic --noinput
```

---

## Шаг 5. Smoke scripts

```bash
bash scripts/smoke.sh
# Windows:
powershell -File scripts/smoke.ps1
```

---

## Шаг 6. Env prod profile (опционально)

```yaml
# docker-compose.override.yml (local, не в git secrets)
services:
  web:
    environment:
      DJANGO_DEBUG: "0"
      DJANGO_SECRET_KEY: "change-me-in-real-prod"
```

Проверьте: stack trace скрыт, `ALLOWED_HOSTS` настроен.

---

## Шаг 7. Worker count experiment

```bash
docker exec mock-django-web ps aux | grep gunicorn
```

2 workers в CMD — для 1 CPU достаточно. Больше workers → больше DB connections.

---

## Типичные проблемы

| Симптом | Fix |
|---------|-----|
| migrate permission denied | entrypoint до USER или права на DB |
| 502 сразу после up | postgres not ready — `depends_on` + healthcheck |
| Static 404 | collectstatic + WhiteNoise |

---

## Критерии приёмки

- [ ] `docker compose up -d --build` без ошибок
- [ ] gunicorn workers в logs
- [ ] `/admin/` CSS 200
- [ ] `smoke.sh` exit 0

Далее: [40-nginx-static](40-nginx-static.md).
