# 06. Лаба: Docker runner

## Введение: сценарий с работы

После лабы 04 pipeline всё ещё **pending**. Вы открываете **Settings → CI/CD → Runners** — список пуст или серый **offline**. DevOps: «Зарегистрируй project runner, тег docker, проверь `docker info` из job». Через 20 минут runner green, но job с `image: docker:24-cli` падает: `Cannot connect to the Docker daemon` — не смонтирован socket. Ещё один кейс: перерегистрация с неверным `--url` — runner в UI есть, jobs не забирает.

Лаба закрепляет [05-runners.md](05-runners.md) на стенде [`deploy/gitlab`](../../deploy/gitlab/README.md).

## Что вы сделаете

- Проверите статус runner в UI.
- Добавите job с явным `tags: [docker]` и `docker info`.
- При необходимости **зарегистрируете** runner заново.
- (Превью) job с **services** — sidecar Postgres.

**Время:** ~45–75 минут.

---

## Задание 1. Проверить runner в UI

1. Откройте project `hello-ci` на [http://localhost:8929](http://localhost:8929).
2. **Settings → CI/CD → Runners** → Expand.
3. Секция **Project runners** (или **Assigned project runners**).

Ожидание:

| Поле | Значение |
|------|----------|
| Status | **green** / online |
| Tags | `docker`, `local` (как в README стенда) |
| Executor | docker |

Если **нет runners** — задание 3.

Проверка из хоста:

```bash
docker ps --filter name=mock-gitlab-runner
docker exec mock-gitlab-runner gitlab-runner list
```

---

## Задание 2. Job с tags и Docker CLI

Добавьте в `.gitlab-ci.yml` (stage `test`):

```yaml
docker-info:
  stage: test
  tags:
    - docker
  image: docker:24-cli
  script:
    - docker version
    - docker info
    - uname -a
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

```bash
git checkout -b lab/docker-runner
git add .gitlab-ci.yml
git commit -m "ci(runner): verify docker executor with docker-info job"
git push -u origin lab/docker-runner
```

Создайте MR → дождитесь pipeline.

**Успех:** job `docker-info` **passed**, в логе — Server Version Docker, OS/Arch.

**Pending:** runner offline или нет tag `docker` — задание 3.

**Failed `Cannot connect to Docker daemon`:** на учебном compose socket обычно смонтирован; проверьте `config.toml` runner (volumes `/var/run/docker.sock`).

---

## Задание 3. Регистрация runner

Если runner отсутствует или offline:

1. **Settings → CI/CD → Runners → New project runner**.
2. Tags: `docker`, `local`.
3. Run untagged jobs: по желанию (курс — с tags).
4. Скопируйте **registration token** (одноразовый формат в новых версиях — authentication token).

```bash
docker exec -it mock-gitlab-runner gitlab-runner register \
  --url http://gitlab \
  --token YOUR_PROJECT_RUNNER_TOKEN \
  --executor docker \
  --docker-image alpine:latest \
  --description "course-docker" \
  --tag-list "docker,local" \
  --non-interactive \
  --docker-network-mode host
```

| Параметр | Зачем |
|----------|-------|
| `--url http://gitlab` | имя сервиса в docker network compose |
| `--executor docker` | jobs в контейнерах |
| `--tag-list` | match с `tags:` в YAML |
| `--docker-network-mode host` | доступ к сервисам хоста (Windows/macOS нюансы) |

Обновите страницу Runners — **online**.

Перезапуск pipeline: **CI/CD → Pipelines → Retry**.

### Unregister (если дубликаты)

```bash
docker exec mock-gitlab-runner gitlab-runner unregister --all-runners
```

Затем register снова (осторожно в shared среде).

---

## Задание 4. Services — sidecar (превью)

Integration tests с БД — паттерн для [`gitlab-intermediate`](../gitlab-intermediate/README.md). Добавьте experimental job:

```yaml
integration-preview:
  stage: test
  tags:
    - docker
  image: python:3.12-slim
  services:
    - name: postgres:16-alpine
      alias: db
  variables:
    POSTGRES_DB: test
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    POSTGRES_HOST_AUTH_METHOD: trust
  script:
    - pip install psycopg2-binary
    - python -c "import psycopg2; c=psycopg2.connect(host='db',dbname='test',user='test'); print('ok')"
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  allow_failure: true
```

GitLab поднимает **второй** контейнер в сети job; hostname сервиса — **`db`** (alias).

На слабом RAM job может медленно pull postgres — `allow_failure: true` не ломает MR.

---

## Задание 5 (бонус). Диагностика pending

Создайте job:

```yaml
needs-gpu:
  stage: test
  tags:
    - gpu
  script:
    - echo "never runs on course runner"
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  allow_failure: true
```

Убедитесь: job **pending** бесконечно (нет runner с `gpu`). Удалите job после демонстрации — иначе pipeline «висит» на pending (или отмените job вручную).

**Урок:** typo в tag = очередь без исполнителя.

---

## Критерии успеха

- [ ] Runner **online** в Settings
- [ ] Job `docker-info` **passed**
- [ ] В логе есть вывод `docker info` без ошибки daemon
- [ ] Понимаете разницу pending (no runner) vs failed (script error)

---

## Если что-то пошло не так

| Симптом | Причина | Действие |
|---------|---------|----------|
| Register: 401 | неверный token | новый runner в UI |
| Register: connection refused | неверный url | `http://gitlab` из контейнера runner |
| Runner online, job pending | tag mismatch | `docker` в job и runner |
| `docker: not found` | образ без CLI | `image: docker:24-cli` |
| Postgres service fail | pull timeout / RAM | retry, `allow_failure` |
| Два runner, странный executor | старая регистрация | unregister лишних |

---

## Резюме

Runner — operational-компонент CI. Умение **зарегистрировать**, **проверить tags** и **прочитать docker-info log** — базовый skill on-call.

---

## Чек-лист

- [ ] Где взять registration token?
- [ ] Какой `--url` внутри compose?
- [ ] Зачем `services` и `alias: db`?
- [ ] Что произойдёт с `tags: [gpu]` на курсовом runner?

Следующий урок: [07-variables-secrets.md](07-variables-secrets.md).
