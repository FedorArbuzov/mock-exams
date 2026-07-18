# 03. Docker build и Container Registry

## Сценарий с работы

Пятница, релиз. DevOps: «образ в registry по тегу `latest`». Вы деплоите — в production **вчерашний** код: кто-то перезаписал `latest` с другой ветки. Второй кейс: CI падает на `Cannot connect to the Docker daemon` — runner без privileged, dind не поднялся. Третий: security спрашивает «почему socket `/var/run/docker.sock`?» — trade-off **Docker-in-Docker** vs **Kaniko**.

Урок связывает job `build` из [01-multi-stage.md](01-multi-stage.md) с **GitLab Container Registry** — встроенным registry на [`deploy/gitlab`](../../deploy/gitlab/README.md) (порт 8929).

## Что вы узнаете

- Переменные `CI_REGISTRY*` и аутентификацию через job token.
- Паттерн **docker login → build → tag → push**.
- **Docker-in-Docker** (`services: docker:dind`) на учебном runner.
- Альтернативу **Kaniko** (без privileged).
- Стратегию **тегов образа** (SHA vs branch vs latest).

---

## GitLab Container Registry

Registry встроен в GitLab CE/EE. Путь образа:

```text
<registry-host>/<namespace>/<project>:<tag>
```

Локально: `localhost:8929/root/hello-ci:abc123def...`

| Variable | Назначение |
|----------|------------|
| `CI_REGISTRY` | hostname registry (`localhost:8929`) |
| `CI_REGISTRY_IMAGE` | полный путь **без тега** |
| `CI_REGISTRY_USER` | обычно `gitlab-ci-token` |
| `CI_REGISTRY_PASSWORD` | **CI job token** — живёт только пока job |

**Зачем job token:** не хранить long-lived пароль root в variables; scoped доступ на время job.

Просмотр: **Deploy → Container Registry** в UI проекта.

---

## Минимальный build job

```yaml
docker-build:
  stage: build
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
    - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
  script:
    - docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - docker tag "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" "$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG"
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

Построчно:

- `services: docker:dind` — sidecar с Docker daemon в сети job.
- `DOCKER_TLS_CERTDIR` — TLS между cli и dind (GitLab default pattern).
- Тег **SHA** — основной для deploy ([05-deploy-kubernetes.md](05-deploy-kubernetes.md)).
- Тег **ref slug** — отладка ветки (не для prod).

Dockerfile из [`examples/k8s-deploy/Dockerfile`](examples/k8s-deploy/Dockerfile) — минимальный Python http.server для лаб.

---

## Docker-in-Docker vs Kaniko

| | Docker dind | Kaniko |
|---|-------------|--------|
| Privileged runner | часто **да** | **нет** |
| Docker socket | не нужен на хосте | не нужен |
| Скорость | быстрее на кэше | холодный старт дольше |
| Production | уходят в Kaniko/BuildKit rootless | предпочтительнее в locked-down k8s |

Учебный [`deploy/gitlab/docker-compose.yml`](../../deploy/gitlab/docker-compose.yml) монтирует `docker.sock` в runner — dind проще для курса.

Kaniko (справка):

```yaml
kaniko-build:
  stage: build
  image:
    name: gcr.io/kaniko-project/executor:debug
    entrypoint: [""]
  script:
    - /kaniko/executor
        --context "$CI_PROJECT_DIR"
        --dockerfile Dockerfile
        --destination "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
```

---

## Настройка runner для dind

В контейнере `mock-gitlab-runner`, файл `/etc/gitlab-runner/config.toml`:

```toml
[[runners]]
  [runners.docker]
    privileged = true
```

После правки: `docker restart mock-gitlab-runner`.

**Production:** privileged runner — зона повышенного риска; изолируйте от production secrets.

---

## Стратегия тегов

| Тег | Когда | Риск |
|-----|-------|------|
| `$CI_COMMIT_SHA` | deploy, audit, rollback | нет |
| `$CI_COMMIT_REF_SLUG` | dev/review | перезапись при новом push |
| `latest` | только main, документация | **высокий** |
| semver `v1.2.3` | релизы по git tag | низкий при дисциплине |

```yaml
  script:
    - |
      if [ "$CI_COMMIT_BRANCH" = "main" ]; then
        docker tag "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" "$CI_REGISTRY_IMAGE:latest"
        docker push "$CI_REGISTRY_IMAGE:latest"
      fi
```

Deploy в production **всегда** по SHA, не по `latest`.

---

## Кэш слоёв Docker

```yaml
variables:
  DOCKER_BUILDKIT: "1"
script:
  - docker build --cache-from "$CI_REGISTRY_IMAGE:cache" -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .
  - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
  - docker tag "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" "$CI_REGISTRY_IMAGE:cache"
  - docker push "$CI_REGISTRY_IMAGE:cache"
```

На локальном CE кэш работает, но не обязателен для курса.

---

## Связь с Kubernetes

Кластер [`mockctl`](../../mockctl/README.md) должен **pull** образ из `localhost:8929`. Для приватного registry — `imagePullSecrets` ([05-deploy-kubernetes.md](05-deploy-kubernetes.md)). Без secret: `ImagePullBackOff`.

---

## Типичные ошибки

**`Cannot connect to the Docker daemon`.** dind не стартовал; неверный `DOCKER_HOST`; runner не privileged.

**`denied: access forbidden` на push.** Не вызван `docker login`; registry отключён в проекте.

**Образ огромный.** Нет `.dockerignore`; базовый образ не slim.

**Пушите только `latest`.** Невозможно откатиться на конкретный commit.

**Root password в CI variable.** Используйте `CI_REGISTRY_*`.

---

## Резюме

- Registry на том же GitLab instance; login через job token.
- dind + privileged — учебный путь; Kaniko — production alternative.
- Immutable тег `$CI_COMMIT_SHA` — контракт между CI и Kubernetes deploy.

---

## Связи

| Материал | Связь |
|----------|-------|
| [04-lab-build-push.md](04-lab-build-push.md) | лаба с `examples/k8s-deploy/Dockerfile` |
| [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md) | deploy по `$CI_COMMIT_SHA` |
| [`deploy/gitlab`](../../deploy/gitlab/README.md) | поднятие registry |
| [gitlab-advanced](../gitlab-advanced/README.md) | Container Scanning после push |

---

## Чек-лист

- [ ] Знаете четыре переменные `CI_REGISTRY*`
- [ ] Можете объяснить dind vs Kaniko на собесе
- [ ] Понимаете, почему deploy по SHA, не по latest
- [ ] Умеете прочитать путь образа в UI Registry
- [ ] Знаете, зачем `privileged` на учебном runner

Следующий урок: [04-lab-build-push.md](04-lab-build-push.md).
