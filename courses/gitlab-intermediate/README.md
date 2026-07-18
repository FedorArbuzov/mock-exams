# GitLab DevOps — Intermediate

Мега-подробный курс по **продвинутому GitLab CI/CD**: multi-stage pipeline с DAG, сборка и push Docker-образа в **GitLab Container Registry**, **deploy в Kubernetes** через [`mockctl`](../../mockctl/README.md), **environments** (staging / production), переиспользуемые **CI templates**, **Terraform plan** на Merge Request.

**14 уроков** (00–13) + interview cheatsheet + ~20 вопросов на собес. Каждая глава — **полноценный учебник** (~150–220 строк): сценарий с работы → теория → код → типичные ошибки → чек-лист. Эталон стиля: [`postgresql-basic/01-architecture.md`](../postgresql-basic/01-architecture.md).

> Старт DevOps-маршрута: [`devops-path.md`](../devops-path.md). Карта всех треков: [`courses/README.md`](../README.md).

---

## Для кого этот курс

Вы прошли [`gitlab-basic`](../gitlab-basic/README.md) и умеете писать `.gitlab-ci.yml` с stages, runners и variables. Теперь нужно **замкнуть цикл доставки**: commit → test → **immutable image** в registry → **deploy в кластер** → staging/production с manual gate. Курс рассчитан на инженеров, которые готовятся к роли **Platform / DevOps** и хотят объяснить свой pipeline на собеседовании, а не только «скопировать YAML из wiki».

---

## Предварительные требования (обязательно)

Без этих курсов intermediate превращается в «копирование YAML без понимания, почему job pending».

| Курс / инструмент | Что должны уметь | Проверка готовности |
|---|---|---|
| [`gitlab-basic`](../gitlab-basic/README.md) | `.gitlab-ci.yml`, stages, jobs, runners, variables, artifacts | Финальный проект basic: runner с тегом `docker`, зелёный pipeline |
| [`kuber-basic`](../kuber-basic/README.md) | `kubectl`, Deployment, Service, namespace | `kubectl get pods` в любом namespace |
| [`mockctl`](../../mockctl/README.md) | `mockctl up`, `kubectl get nodes`, kubeconfig в `output/` | `mockctl status` → нода Ready |

**Желательно (параллельно или до финала):**

| Материал | Зачем в intermediate |
|---|---|
| [`kuber-intermediate/07-helm.md`](../kuber-intermediate/07-helm.md) | альтернатива raw YAML при deploy (бонус в лабе 06) |
| [`kuber-intermediate/08-lab-helm.md`](../kuber-intermediate/08-lab-helm.md) | hands-on Helm upgrade в CI |
| [`aws-terraform`](../aws-terraform/README.md) | Terraform plan/apply в CI (главы 11–12, проект `image-pipeline`) |
| [`aws-intermediate`](../aws-intermediate/README.md) | концепция `image-platform` — целевое приложение финала |

---

## Локальная среда

| Компонент | Путь / команда | Порт / артефакт |
|---|---|---|
| GitLab CE + runner | [`deploy/gitlab`](../../deploy/gitlab/README.md) | UI **8929**, registry на том же хосте |
| Kubernetes-кластер | `mockctl up` — профиль `mock-exams` | kubeconfig: `output/kubeconfig.yaml` |
| Примеры приложения | [`examples/k8s-deploy/`](examples/k8s-deploy/) | Dockerfile + `k8s/deployment.yaml` |

Перед первым уроком пройдите **[00-environment.md](00-environment.md)** (~45–60 мин): проверка GitLab, runner, registry, kubectl context, структура examples.

```bash
# из корня mock-exams
docker compose -f deploy/gitlab/docker-compose.yml up -d
docker exec mock-gitlab gitlab-ctl status   # дождаться run:
mockctl install && mockctl up && mockctl status
```

### Требования к железу

| RAM | GitLab CE | GitLab + mockctl одновременно |
|-----|-----------|-------------------------------|
| < 4 GB | GitLab может не стартовать | не рекомендуется |
| 6 GB | OK для одного пользователя | tight — закройте лишние IDE |
| 8+ GB | комфортно | **рекомендуемый минимум** для курса |

