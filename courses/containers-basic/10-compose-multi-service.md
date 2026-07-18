# 10. Multi-service Compose: трёхуровневый стек

## Введение: один YAML вместо трёх run

Вместо скрипта «сначала redis, потом api, потом nginx» команда хранит **`docker-compose.yml`**: зависимости, сети, healthcheck, единая команда `up`. Это **инфраструктура как код** для локальной среды и CI smoke. Эта глава разбирает стек [`deploy/containers`](../../deploy/containers/README.md): **web → api → redis**.

## Что вы узнаете

- Структура **compose file** (services, networks, volumes).
- **`depends_on`** и **healthcheck**.
- **build** vs **image**.
- Соглашения имён и smoke-тест.

## Архитектура стенда

```text
Browser → localhost:8088 → web (nginx)
                              ↓ /api/*
                            api (Flask :8080)
                              ↓
                            redis (:6379, internal)
```

| Сервис | Образ | Роль |
|--------|-------|------|
| web | build `stack/web` | статика + reverse proxy |
| api | build `stack/api` | REST, счётчик в redis |
| redis | `redis:7.2-alpine` | хранилище hits |

Полный файл: [`docker-compose.yml`](../../deploy/containers/docker-compose.yml). Сниппет: [`examples/compose-snippet.yml`](examples/compose-snippet.yml).

## Ключевые блоки compose

### build

```yaml
api:
  build: ./stack/api
```

Compose вызывает `docker build` с context `./stack/api`. Кэш слоёв общий с ручным build из [лабы 03](03-lab-dockerfile.md).

### environment

```yaml
environment:
  REDIS_HOST: redis
```

Имя **`redis`** — service name в DNS. Не хардкодить IP.

### depends_on + healthcheck

```yaml
api:
  depends_on:
    - redis
  healthcheck:
    test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health')"]
    interval: 10s
    retries: 6

web:
  depends_on:
    api:
      condition: service_healthy
```

| Механизм | Эффект |
|----------|--------|
| `depends_on: redis` | порядок **старта**, не готовности redis |
| `healthcheck` api | compose знает **healthy** |
| `condition: service_healthy` | web стартует после **успешного** health api |

Без healthcheck web может отдать **502**, пока Flask ещё не слушает порт.

### container_name

```yaml
container_name: mock-containers-api
```

Стабильные имена для `docker exec` и документации курса.

## Команды compose (ежедневные)

```bash
docker compose up -d --build    # собрать и поднять
docker compose ps
docker compose logs -f api
docker compose restart api
docker compose down             # stop + remove containers
docker compose down -v --rmi local   # + volumes + local images
```

## Smoke test

[`scripts/smoke.sh`](../../deploy/containers/scripts/smoke.sh) — автоматическая проверка health и hits. В CI/GitLab аналог — job после deploy ([`gitlab-basic`](../gitlab-basic/04-lab-first-pipeline.md)).

```bash
cd deploy/containers && bash scripts/smoke.sh
```

## Проект compose

Имя проекта по умолчанию = **имя каталога** (`containers` → сети `containers_frontend`). Переопределение:

```bash
docker compose -p mockexam up -d
```

Влияет на имена сетей и контейнеров — важно в документации команд.

## Типичные ошибки

| Ошибка | Симптом | Исправление |
|--------|---------|-------------|
| Забыть `--build` после правки Dockerfile | старый код | `up --build` |
| `depends_on` без health | race 502 | healthcheck + condition |
| Дублировать `ports` на api и web | лишняя поверхность | только web:8088 |
| Хранить секреты в `environment:` в git | утечка | `.env` в `.gitignore` |
| Один огромный compose на 50 сервисов | медленно | profiles / несколько файлов |

## В продакшене

- Compose — **dev/stage smoke**, не замена K8s/ECS.
- **Helm / Kustomize** — compose-подобная декларация для кластера.
- Override файлы: `docker-compose.override.yml` (локально, не в git).
- CI: `compose up` + smoke + `compose down -v`.

## Заметки для собеседования

- Compose v2 — плагин `docker compose`, не отдельный `docker-compose` binary (legacy).
- `docker compose config` — валидация и merge файлов.
- **Profiles** — включать registry только для лаб ([registry overlay](../../deploy/containers/docker-compose.registry.yml)).

## Резюме

Multi-service compose описывает **весь стек**: сборка, сети, зависимости, health. Стенд курса — эталон **3-tier** перед переносом в Kubernetes. Следующая лаба — пройти стек end-to-end и задокументировать порядок запуска.

## Чек-лист

- Какие три сервиса в стенде?
- Зачем web ждёт `service_healthy` api?
- Какая переменная связывает api с redis?
- Как запустить smoke?

Следующий урок: [11. Лаба: compose stack](11-lab-compose-stack.md).
