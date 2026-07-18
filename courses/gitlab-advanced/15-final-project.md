# 15. Финальный проект: Platform pipeline

## Сценарий с работы

Staff engineer на review: «Покажите platform pipeline end-to-end: security gate на MR, образ по SHA, CD только через Argo, без static AWS keys, с runbook». Этот capstone — ответ для портфолио и собеседований.

Это не «ещё одна лаба» — это сборка всего курса в один воспроизводимый стенд, который вы можете показать на интервью за 10 минут.

---

## Цель capstone

Собрать **production-style** platform pipeline для mock-exams: security gates, OIDC/Agent doc, GitOps CD через Argo, reliability patterns.

**Время:** 4–6 часов.  
**Предварительно:** фазы 1–5, [00-environment.md](00-environment.md).

---

## Целевая архитектура

```text
MR ──► lint, unit test
    ──► SAST + secret detection
    ──► docker build ──► push Registry (tag = CI_COMMIT_SHA)
    ──► container scan (HIGH/CRITICAL fail)

merge main ──► bump gitops repo (staging)
            ──► Argo CD auto-sync staging

manual ──► bump gitops production
        ──► Argo sync production

(optional) MR/main ──► terraform plan via OIDC
```

**CI не вызывает `kubectl apply`. CD только Argo.**

---

## Требования (rubric)

| # | Критерий | Вес |
|---|----------|-----|
| 1 | Security stage блокирует critical/high по policy | обязательно |
| 2 | Image в Registry по `$CI_COMMIT_SHA` | обязательно |
| 3 | CD через Argo (не kubectl из CI) | обязательно |
| 4 | Environments staging + production | обязательно |
| 5 | `include` / templates ([templates/security-pipeline.yml](templates/security-pipeline.yml)) | обязательно |
| 6 | `interruptible` на test; `resource_group` на prod bump | обязательно |
| 7 | OIDC AWS plan **или** `docs/oidc-aws.md` | обязательно |
| 8 | Agent doc **или** `docs/agent-vs-kubeconfig.md` | обязательно |
| 9 | README + диаграмма CI/CD split | обязательно |
| 10 | `docs/ci-runbook.md` (≥5 сценариев) | обязательно |

---

## Рекомендуемая структура

```text
platform-hello-ci/
├── .gitlab-ci.yml
├── .gitlab/ci/
│   ├── security-pipeline.yml
│   └── bump-gitops.yml
├── .gitlab/agents/mockctl/config.yaml   # optional
├── Dockerfile
├── src/
├── docs/
│   ├── architecture.md
│   ├── oidc-aws.md
│   ├── agent-vs-kubeconfig.md
│   ├── ci-runbook.md
│   └── rollback.md
└── README.md
```

GitOps repo:

```text
gitops/
├── apps/hello-ci/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── values-production.yaml
└── argocd/application-hello-ci.yaml
```

---

## Задание 1. Security pipeline

```yaml
include:
  - local: .gitlab/ci/security-pipeline.yml

stages: [validate, test, security, build, deploy]
```

MR с intentional finding → fix → green. Policy в README.

---

## Задание 2. Build и scan

```yaml
docker-build:
  stage: build
  # push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

container-scan:
  extends: .trivy_scan
  allow_failure: false
```

Bump `needs: [container-scan]`.

---

## Задание 3. GitOps CD

- `bump-staging` — auto on `main`
- `bump-production` — `when: manual`, `resource_group: production`

Argo Applications для staging/prod.

---

## Задание 4. Reliability

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

# test jobs: interruptible: true
```

Runbook из [14-lab-reliability.md](14-lab-reliability.md).

---

## Задание 5. architecture.md

1. Диаграмма CI + CD (mermaid/ASCII)
2. Таблица: кто пишет в кластер
3. Ссылки: [appsec-fundamentals](../appsec-fundamentals/README.md), [kuber-advanced](../kuber-advanced/README.md), [aws-advanced](../aws-advanced/README.md)
4. CE limitations и fallbacks

---

## Задание 6. Демо-сценарий (10 мин)

1. MR с feature → security jobs
2. Merge → bump staging
3. Argo UI Synced
4. `kubectl get pods -n hello-ci-staging`
5. Rollback `git revert`
6. (optional) OIDC terraform plan log

---

## Связь с артефактами mock-exams

| Артефакт | Источник |
|----------|----------|
| App / image | hello-ci |
| Cluster | `mockctl up` |
| Argo | [kuber-advanced/17](../kuber-advanced/17-lab-argocd.md) |
| Security theory | [appsec-fundamentals](../appsec-fundamentals/README.md) |
| Template | [templates/security-pipeline.yml](templates/security-pipeline.yml) |

---

## Частые ошибки при сдаче

| Ошибка | Исправление |
|--------|-------------|
| `allow_failure: true` на scan | Убрать |
| kubectl + Argo | Удалить kubectl |
| `:latest` only | Pin SHA |
| Нет runbook | `docs/ci-runbook.md` |
| Secrets в Git | Variables + gitleaks |

---

## Самооценка

- [ ] Все 10 критериев rubric
- [ ] [interview-cheatsheet.md](interview-cheatsheet.md) без подглядывания
- [ ] Коллега воспроизводит стенд по README

---

## Сдача

1. GitLab project URL
2. MR history с security finding fixed
3. Gitops repo link
4. 10-мин demo

---

**gitlab-advanced завершён.**

GitLab-трек: [gitlab-basic](../gitlab-basic/README.md) → [gitlab-intermediate](../gitlab-intermediate/README.md) → **gitlab-advanced**.

Собеседование: [interview-cheatsheet.md](interview-cheatsheet.md) → [16-interview-qa.md](16-interview-qa.md).
