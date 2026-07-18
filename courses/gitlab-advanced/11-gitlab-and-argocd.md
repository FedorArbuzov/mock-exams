# 11. GitLab CI + Argo CD: разделение CI и CD

## Сценарий с работы

Platform team внедрила Argo CD. DevOps из приложения **всё ещё** держит `kubectl apply` в GitLab CI «для скорости». Через неделю Argo UI красный: **OutOfSync**. HPA изменили вручную — Argo selfHeal откатил. CI снова apply — бесконечная война двух источников правды.

**Решение:** чёткое разделение **CI (GitLab)** и **CD (Argo CD)**. Центральная идея фазы 4 и [gitops-intermediate](../gitops-intermediate/README.md).

---

## Что вы узнаете

- Принцип split CI/CD и зоны ответственности.
- Паттерн bump gitops из CI.
- Argo Application и anti-patterns.
- Staging vs production и Image Updater trade-offs.

---

## Принцип разделения

| | CI (GitLab) | CD (Argo CD) |
|---|-------------|--------------|
| **Ответственность** | compile, test, scan, build image | deploy, sync, health, rollback |
| **Артефакт** | Docker image + git commit gitops | Git как desired state |
| **Триггер** | push, MR, schedule | изменение gitops repo |
| **Инструмент** | `.gitlab-ci.yml` | Application CR |
| **Кластер write** | **нет** *(целевая модель)* | да, через controller |

```text
App repo (GitLab CI) ──build/push──► Container Registry
         │ bump tag/commit
         ▼
GitOps repo ──watch/sync──► Argo CD ──► Kubernetes
```

---

## Почему отдельный gitops repo

| Причина | Пояснение |
|---------|-----------|
| RBAC | App devs не меняют prod manifests |
| Audit | Каждый deploy = git commit |
| Rollback | `git revert` + Argo sync |
| Blast radius | CI token не нужен cluster admin |
| Multi-cluster | Один chart, values per env |

Monorepo `deploy/gitops` в mock-exams допустим — [`deploy/gitops`](../../deploy/gitops/README.md).

---

## Update gitops repo из CI

```yaml
bump-gitops-staging:
  stage: deploy
  image: alpine:3.20
  before_script:
    - apk add --no-cache git yq
    - git config user.email "ci@mock-exams.local"
    - git config user.name "GitLab CI"
  script:
    - git clone "https://gitlab-ci-token:${CI_JOB_TOKEN}@gitlab.example.com/platform/gitops.git"
    - cd gitops/apps/hello-ci
    - yq -i '.image.tag = strenv(CI_COMMIT_SHA)' values.yaml
    - git add values.yaml
    - git diff --staged --quiet || git commit -m "ci: bump hello-ci to ${CI_COMMIT_SHA}"
    - git push origin HEAD:main
  needs: [container-scan, docker-build]
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

Deploy token или `CI_JOB_TOKEN` с write на gitops project.

### Image tag vs digest

| | Tag (`sha`) | Digest |
|---|-------------|--------|
| Читаемость | высокая | низкая |
| Immutability | tag может перезаписаться | immutable |
| GitOps | обычно tag | highest security |

Рекомендация: tag = `CI_COMMIT_SHA` + registry immutable tags policy.

---

## Argo CD Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: hello-ci
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://gitlab.example.com/platform/gitops.git
    targetRevision: main
    path: apps/hello-ci
    helm:
      valueFiles: [values.yaml]
  destination:
    server: https://kubernetes.default.svc
    namespace: hello-ci
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

Установка: [kuber-advanced/16-argocd.md](../kuber-advanced/16-argocd.md), [17-lab-argocd.md](../kuber-advanced/17-lab-argocd.md).

---

## Argo CD Image Updater

```yaml
metadata:
  annotations:
    argocd-image-updater.argoproj.io/image-list: hello=registry.example.com/platform/hello-ci
    argocd-image-updater.argoproj.io/hello.update-strategy: newest-build
```

**Trade-off:** меньше CI glue, ещё один компонент. Для mock-exams — **explicit bump в CI** (прозрачнее для аудита).

---

## Environments: staging vs production

```text
merge main → bump staging → Argo auto-sync staging
manual approval → bump production → Argo sync prod
```

GitLab `environment: production` + `when: manual` на bump job, не на `kubectl`.

---

## Anti-patterns

| Антипаттерн | Последствие |
|-------------|-------------|
| `kubectl apply` + Argo same manifests | Drift, OutOfSync |
| CI меняет live objects | SelfHeal откат |
| GitOps repo без review | prod commit без MR |
| Latest tag в values | непонятно что в prod |

Выберите **один** CD механизм. CI заканчивается на **git commit** в gitops.

---

## Связь с курсами GitOps

| Курс | Тема |
|------|------|
| [gitops-basic](../gitops-basic/README.md) | Desired state |
| [gitops-intermediate/09](../gitops-intermediate/09-split-ci-cd.md) | Split pattern |
| [kuber-advanced/16](../kuber-advanced/16-argocd.md) | Argo components |
| [deploy/gitops](../../deploy/gitops/README.md) | Стенд |

---

## Security в split model

- CI job token — write только gitops repo
- Argo repo credentials read-only на app repos
- Container scan **before** bump
- OIDC AWS для terraform infra отдельно от app CD

---

## Observability

Argo UI: Sync, Health, History. Алерт на `Degraded` / `OutOfSync` — [kuber-advanced/14-observability](../kuber-advanced/14-observability.md).

**GitLab pipeline success ≠ deploy success** — проверяйте Argo после bump.

---

## Самопроверка

1. Кто владеет desired state?
2. Зачем отдельный gitops repo?
3. Image tag vs digest?
4. Почему нельзя kubectl и Argo?
5. Image Updater vs CI bump?

---

## Резюме

GitLab CI производит **verified artifact** и обновляет **git declaration**; Argo CD — единственный writer в кластер. Лаба: [12-lab-split-ci-cd.md](12-lab-split-ci-cd.md).
