# 09. Лаба: named volume и данные Redis

## Цель лабы

Убедиться, что **без volume** счётчик `hits` сбрасывается при recreate redis; добавить **named volume** в overlay compose и сохранить данные.

## Предварительно

```bash
cd deploy/containers
docker compose up -d --build
```

Теория: [08. Тома](08-volumes.md).

---

## Задание 1. Baseline hits

```bash
curl -s http://localhost:8088/api/hits
curl -s http://localhost:8088/api/hits
docker exec mock-containers-redis redis-cli GET hits
```

**Что увидите:** `hits` ≥ 2 в JSON и в redis.

---

## Задание 2. Recreate без volume — потеря данных

```bash
docker compose up -d --force-recreate redis
sleep 3
docker exec mock-containers-redis redis-cli GET hits
curl -s http://localhost:8088/api/hits
```

**Что увидите:** в redis `nil` или малое число; следующий curl снова даёт **1** — данные не пережили recreate (если образ не писал RDB на volume).

---

## Задание 3. Overlay с volume

Создайте файл `docker-compose.volume-lab.yml` рядом с основным compose:

```yaml
services:
  redis:
    volumes:
      - redis-lab-data:/data

volumes:
  redis-lab-data:
```

Поднимите:

```bash
curl -s http://localhost:8088/api/hits
curl -s http://localhost:8088/api/hits
docker compose -f docker-compose.yml -f docker-compose.volume-lab.yml up -d
docker exec mock-containers-redis redis-cli GET hits
```

**Что увидите:** счётчик продолжает с нового тома (может отличаться от шага 2).

---

## Задание 4. Персистентность после down/up

```bash
HITS=$(curl -s http://localhost:8088/api/hits | grep -o '[0-9]*')
echo "before down: $HITS"
docker compose -f docker-compose.yml -f docker-compose.volume-lab.yml stop redis
docker compose -f docker-compose.yml -f docker-compose.volume-lab.yml start redis
sleep 2
docker exec mock-containers-redis redis-cli GET hits
```

**Что увидите:** значение **hits** в redis ≥ предыдущего (данные на volume).

---

## Задание 5. inspect volume

```bash
docker volume ls | grep redis-lab
docker volume inspect deploy-containers_redis-lab-data --format '{{.Mountpoint}}'
```

**Что увидите:** путь на хосте (Linux) или имя тома (Desktop).

---

## Задание 6. Bind mount конфига (read-only)

**Зачем:** правка nginx без пересборки образа.

```bash
docker run --rm -v "$(pwd)/stack/web/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  nginx:1.27-alpine nginx -t
```

**Что увидите:** `syntax is ok` — конфиг валиден с хоста.

---

## Задание 7. Очистка (опционально)

```bash
docker compose -f docker-compose.yml -f docker-compose.volume-lab.yml down -v
rm -f docker-compose.volume-lab.yml
```

---

## Критерии успеха

- [ ] Понимаете разницу до/после volume на redis
- [ ] Overlay compose с `redis-lab-data` применён
- [ ] После stop/start redis ключ `hits` сохраняется
- [ ] `docker volume inspect` показывает том
- [ ] Проверен `:ro` bind для nginx.conf

## Что унести в работу

- Stateful сервис = **volume** в compose
- `down -v` удаляет данные — осторожно в CI/prod
- Bind для **конфигов**, named для **данных**

Следующий урок: [10. Multi-service Compose](10-compose-multi-service.md).
