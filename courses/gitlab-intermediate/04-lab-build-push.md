# 04. Лаба: build и push image

## Сценарий с работы

«Сборка образа в CI» — базовый skill DevOps. Артефакт pipeline — не jar на диске runner, а **immutable image** в GitLab Container Registry, который подхватывает Kubernetes. Без push в registry deploy job не из чего развернуть Pod. В этой лабе вы заменяете `build-stub` из [02-lab-multi-stage.md](02-lab-multi-stage.md) на реальный **docker build + push** для [`examples/k8s-deploy/`](examples/k8s-deploy/).

**Предусловия:** [03-docker-registry.md](03-docker-registry.md), runner privileged (dind), Dockerfile и `app/` в репозитории, GitLab на [`deploy/gitlab`](../../deploy/gitlab/README.md).

## Что вы сделаете

- Подготовите Dockerfile и статику в `app/`.
- Добавите job `docker-build` с Docker-in-Docker.
- Убедитесь, что образ появился в Registry с тегом SHA.
- Свяжете build с `needs: [unit]` — fail fast.

---

## Задание 1. Структура проекта

```text
hello-ci/
├── .gitlab-ci.yml
├── Dockerfile
├── .dockerignore
├── app/
│   └── index.html
└── tests/              # опционально, из gitlab-basic
    └── test_app.py
```

`app/index.html`:

```html
<!DOCTYPE html>
<html>
<head><title>hello-ci</title></head>
<body><h1>GitLab intermediate lab 04</h1></body>
</html>
```

`Dockerfile` (из [`examples/k8s-deploy/Dockerfile`](examples/k8s-deploy/Dockerfile)):

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY app/ ./app/
ENV PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["python", "-m", "http.server", "8080", "--directory", "app"]
```

`.dockerignore`:

```text
.git
.gitlab-ci.yml
tests/
*.md
k8s/
```

`.dockerignore` уменьшает build context — без него в образ попадает `.git` и лишние файлы; build медленнее, образ толще.

---

## Задание 2. Privileged runner (если ещё не сделано)

В контейнере `mock-gitlab-runner`:

```toml
# /etc/gitlab-runner/config.toml
[[runners]]
  [runners.docker]
    privileged = true
```

```bash
docker restart mock-gitlab-runner
```

Без `privileged` dind часто падает с `Cannot connect to the Docker daemon`. Подробности: [03-docker-registry.md](03-docker-registry.md).

---

## Задание 3. Job docker-build

Добавьте в `.gitlab-ci.yml` (сохраните stages и workflow из лабы 02):

```yaml
docker-build:
  stage: build
  needs: [unit]
  image: docker:24-cli
  services:
    - name: docker:24-dind
      alias: docker
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
    DOCKER_HOST: tcp://docker:2376
    DOCKER_TLS_VERIFY: "1"
    DOCKER_CERT_PATH: "$DOCKER_TLS_CERTDIR/client"
  tags: [docker]
  before_script:
    - docker info
    - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
  script:
    - docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - echo "Pushed $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

Удалите `build-stub` (`when: never` или удаление), чтобы не дублировать stage build.

**Ожидаемый результат:** job **passed**, в логе — `Pushed localhost:8929/...`.

| Строка | Зачем |
|--------|-------|
| `services: docker:dind` | sidecar с Docker daemon |
| `DOCKER_TLS_CERTDIR` | TLS между cli и dind |
| `docker login` с `CI_REGISTRY_*` | push без root password |
| тег `$CI_COMMIT_SHA` | immutable для deploy |

---

## Задание 4. Проверка в UI и локально

1. **Deploy → Container Registry** — образ с тегом = полный SHA коммита.
2. На хосте:

```bash
docker login localhost:8929 -u root -p 'YOUR_ROOT_PASSWORD'
docker pull localhost:8929/root/hello-ci:YOUR_COMMIT_SHA
docker run --rm -p 8080:8080 localhost:8929/root/hello-ci:YOUR_COMMIT_SHA
curl -s localhost:8080 | head
```

3. Pipeline graph — `unit` → `docker-build`. Сломайте тест намеренно — build **не должен** стартовать.

---

## Задание 5. (Бонус) Теги ветки и latest

Добавьте push `$CI_COMMIT_REF_SLUG` для не-main; для `main` — опционально `latest` ([03-docker-registry.md](03-docker-registry.md)):

```yaml
    - docker tag "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" "$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG"
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG"
```

Задокументируйте правило тегов в README проекта: **deploy только по SHA**.

---

## Что пошло не так

### `error during connect: Post "http://docker:2376/...`

**Причина:** dind не готов или TLS vars неверны; runner не privileged.

**Решение:** `privileged = true`; `sleep 5` в `before_script` (временно); сверить `DOCKER_*` с [03-docker-registry.md](03-docker-registry.md).

### `COPY failed: file not found`

**Причина:** нет `app/` в репозитории.

**Решение:** `git add app/`; context = корень с Dockerfile.

### Push 401 Unauthorized

**Причина:** login не выполнен; registry отключён.

**Решение:** Settings → General → Container Registry enabled; проверить `before_script`.

### Образ есть, pull с хоста не работает

**Причина:** неверный путь group/name.

**Решение:** pull command из UI Registry (кнопка copy).

### Build при failed unit

**Причина:** нет `needs: [unit]`.

**Решение:** добавить `needs` — иначе нарушен fail fast.

### Образ 500+ MB

**Причина:** нет `.dockerignore`; тянется весь репозиторий.

**Решение:** `.dockerignore` из задания 1; `python:3.12-slim` уже разумный base.

---

## Резюме

- Реальный docker build + push заменяет stub; образ в registry — вход для deploy.
- Fail fast через `needs: [unit]`; тег SHA — контракт с Kubernetes.

---

## Критерии успеха

- [ ] Образ в Container Registry с тегом **commit SHA**
- [ ] `docker-build` только после успешного `unit`
- [ ] Локальный `docker pull` и `curl` работают
- [ ] `.dockerignore` исключает `.git` и tests
- [ ] README описывает теги образа

---

## Связи

| Дальше | Содержание |
|--------|------------|
| [05-deploy-kubernetes.md](05-deploy-kubernetes.md) | как k8s использует образ |
| [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md) | deploy в кластер через [`mockctl`](../../mockctl/README.md) |
| [09-ci-templates.md](09-ci-templates.md) | вынести job в template |

Следующий урок: [05-deploy-kubernetes.md](05-deploy-kubernetes.md).
