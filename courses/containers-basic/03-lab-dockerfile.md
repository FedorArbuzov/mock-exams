# 03. Лаба: Dockerfile, build и слои

## Цель лабы

Собрать образ **API** из [`deploy/containers/stack/api`](../../deploy/containers/stack/api) вручную, изучить **слои** (`history`), запустить контейнер с пробросом порта и сравнить с образом, который строит **compose**.

## Предварительно

- Docker Engine / Docker Desktop.
- Из корня репозитория:

```bash
cd deploy/containers
docker compose down -v 2>/dev/null || true
```

Теория: [02. Образ и Dockerfile](02-images-dockerfile.md).  
Сниппет ignore: [`examples/.dockerignore`](examples/.dockerignore).

---

## Задание 1. Сборка с тегом

**Зачем:** отделить «ручной build» от compose.

```bash
cd deploy/containers
docker build -t lab/api:manual ./stack/api
```

**Что увидите:** шаги `FROM`, `RUN pip`, `COPY` — при повторном build без изменений — **CACHED**.

---

## Задание 2. История слоёв

```bash
docker image history lab/api:manual --no-trunc | head -12
docker image inspect lab/api:manual --format '{{.Id}} {{.Size}}'
```

**Что увидите:** цепочка слоёв; размер образа в байтах.

---

## Задание 3. Запуск без compose (изолированно)

**Зачем:** понять, что контейнеру нужна сеть Redis отдельно (пока без неё — health упадёт).

```bash
docker run --rm -d --name lab-api-solo -p 18080:8080 \
  -e REDIS_HOST=127.0.0.1 lab/api:manual
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:18080/health || true
docker logs lab-api-solo | tail -5
docker stop lab-api-solo
```

**Что увидите:** код ответа не `200` (Redis недоступен) — ожидаемо; в логах ошибка подключения к Redis.

---

## Задание 4. Сборка web (nginx)

```bash
docker build -t lab/web:manual ./stack/web
docker run --rm -d --name lab-web-solo -p 18088:80 lab/web:manual
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:18088/
docker stop lab-web-solo
```

**Что увидите:** `200` — статика отдаётся без api.

---

## Задание 5. Cache invalidation

**Зачем:** увидеть, какой слой пересобирается.

```bash
# добавьте комментарий в stack/api/app.py (любой)
docker build -t lab/api:manual ./stack/api
```

**Что увидите:** пересборка с шага `COPY app.py` (и ниже); `pip install` — **CACHED**.

Откатите комментарий перед коммитом или не коммитьте вовсе.

---

## Задание 6. Сравнение с compose build

```bash
docker compose build api
docker compose images api
```

**Что увидите:** имя вида `containers-api` или `deploy-containers-api` (зависит от имени каталога); другой тег, тот же Dockerfile.

---

## Задание 7. .dockerignore (мысленный эксперимент)

Скопируйте [`examples/.dockerignore`](examples/.dockerignore) в `stack/api/.dockerignore`, добавьте строку `app.py`, соберите снова.

**Что увидите:** build **упадёт** на `COPY app.py` — урок: ignore не должен исключать нужные файлы.

Удалите тестовый `.dockerignore` после проверки.

---

## Критерии успеха

- [ ] `docker build -t lab/api:manual ./stack/api` завершился без ошибок
- [ ] `docker image history` показывает слои
- [ ] Solo api без Redis — ошибка подключения (понимаете зависимость)
- [ ] Solo web отдаёт `200` на `/`
- [ ] Повторный build кэширует `pip install` при смене только `app.py`

## Что унести в работу

- Build context = каталог в конце команды `docker build`
- Тег `name:tag` — единица версионирования для registry
- Compose — обёртка над тем же `docker build`

Следующий урок: [04. Container runtime](04-container-runtime.md).