Docker Desktop (или Docker Engine) должен быть запущен **до** `mockctl up` и `docker compose up` для GitLab. На Windows убедитесь, что minikube и GitLab compose видят **один** Docker daemon.

---

## Как читать главы

Каждый урок — **полноценная глава учебника**, не шпаргалка. Автор ведёт от **рабочего сценария** (ImagePullBackOff, deploy в prod с feature branch, dind без privileged) к концепциям, YAML, командам и типичным ошибкам.

1. **Теория** (`NN-topic.md`) — «Сценарий с работы» → «Что вы узнаете» → подробное содержание → примеры кода → «Типичные ошибки» → «Резюме» → «Чек-лист».
2. **Лаба** (`NN-lab-topic.md`) — hands-on на `:8929` и mockctl: push, MR, pipeline graph, registry, deploy. Таблица «если что-то пошло не так» — в конце лабы.
3. Закрепляйте чек-лист **своими словами** до перехода к следующей главе.
4. Фиксируйте `.gitlab-ci.yml` в отдельном GitLab-проекте (`hello-ci-intermediate` или fork [`hello-ci`](../gitlab-basic/examples/hello-ci/)).
5. Перед собесом: [interview-cheatsheet.md](interview-cheatsheet.md) → [14-interview-qa.md](14-interview-qa.md) **без подглядывания**.

**Время:** ~25–50 мин на пару «теория + лаба»; весь курс **~12–18 часов**; финальный проект — **2–4 часа** отдельно.

---

## Программа по фазам

### Фаза 0 — окружение (P0)

| # | Файл | Время | Содержание |
|---|------|-------|------------|
| 0 | [00-environment.md](00-environment.md) | ~45–60 мин | GitLab, runner, registry, mockctl, структура `examples/` |

### Фаза 1 — pipeline и образ (P0)

| # | Файл | Время | Содержание |
|---|------|-------|------------|
| 1 | [01-multi-stage.md](01-multi-stage.md) | ~25 мин | stages, `needs`, DAG, `workflow:rules`, fail fast |
| 2 | [02-lab-multi-stage.md](02-lab-multi-stage.md) | ~40 мин | validate → test → build (stub) |
| 3 | [03-docker-registry.md](03-docker-registry.md) | ~25 мин | Container Registry, dind, Kaniko, теги |
| 4 | [04-lab-build-push.md](04-lab-build-push.md) | ~45 мин | реальный build + push в registry |

### Фаза 2 — deploy в Kubernetes (P0)

| # | Файл | Время | Содержание |
|---|------|-------|------------|
| 5 | [05-deploy-kubernetes.md](05-deploy-kubernetes.md) | ~25 мин | kubectl vs Helm, kubeconfig, imagePullSecrets |
| 6 | [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md) | ~50 мин | deploy `hello-ci` в namespace mockctl |

### Фаза 3 — environments (P1)

| # | Файл | Время | Содержание |
|---|------|-------|------------|
| 7 | [07-environments.md](07-environments.md) | ~25 мин | staging/production, manual, dynamic review |
| 8 | [08-lab-environments.md](08-lab-environments.md) | ~45 мин | два namespace, variables per environment |

### Фаза 4 — переиспользование CI (P1)

| # | Файл | Время | Содержание |
|---|------|-------|------------|
| 9 | [09-ci-templates.md](09-ci-templates.md) | ~25 мин | `include`, `extends`, hidden jobs |
| 10 | [10-lab-templates.md](10-lab-templates.md) | ~40 мин | вынести docker-build в shared template |

### Фаза 5 — Terraform в CI (P1)

| # | Файл | Время | Содержание |
|---|------|-------|------------|
| 11 | [11-terraform-ci.md](11-terraform-ci.md) | ~25 мин | fmt, validate, plan artifact, manual apply |
| 12 | [12-lab-terraform-ci.md](12-lab-terraform-ci.md) | ~50 мин | `image-pipeline` из aws-terraform |

### Фаза 6 — финал и собес (P0)

