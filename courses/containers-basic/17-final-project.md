# 17. Финальный проект: 3-tier stack + registry + hardening

## Введение: «образ собрали, в K8s не стартует»

Типичный провал перед [`kuber-basic`](../kuber-basic/README.md): в кластер уезжает образ, который **не собирался** на CI, слушает **не тот порт**, Redis **опубликован наружу**, секреты **зашиты в слой**. Финал собирает весь **containers-basic** в один контур на [`deploy/containers`](../../deploy/containers/README.md): Dockerfile → compose (web/api/redis) → локальный registry → минимальный hardening → чек-лист перед Kubernetes.

## Что вы узнаете (итог курса)

- Собрать и задокументировать **3-tier** стек с сетями `frontend` / `backend`.
- Прогнать **tag → push → pull** в `localhost:5000`.
- Применить **non-root**, `.dockerignore`, обзор **scan**.
- Оформить **PROJECT.md** для ревью и handoff в K8s.

## Требования

| # | Требование | Критерий |
|---|------------|----------|
| 1 | Стенд | `docker compose up -d --build`, `smoke.sh` OK |
| 2 | API образ | свой tag `course/api:final`, multistage или non-root (как в лабе 15) |
| 3 | Compose | web + api + redis; Redis **не** на хосте; web **8088** |
| 4 | Registry | overlay registry; `docker push localhost:5000/course/api:final` |
| 5 | Pull-проверка | удалить локальный образ, `pull`, `compose up` с image из registry |
| 6 | Hardening | `USER` non-root, нет секретов в Dockerfile, read-only root где возможно |
| 7 | Документ | `PROJECT.md` по шаблону ниже |
| 8 | Мост в K8s | таблица: что из compose станет Deployment/Service/Secret |

---

## Фаза 1. Базовый стек

```bash
cd deploy/containers
docker compose down -v --rmi local 2>/dev/null || true
docker compose up -d --build
bash scripts/smoke.sh
```

Проверьте вручную:

```bash
curl -s http://localhost:8088/api/health
curl -s http://localhost:8088/api/hits
docker compose exec redis redis-cli ping
```

**Ожидание:** `ok`, JSON с `hits`, `PONG`.

---

## Фаза 2. Доработка API (ваш Dockerfile)

Скопируйте `deploy/containers/stack/api` в рабочую папку или правьте in-place:

1. Убедитесь в **`.dockerignore`** (см. [`examples/.dockerignore`](examples/.dockerignore)).
2. Оставьте **`USER appuser`** (или добавьте).
3. Соберите с тегом финала:

```bash
docker build -t course/api:final ./stack/api
```

Опционально — multistage по [`examples/Dockerfile.multistage`](examples/Dockerfile.multistage).

В `docker-compose.yml` временно для api:

```yaml
# image: course/api:final
# build: ./stack/api   # закомментировать build при проверке pull
```

---

## Фаза 3. Registry

```bash
docker compose -f docker-compose.yml -f docker-compose.registry.yml up -d
```

На Docker Desktop при необходимости: **insecure-registries** → `localhost:5000`.

```bash
docker tag course/api:final localhost:5000/course/api:final
docker push localhost:5000/course/api:final
docker rmi course/api:final
docker pull localhost:5000/course/api:final
```

В compose для api укажите:

```yaml
image: localhost:5000/course/api:final
```

Пересоздайте только api:

```bash
docker compose up -d --force-recreate api
bash scripts/smoke.sh
```

---

## Фаза 4. Hardening и scan (обзор)

```bash
docker scout quickview course/api:final 2>/dev/null || true
docker scout quickview localhost:5000/course/api:final 2>/dev/null || true
```

Если `scout` нет — `docker scan` или пропустите с пометкой в PROJECT.md.

Чек-лист hardening:

- [ ] Нет `ENV PASSWORD=...` / секретов в слоях (`docker history` — осторожно, не логировать секреты).
- [ ] API не запускается от root (`docker compose exec api id`).
- [ ] Только **web:8088** опубликован на хост.

---

## Фаза 5. Документ PROJECT.md

Создайте `PROJECT.md` в корне своей копии проекта (или в `courses/containers-basic/` для сдачи):

```markdown
# Containers final — <ваше имя>

## Архитектура
- Диаграмма или список: web (nginx) → api (Flask) → redis
- Сети: frontend, backend — кто с кем говорит

## Образы
| Образ | Tag | Registry | Non-root |
|-------|-----|----------|----------|

## Compose
- Порты на хосте
- Volumes (если добавляли для Redis)
- Healthcheck / depends_on

## Команды воспроизведения
1. compose up
2. smoke
3. push/pull registry

## Мост в Kubernetes
| Compose | K8s объект |
|---------|------------|
| service api | Deployment + Service |
| service web | Deployment + Service + Ingress |
| redis | StatefulSet или managed Redis вне кластера |

## Риски / долг
- Что бы сделали в prod (secrets, limits, read-only FS)
```

---

## Критерии успеха

- [ ] `smoke.sh` зелёный после pull из registry.
- [ ] Redis недоступен с хоста (`nc -zv localhost 6379` — connection refused).
- [ ] PROJECT.md заполнен, таблица K8s осмысленна.
- [ ] Можете объяснить разницу **image** vs **container** vs **Pod** ([16-docker-vs-kubernetes](16-docker-vs-kubernetes.md)).

## Что унести в работу

- Перед первым `kubectl apply` — **локально** прогнать тот же образ через compose.
- В MR на Dockerfile — `.dockerignore`, non-root, scan в CI ([gitlab-intermediate](../gitlab-intermediate/03-docker-registry.md)).
- В K8s — не дублировать compose-сети; использовать Service DNS ([kuber-basic/10-services](../kuber-basic/10-services.md) — когда дойдёте).

## Чек-лист курса

- [ ] Dockerfile, слои, CMD/ENTRYPOINT
- [ ] run, exec, logs, inspect
- [ ] bridge, publish, compose networks
- [ ] volumes для state
- [ ] multi-service + healthcheck
- [ ] registry push/pull
- [ ] security basics
- [ ] граница Docker vs Kubernetes

**Дальше:** [kuber-basic](../kuber-basic/README.md) — Pod и Deployment того же приложения.
