# Docker / контейнеры для курса containers-basic

Трёхуровневый стек: **web (nginx)** → **api (Flask)** → **redis**. Опционально — локальный **registry**.

Курс: [containers-basic](../../courses/containers-basic/README.md).

## Запуск

```bash
cd deploy/containers
docker compose up -d --build
```

| Сервис | URL |
|--------|-----|
| Web (через nginx) | [http://localhost:8088](http://localhost:8088) |
| API health | [http://localhost:8088/api/health](http://localhost:8088/api/health) |
| API hits (redis counter) | [http://localhost:8088/api/hits](http://localhost:8088/api/hits) |

Сети: `frontend` (web↔api), `backend` (api↔redis). Redis **не** опубликован на хост — только внутри compose.

## Smoke

```bash
bash scripts/smoke.sh
# .\scripts\smoke.ps1
```

## Локальный registry (главы registry)

```bash
docker compose -f docker-compose.yml -f docker-compose.registry.yml up -d
# push: docker tag ... localhost:5000/myapp:lab && docker push localhost:5000/myapp:lab
```

На Docker Desktop иногда нужно: **Settings → Docker Engine** — `"insecure-registries": ["localhost:5000"]` (только для лаб).

## Полезные команды

```bash
docker compose ps
docker compose logs -f api
docker exec -it mock-containers-api sh
docker inspect mock-containers-api --format '{{json .NetworkSettings.Networks}}'
docker volume ls
```

## Сброс

```bash
docker compose down -v --rmi local
```

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| `8088` занят | смените порт в `docker-compose.yml` |
| web 502 на `/api/*` | `docker compose logs api`, дождитесь healthcheck |
| push в registry denied | insecure-registries для `localhost:5000` |
| build медленный | повторный build использует cache слоёв |

## Дальше

[kuber-basic](../../courses/kuber-basic/README.md) — Pod, Deployment, образы в Kubernetes.