| # | Файл | Время | Содержание |
|---|------|-------|------------|
| 13 | [13-final-project.md](13-final-project.md) | ~2–4 ч | полный pipeline image-platform |
| — | [interview-cheatsheet.md](interview-cheatsheet.md) | ~15 мин | шпаргалка перед собесом |
| 14 | [14-interview-qa.md](14-interview-qa.md) | ~30 мин | ~20 вопросов с развёрнутыми ответами |

---

## Архитектура учебного pipeline

```text
MR / push main
    │
    ▼
┌──────────┐   ┌──────┐   ┌─────────────┐   ┌─────────────────────────┐
│ validate │──▶│ test │──▶│ docker build│──▶│ deploy (staging / prod) │
│ lint     │   │ unit │   │ push registry│  │ mockctl + kubectl/helm  │
└──────────┘   └──────┘   └─────────────┘   └─────────────────────────┘
                                  │                      ▲
                                  └──── pull ────────────┘
```

Registry: `localhost:8929` ([`deploy/gitlab`](../../deploy/gitlab/README.md)). Кластер: minikube `mock-exams` ([`mockctl`](../../mockctl/README.md)). Манифесты: [`examples/k8s-deploy/k8s/deployment.yaml`](examples/k8s-deploy/k8s/deployment.yaml).

---

## Что должно получиться к концу

- Пишете multi-stage pipeline с `needs` и `workflow:rules` — дорогие jobs не бегут на каждый push.
- Собираете образ, пушите в GitLab Container Registry с тегом `$CI_COMMIT_SHA`.
- Деплоите приложение в `mockctl` (kubectl или Helm), настраиваете `imagePullSecrets`.
- Разделяете **staging** (auto) и **production** (`when: manual`, protected environment).
- Выносите повторяющиеся jobs в `include` / `extends`.
- Запускаете `terraform fmt/validate/plan` на MR без apply; apply — только manual на `main`.

---

## Связь с другими курсами

| Курс | Интеграция в intermediate |
|---|---|
| [`gitlab-basic`](../gitlab-basic/README.md) | runners, variables — база для всего курса |
| [`kuber-basic`](../kuber-basic/README.md) | Deployment/Service — цель deploy job |
| [`kuber-intermediate`](../kuber-intermediate/README.md) | Helm chart вместо raw YAML (бонус в лабе 06) |
| [`aws-terraform`](../aws-terraform/README.md) | проект `image-pipeline` — plan/apply jobs |
| [`aws-intermediate`](../aws-intermediate/README.md) | `image-platform` — целевое приложение финала |
| [`gitlab-advanced`](../gitlab-advanced/README.md) | security scanning, GitLab Agent, GitOps split |
| [`devops-culture`](../devops-culture/README.md) | DORA, deployment frequency, lead time |

---

## Структура каталога

```text
courses/gitlab-intermediate/
├── README.md                 ← вы здесь
├── 00-environment.md
├── 01-multi-stage.md … 13-final-project.md
├── 14-interview-qa.md
├── interview-cheatsheet.md
└── examples/
    └── k8s-deploy/
        ├── Dockerfile
        ├── app/              ← статика для http.server
        └── k8s/
            └── deployment.yaml
```

Примеры **не** поднимают сервис сами — их собирает pipeline и деплоит job в кластер.

---

## Как проходить курс

1. Пройдите [gitlab-basic](../gitlab-basic/README.md) до финального проекта (runner с тегом `docker`).
2. Выполните [00-environment.md](00-environment.md) — без зелёного чек-листа не начинайте лабы.
3. Читайте теорию (`NN-topic.md`), затем лабу (`NN-lab-topic.md`) в той же главе.
4. После каждой лабы делайте commit в GitLab — история pipeline graph пригодится на собесе.
5. Перед собесом: [interview-cheatsheet.md](interview-cheatsheet.md) → [14-interview-qa.md](14-interview-qa.md).

**Дальше:** [`gitlab-advanced`](../gitlab-advanced/README.md) — SAST, Container Scanning, Agent for Kubernetes, разделение CI и GitOps.
