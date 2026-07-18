# 13. Лаба: tag, push и pull localhost:5000

## Цель лабы

Поднять **локальный registry**, запушить образ **api**, удалить локальный тег, **pull** заново и запустить контейнер из registry.

## Предварительно

- Docker Desktop: добавьте `"insecure-registries": ["localhost:5000"]` и перезапустите Engine (см. [12-registry](12-registry.md)).
- Стенд собран:

```bash
cd deploy/containers
docker compose up -d --build
```

---

## Задание 1. Поднять registry

```bash
docker compose -f docker-compose.yml -f docker-compose.registry.yml up -d registry
docker ps --filter name=mock-registry
curl -s http://localhost:5000/v2/
```

**Что увидите:** `{}` или пустой JSON — API v2 отвечает.

---

## Задание 2. Собрать и tag

```bash
docker build -t lab/api:registry ./stack/api
docker tag lab/api:registry localhost:5000/course/api:registry
docker images | grep course/api
```

**Что увидите:** два тега на одном IMAGE ID.

---

## Задание 3. Push

```bash
docker push localhost:5000/course/api:registry
curl -s http://localhost:5000/v2/_catalog
curl -s http://localhost:5000/v2/course/api/tags/list
```

**Что увидите:** репозиторий `course/api`, тег `registry`.

При **denied** / HTTPS error — проверьте insecure-registries.

---

## Задание 4. Pull после удаления локального образа

```bash
docker rmi localhost:5000/course/api:registry lab/api:registry
docker pull localhost:5000/course/api:registry
```

**Что увидите:** слои скачиваются с localhost:5000.

---

## Задание 5. Запуск из registry (в сети стенда)

```bash
NET=$(docker inspect mock-containers-api --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{break}}{{end}}')
docker run --rm -d --name lab-api-reg \
  --network "$NET" \
  -e REDIS_HOST=redis \
  localhost:5000/course/api:registry
sleep 3
docker exec lab-api-reg python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8080/health').read())"
docker stop lab-api-reg
```

**Что увидите:** `{"status":"ok",...}` — образ из registry работает в backend-сети.

---

## Задание 6. Compose с image вместо build (опционально)

Файл `docker-compose.from-registry.yml`:

```yaml
services:
  api:
    image: localhost:5000/course/api:registry
    build: !reset null
```

```bash
docker compose -f docker-compose.yml -f docker-compose.from-registry.yml up -d api
curl -s http://localhost:8088/api/health
```

Откат: `docker compose up -d --build api` без overlay.

---

## Задание 7. Очистка registry volume (опционально)

```bash
docker compose -f docker-compose.yml -f docker-compose.registry.yml down
docker volume ls | grep registry
```

---

## Критерии успеха

- [ ] Registry отвечает на `/v2/`
- [ ] `docker push localhost:5000/course/api:registry` успешен
- [ ] `_catalog` и `tags/list` показывают репозиторий
- [ ] После `pull` контейнер проходит health к redis
- [ ] Понимаете связь с GitLab `CI_REGISTRY_IMAGE`

## Что унести в работу

- Полное имя образа = registry + repo + tag
- CI: build → tag → push → deploy pull
- Insecure — **только** localhost в лабе

Следующий урок: [14. Безопасность](14-security.md).
