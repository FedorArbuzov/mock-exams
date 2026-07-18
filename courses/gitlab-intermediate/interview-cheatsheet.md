# GitLab Intermediate — Interview Cheatsheet

Справочник **после** прохождения курса. Сначала ответьте **без подглядывания**, затем сверьтесь здесь и в [14-interview-qa.md](14-interview-qa.md).

Курс: [README.md](README.md). Стенд: [`deploy/gitlab`](../../deploy/gitlab/README.md), [`mockctl`](../../mockctl/README.md). Примеры: [`examples/k8s-deploy/`](examples/k8s-deploy/).

---

## Multi-stage pipeline

| Вопрос | Ответ |
|--------|-------|
| Порядок stages | все jobs stage N завершаются → stage N+1 |
| `needs` | DAG: job стартует после указанных jobs, не всего stage |
| `workflow:rules` | создавать ли pipeline целиком |
| Fail fast | build/deploy после test через `needs` |
| `rules` vs `only` | предпочитать `rules` (сверху вниз, первое совпадение) |
| `CI_PIPELINE_SOURCE` | `merge_request_event`, `push`, `schedule` |

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - when: never

docker-build:
  stage: build
  needs: [unit]
```

---

## Container Registry

| Variable | Назначение |
|----------|------------|
| `CI_REGISTRY` | hostname (`localhost:8929`) |
| `CI_REGISTRY_IMAGE` | путь образа без тега |
| `CI_REGISTRY_USER` | `gitlab-ci-token` |
| `CI_REGISTRY_PASSWORD` | job token (время жизни = job) |

| Тема | Ответ |
|------|-------|
| Тег для deploy | `$CI_COMMIT_SHA` (immutable) |
| dind | `services: docker:dind`, `privileged` runner |
| Kaniko | build без Docker socket / privileged |
| `latest` | перезаписывается — не для prod deploy |
| `.dockerignore` | меньше context, быстрее build |

```yaml
before_script:
  - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
script:
  - docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .
  - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
```

---

## Deploy Kubernetes

| Способ | Когда |
|--------|-------|
| `kubectl apply` + `envsubst` | [`examples/k8s-deploy`](examples/k8s-deploy/), mockctl |
| `helm upgrade --install` | values per env ([kuber-intermediate/07-helm](../kuber-intermediate/07-helm.md)) |
| GitOps (Argo CD) | CI build only — [`gitlab-advanced`](../gitlab-advanced/README.md) |

| Проблема | Решение |
|----------|---------|
| ImagePullBackOff | `imagePullSecrets: gitlab-reg` |
| Unauthorized API | актуальный kubeconfig File variable |
| Неверная версия | deploy по SHA, не `latest` |
| Runner не видит API | host runner / IP minikube в kubeconfig |

```yaml
deploy:
  needs: [docker-build]
  script:
    - export IMAGE="$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - envsubst < k8s/deployment.yaml | kubectl apply -f -
    - kubectl rollout status deployment/hello-ci --timeout=120s
```

---

## Environments

| Конструкция | Эффект |
|-------------|--------|
| `environment: name` | история deploy в Operate → Environments |
| `when: manual` | кнопка Play |
| Protected environment | только Maintainer+ deploy |
| `on_stop` | cleanup review environment |
| Scoped variables | разные `REPLICAS` staging/prod |
| `deployment_tier` | staging / production для DORA |

```yaml
deploy-staging:
  environment: staging
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy-production:
  environment: production
  when: manual
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

---

## CI templates

| Конструкция | Назначение |
|-------------|------------|
| `include: local` | YAML из того же репо |
| `include: project` | shared template repo |
| `.hidden-job` | template, не создаёт job |
| `extends` | наследование конфигурации |
| `ref: v1.0.0` | pin версии template |
| `!reference` | переиспользование script-фрагментов |

```yaml
include:
  - local: ci/docker-build.yml

build-image:
  extends: .docker-build
  needs: [unit]
```

---

## Terraform CI

| Job | Команда |
|-----|---------|
| Format | `terraform fmt -check -recursive` |
| Validate | `terraform validate` |
| Plan (MR) | `init -backend=false` + `plan -out=plan.cache` |
| Apply | `apply plan.cache` — **manual**, main |

| Переменная | Зачем |
|------------|-------|
| `TF_IN_AUTOMATION` | non-interactive CI |
| `TF_INPUT` | `false` — без prompts |
| Plan artifact | тот же plan на apply |

Проект: [`image-pipeline`](../aws-terraform/projects/image-pipeline/). **Не apply на каждый MR** без review.

---

## Переменные (частые)

| Variable | Использование |
|----------|---------------|
| `CI_COMMIT_SHA` | тег образа |
| `CI_COMMIT_REF_SLUG` | DNS-safe имя ветки / review ns |
| `CI_COMMIT_BRANCH` | `main`, feature branches |
| `KUBECONFIG` (File) | доступ к mockctl кластеру |

---

## Команды mockctl / kubectl / docker

```bash
# Стенд
docker compose -f deploy/gitlab/docker-compose.yml up -d
mockctl up && mockctl status
mockctl kubeconfig

# K8s
kubectl get pods -n hello-ci
kubectl rollout undo deployment/hello-ci -n hello-ci
kubectl port-forward -n hello-ci svc/hello-ci 8080:80

# Registry
docker login localhost:8929 -u root -p PASSWORD
docker pull localhost:8929/root/hello-ci:SHA
```

---

## Связи курсов

| Курс | Тема |
|------|------|
| [`gitlab-basic`](../gitlab-basic/README.md) | runners, variables, artifacts |
| [`kuber-basic`](../kuber-basic/README.md) | Deployment, Service |
| [`kuber-intermediate`](../kuber-intermediate/README.md) | Helm deploy |
| [`aws-terraform`](../aws-terraform/README.md) | image-pipeline, LocalStack |
| [`aws-intermediate`](../aws-intermediate/README.md) | image-platform app |
| [`gitlab-advanced`](../gitlab-advanced/README.md) | scanning, Agent, OIDC |

---

## Быстрый self-check (5 мин)

1. Нарисуйте DAG: lint → unit → build → deploy.
2. Назовите 4 переменные `CI_REGISTRY*`.
3. Почему `imagePullSecrets` для `localhost:8929`?
4. Staging auto vs production manual — в чём разница?
5. Зачем `terraform plan -out` + artifact на apply?

Подробные ответы: [14-interview-qa.md](14-interview-qa.md).
