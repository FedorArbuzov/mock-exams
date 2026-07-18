# 12. Лаба: CI build, Argo sync

## Сценарий с работы

Release manager: «Покажите, что production tag в кластере совпадает с git commit в gitops repo — и что CI **не** вызывал kubectl». Эта лаба — E2E доказательство GitOps split.

Вчерашний инцидент: CI «задеплоил» v2.3, Argo показывает v2.2 — потому что kubectl apply и Argo CD конкурировали. Сегодня вы убираете kubectl из pipeline.

---

## Цель лабораторной

Убрать `kubectl apply` из CI, настроить **bump gitops** после build/scan, deploy через **Argo CD** sync. E2E: merge → new image; rollback через `git revert`.

**Время:** ~150 минут.  
**Предварительно:** [11-gitlab-and-argocd.md](11-gitlab-and-argocd.md), [kuber-advanced/17-lab-argocd.md](../kuber-advanced/17-lab-argocd.md).

---

## Подготовка

- [ ] Argo CD Running в `argocd`
- [ ] App repo с `docker-build`, `container-scan`
- [ ] GitOps repo или `deploy/gitops/apps/hello-ci`
- [ ] Удалены deploy jobs с `kubectl` из intermediate

```bash
kubectl get applications -n argocd
```

---

## Задание 1. Структура gitops

`gitops/apps/hello-ci/values.yaml`:

```yaml
image:
  repository: registry.example.com/platform/hello-ci
  tag: "initial"
replicaCount: 1
service:
  port: 8080
```

Chart — из [`gitlab-intermediate/examples/k8s-deploy/`](../gitlab-intermediate/examples/k8s-deploy/).

---

## Задание 2. Argo Application

`gitops/argocd/application-hello-ci.yaml`:

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

```bash
kubectl apply -f gitops/argocd/application-hello-ci.yaml
```

Argo UI: **Synced**, **Healthy**.

---

## Задание 3. CI только build + bump

Удалите:

```yaml
# УДАЛИТЬ
deploy:
  script:
    - kubectl apply ...
```

Добавьте:

```yaml
bump-gitops:
  stage: deploy
  image: alpine:3.20
  before_script:
    - apk add --no-cache git yq
    - git config user.email "ci@mock-exams.local"
    - git config user.name "GitLab CI"
  script:
    - git clone "https://gitlab-ci-token:${CI_JOB_TOKEN}@${CI_SERVER_HOST}/platform/gitops.git" /tmp/gitops
    - cd /tmp/gitops/apps/hello-ci
    - yq -i '.image.tag = strenv(CI_COMMIT_SHA)' values.yaml
    - git add values.yaml
    - git diff --staged --quiet && echo "No changes" && exit 0
    - git commit -m "ci(hello-ci): bump to ${CI_COMMIT_SHA}"
    - git push "https://gitlab-ci-token:${CI_JOB_TOKEN}@${CI_SERVER_HOST}/platform/gitops.git" HEAD:main
  needs: [container-scan, docker-build]
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

Настройте `CI_JOB_TOKEN` permissions для gitops project.

---

## Задание 4. E2E сценарий

1. **MR** → pipeline: test, SAST, build, scan — green, **без deploy**
2. **Merge** main → `bump-gitops` → commit gitops
3. Argo auto sync
4. Проверка:

```bash
kubectl get pods -n hello-ci -o wide
kubectl get deploy hello-ci -n hello-ci -o jsonpath='{.spec.template.spec.containers[0].image}'
```

Image содержит новый `CI_COMMIT_SHA`.

5. Argo UI: Revision = последний gitops commit

---

## Задание 5. Rollback

```bash
cd gitops
git revert HEAD
git push
```

Argo sync → предыдущий tag. **Не** `kubectl rollout undo`.

`docs/rollback.md`:

```markdown
## Production rollback
1. `git revert` bump commit in gitops repo
2. Argo auto-sync (or manual sync)
3. Verify image tag in cluster
```

---

## Задание 6. Drift test

```bash
kubectl scale deployment hello-ci -n hello-ci --replicas=3
```

При `selfHeal: true` Argo вернёт `replicaCount` из git. Скрин Events в UI.

---

## Задание 7. Staging vs production (опционально)

Два values file:

- `values-staging.yaml` — auto bump on main
- `values-production.yaml` — manual bump, `resource_group: production`

Два Argo Applications или kustomize overlays.

---

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| bump push 403 | Job token scope, deploy key |
| Argo OutOfSync | Manual kubectl остался |
| ImagePullBackOff | tag не в registry |
| Sync failed | Helm template error |

---

## Критерии успеха

- [ ] CI **не** вызывает kubectl
- [ ] Argo Synced + Healthy
- [ ] Новый SHA на кластере после merge
- [ ] Rollback через git revert
- [ ] `docs/rollback.md`

---

## Связь с финальным проектом

Паттерн — ядро [15-final-project.md](15-final-project.md).

---

## Резюме

GitOps split: CI заканчивается на git commit; Argo — единственный CD. Следующий урок: [13-pipeline-reliability.md](13-pipeline-reliability.md).
