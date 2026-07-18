# Контейнеры — Basic (Docker)

Базовый уровень для **DevOps**: **образ и Dockerfile**, **runtime** (`run`, `exec`, `logs`, `inspect`), **сети** (bridge, publish, compose networks), **тома**, **multi-service Compose**, **registry** (tag/push/pull), **безопасность образа**, мост к **Kubernetes**.

**Предварительно:** терминал и основы Linux ([`linux-basic`](../linux-basic/README.md) — главы [00-docker-lab](../linux-basic/00-docker-lab-environment.md), [02-shell](../linux-basic/02-shell-redirection.md)). Полезно знать HTTP/nginx на уровне [`linux-intermediate/08-nginx`](../linux-intermediate/08-nginx.md).

**Локально:** [`deploy/containers`](../../deploy/containers/README.md) — `docker compose up -d --build`:

| Сервис | URL / порт |
|--------|------------|
| Web (nginx) | [http://localhost:8088](http://localhost:8088) |
| API через прокси | [http://localhost:8088/api/health](http://localhost:8088/api/health), `/api/hits` |
| Redis | только внутри сети `backend` (не на хосте) |
| Registry (опционально) | `localhost:5000` — overlay `docker-compose.registry.yml` |

Контейнеры: `mock-containers-web`, `mock-containers-api`, `mock-containers-redis`. Smoke: `bash scripts/smoke.sh` в `deploy/containers`.

**Дальше:** [`kuber-basic`](../kuber-basic/README.md) — Pod, Deployment, образы в кластере; теория runtime: [02-docker-vs-containerd](../kuber-basic/02-docker-vs-containerd.md). CI и registry в GitLab: [gitlab-intermediate/03-docker-registry](../gitlab-intermediate/03-docker-registry.md).

## Как читать главы

Каждый урок — **глава книги**, не шпаргалка. Рекомендуемый порядок внутри пары:

1. Прочитайте **теорию** (01, 02, 04…) — не пропускайте «типичные ошибки».
2. Откройте **лабу** (03, 05…) с поднятым стендом в `deploy/containers`.
3. Выполняйте задания **по номерам**; сверяйте вывод с блоком «что увидите».
4. Если порт занят или 502 на `/api/*` — [`deploy/containers/README.md`](../../deploy/containers/README.md).

**Структура теории:** введение (сценарий с работы) → что узнаете → концепции → пример на стенде → ошибки → в проде → резюме → чек-лист.

**Структура лабы:** цель → предварительно → задания 1…N (зачем / команды / что увидите) → критерии успеха.

**Время:** около **45–55 минут** на пару «теория + лаба»; [финальный проект](17-final-project.md) — **2–3 часа**. Весь курс — **~8–10 часов**.

**Шпаргалка стенда:**

| Откуда | Адрес / имя |
|--------|-------------|
| С хоста | [localhost:8088](http://localhost:8088) |
| API внутри compose | `http://api:8080` (hostname `api`) |
| Redis внутри compose | `redis:6379` |
| Registry (лабы 12–13) | `localhost:5000` |

## Программа

### Основы и образ (01–03)

1. [Зачем контейнеры: VM, изоляция, путь к Kubernetes](01-why-containers.md)
2. [Образ и Dockerfile: слои, COPY, CMD](02-images-dockerfile.md) · 3. [Лаба: Dockerfile и build](03-lab-dockerfile.md)

### Runtime (04–05)

4. [Container runtime: run, exec, logs, inspect](04-container-runtime.md) · 5. [Лаба: run, exec, logs](05-lab-run-exec-logs.md)

### Сеть (06–07)

6. [Сети Docker: bridge, publish, compose networks](06-networking.md) · 7. [Лаба: сети frontend/backend](07-lab-networks.md)

### Данные (08–09)

8. [Тома: bind mount и named volume](08-volumes.md) · 9. [Лаба: данные в Redis](09-lab-volumes.md)

### Compose (10–11)

10. [Multi-service Compose: трёхуровневый стек](10-compose-multi-service.md) · 11. [Лаба: стек deploy/containers](11-lab-compose-stack.md)

### Registry (12–13)

12. [Registry: tag, push, pull](12-registry.md) · 13. [Лаба: localhost:5000](13-lab-registry.md)

### Безопасность (14–15)

14. [Безопасность образа: USER, read-only, секреты, scan](14-security.md) · 15. [Лаба: hardening](15-lab-security.md)

### Kubernetes и финал (16–17)

16. [Docker vs Kubernetes: граница ответственности](16-docker-vs-kubernetes.md)
17. [Финальный проект: 3-tier + registry + чек-лист](17-final-project.md)

## Что должно получиться

- Объясняете, **зачем контейнер** вместо VM и **что остаётся за Kubernetes**.
- Пишете **Dockerfile** со слоями, `.dockerignore`, **multistage** (пример в [`examples/`](examples/)).
- Управляете контейнером: **run / stop / logs / exec / inspect**.
- Настраиваете **сети** compose (`frontend` / `backend`), **publish** только нужных портов.
- Используете **volumes** для данных Redis.
- Собираете **multi-service** стек с healthcheck и `depends_on`.
- Делаете **tag → push → pull** в локальный registry.
- Применяете **non-root**, не кладёте секреты в образ, знаете обзор **scan**.
- Связываете Docker на ноутбуке с **containerd** в кластере ([kuber-basic/02](../kuber-basic/02-docker-vs-containerd.md)).

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/Dockerfile.multistage`](examples/Dockerfile.multistage) | multistage build (builder + runtime) |
| [`examples/compose-snippet.yml`](examples/compose-snippet.yml) | фрагмент сетей и depends_on |
| [`examples/.dockerignore`](examples/.dockerignore) | что не попадать в build context |
