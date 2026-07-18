# 13. Финальный проект: pipeline image-platform

## Сценарий с работы

Собеседование: «опишите CI/CD последнего проекта». Слабый ответ: «у нас GitLab и Docker». Сильный: multi-stage DAG, immutable tags, staging auto / prod manual, shared templates, optional terraform plan, protected secrets, rollback story. Финальный проект собирает **все главы** на [`deploy/gitlab`](../../deploy/gitlab/README.md) + [`mockctl`](../../mockctl/README.md).

Целевое приложение: [`hello-ci`](../gitlab-basic/examples/hello-ci/) или концептуально [`image-platform`](../aws-intermediate/projects/image-platform/) — главное **полный pipeline**.

## Цель

```text
MR  → lint → test → docker build → push registry
main → deploy staging (auto) → deploy production (manual)
опционально: terraform plan job для infrastructure/
```

## Что вы сдаёте

| Артефакт | Описание |
|----------|----------|
| GitLab project URL | публичный или скрин + описание |
| MR link | финальный MR с зелёным pipeline |
| README | архитектура, rollback, ограничения стенда |
| Screenshot | pipeline graph + Environments UI |
| Текст 5 предложений | «что улучшили бы для production» |

---

## Требования (чек-лист сдачи)

| # | Критерий | Глава |
|---|----------|-------|
| 1 | Multi-stage + `needs` (fail fast) | [01](01-multi-stage.md), [02](02-lab-multi-stage.md) |
| 2 | Image в Registry по `$CI_COMMIT_SHA` | [03](03-docker-registry.md), [04](04-lab-build-push.md) |
| 3 | Deploy mockctl: staging + prod namespace | [05](05-deploy-kubernetes.md), [06](06-lab-deploy-mockctl.md) |
| 4 | Environments (staging auto, prod manual) | [07](07-environments.md), [08](08-lab-environments.md) |
| 5 | `include` + `extends` shared template | [09](09-ci-templates.md), [10](10-lab-templates.md) |
| 6 | Protected File variable `KUBECONFIG` | [00](00-environment.md), [06](06-lab-deploy-mockctl.md) |
| 7 | `workflow:rules` | [01](01-multi-stage.md) |
| 8 | README + pipeline graph screenshot | — |
| 9 | (Бонус) `terraform-plan` на MR | [11](11-terraform-ci.md), [12](12-lab-terraform-ci.md) |
| 10 | (Бонус) Helm deploy | [kuber-intermediate/07-helm](../kuber-intermediate/07-helm.md) |

---

## Рекомендуемая структура

```text
image-platform-ci/
├── README.md
├── .gitlab-ci.yml
├── ci/
│   ├── docker-build.yml
│   └── deploy-k8s.yml
├── Dockerfile
├── app/
├── k8s/
│   └── deployment.yaml      ← из examples/k8s-deploy/
├── tests/
└── infrastructure/         # опционально, image-pipeline
```

---

## Эталонный скелет `.gitlab-ci.yml`

```yaml
include:
  - local: ci/docker-build.yml
  - local: ci/deploy-k8s.yml

stages:
  - validate
  - test
  - build
  - deploy

workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - when: never

lint:
  stage: validate
  image: python:3.12-slim
  tags: [docker]
  script:
    - pip install ruff && ruff check .

unit:
  stage: test
  needs: [lint]
  image: python:3.12-slim
  tags: [docker]
  script:
    - pip install pytest && pytest -q

build-image:
  extends: .docker-build
  needs: [unit]

deploy-staging:
  extends: .deploy-k8s
  environment:
    name: staging
  variables:
    K8S_NAMESPACE: hello-ci-staging
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy-production:
  extends: .deploy-k8s
  environment:
    name: production
    deployment_tier: production
  variables:
    K8S_NAMESPACE: hello-ci-prod
  when: manual
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

Дополните `ci/deploy-k8s.yml` secret, envsubst, rollout ([08-lab-environments.md](08-lab-environments.md)).

---

## Критерии качества (self-review)

### Pipeline design

- [ ] Дорогие jobs не бегут при failed tests
- [ ] MR не деплоит в production
- [ ] Redundant pipelines отменяются

### Security sketch

- [ ] Нет kubeconfig / AWS keys в Git
- [ ] Registry login через `CI_REGISTRY_*`
- [ ] Production environment protected

### Operability

- [ ] README: rollback deployment
- [ ] README: обновить kubeconfig после `mockctl up`
- [ ] Environments показывают последний SHA

---

## «Что улучшили бы для production» (пример)

1. **Kaniko** вместо privileged dind.
2. **GitLab Agent for Kubernetes** вместо static kubeconfig.
3. **Container Scanning + SAST** ([gitlab-advanced](../gitlab-advanced/README.md)).
4. **GitOps (Argo CD)** — CI только build/push.
5. **OIDC в AWS** для terraform ([aws-terraform](../aws-terraform/README.md)).

Напишите **свои** пять пунктов.

---

## Оценка

| Уровень | Признаки |
|---------|----------|
| Pass | критерии 1–8, pipeline green |
| Strong | + Helm или terraform plan |
| Excellent | + tfsec, smoke job, SLO |

---

## Типичные ошибки

**Один `.gitlab-ci.yml` на 300 строк** — нарушает templates.

**Production deploy auto** — [07-environments.md](07-environments.md).

**Нет связи SHA ↔ deploy** — проверьте `IMAGE`.

**Скриншот только pipeline** — добавьте Environments.

---

## Резюме

- Финал = полный pipeline от MR до manual prod deploy.
- Стенд: GitLab registry + mockctl cluster + optional terraform.

---

## Дальше

- [`gitlab-advanced`](../gitlab-advanced/README.md)
- [`devops-culture`](../devops-culture/README.md)
- [`mock-ckad`](../mock-ckad/README.md)

Подготовка: [interview-cheatsheet.md](interview-cheatsheet.md) → [14-interview-qa.md](14-interview-qa.md).

**gitlab-intermediate завершён.**
