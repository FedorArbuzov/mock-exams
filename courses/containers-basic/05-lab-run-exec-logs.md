# 05. Лаба: run, exec, logs, inspect, stop

## Цель лабы

Поднять стенд [`deploy/containers`](../../deploy/containers/README.md), пройти **жизненный цикл** сервиса **api**: логи, exec, inspect, graceful stop; воспроизвести типичную диагностику «api не видит redis».

## Предварительно

```bash
cd deploy/containers
docker compose up -d --build
docker compose ps
bash scripts/smoke.sh
```

Теория: [04. Container runtime](04-container-runtime.md).

---

## Задание 1. Статус и health

```bash
docker compose ps
docker inspect mock-containers-api --format 'status={{.State.Status}} health={{.State.Health.Status}}'
```

**Что увидите:** `running`, `health=healthy` (после нескольких секунд).

---

## Задание 2. Логи api

```bash
docker compose logs --tail 20 api
docker logs -f --tail 5 mock-containers-api
# Ctrl+C
```

**Что увидите:** строки Flask `Running on http://0.0.0.0:8080`.

---

## Задание 3. Exec: Redis из api

**Зачем:** проверить DNS имя `redis` в backend-сети.

```bash
docker exec mock-containers-api python -c "
import redis, os
r = redis.Redis(host=os.environ['REDIS_HOST'], port=6379)
print('PING', r.ping())
print('hits', r.get('hits'))
"
```

**Что увидите:** `PING True`; `hits` — число или `None` до первого запроса снаружи.

---

## Задание 4. Exec: shell и env

```bash
docker exec -it mock-containers-api sh -c 'id; env | grep -E "REDIS|HOSTNAME"'
```

**Что увидите:** UID **10001** (`appuser`); `REDIS_HOST=redis`; hostname `api`.

---

## Задание 5. Inspect сети

```bash
docker inspect mock-containers-api --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
docker inspect mock-containers-redis --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

**Что увидите:** api в **двух** сетях (`frontend`, `backend`); redis — только `backend`.

---

## Задание 6. Stop / start одного сервиса

```bash
docker compose stop api
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8088/api/health
docker compose start api
sleep 15
curl -s http://localhost:8088/api/health
```

**Что увидите:** пока api остановлен — nginx **502** или connection error на `/api/health`; после start — `{"status":"ok"}`.

---

## Задание 7. Recreate

**Зачем:** новый контейнер после смены env (учебно).

```bash
docker compose up -d --force-recreate api
docker compose ps api
```

**Что увидите:** новый **CREATED** time у контейнера api.

---

## Задание 8. Полный сброс (опционально)

```bash
docker compose down
docker compose up -d --build
```

---

## Критерии успеха

- [ ] Health api — `healthy`
- [ ] Из api успешен `PING` к redis
- [ ] `id` показывает non-root UID 10001
- [ ] При `stop api` прокси `/api/health` недоступен
- [ ] Inspect показывает сети frontend/backend

## Что унести в работу

- `compose logs <service>` = быстрый вход при инциденте
- `exec` — проверка сети и env без пересборки образа
- `inspect` — сети и health в JSON

Следующий урок: [06. Сети](06-networking.md).
