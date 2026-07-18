# GitOps — Basic (Argo CD на mockctl)

Курс для **DevOps / Platform**: принципы **GitOps**, контроллер **Argo CD**, CR **Application**, **sync policy**, **drift** и **self-heal** на локальном кластере **mockctl**.

**Предварительно:** [`kuber-basic`](../kuber-basic/README.md) (Pod, Deployment, Service); желательно [`kuber-intermediate/07-helm`](../kuber-intermediate/07-helm.md). Кластер: [`mockctl up`](../../mockctl/README.md) → `output/kubeconfig.yaml`.

**Стенд:** [`deploy/gitops`](../../deploy/gitops/README.md):

| Шаг | Команда |
|-----|---------|
| Кластер | `mockctl up` |
| Argo CD | `cd deploy/gitops && bash scripts/install-argocd.sh` |
| UI | `kubectl port-forward svc/argocd-server -n argocd 8080:443` → https://localhost:8080 |
| Первый app | `cp config/repo.env.example config/repo.env` → push в fork → `bash scripts/apply-hello-direct.sh` |

Обзор в других курсах (коротко): [kuber-advanced/16](../kuber-advanced/16-argocd.md), [gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md). **Углубление** — этот трек и [gitops-intermediate](../gitops-intermediate/README.md).

**Дальше:** app-of-apps, sync waves, rollback — [gitops-intermediate](../gitops-intermediate/README.md).

## Как читать главы

1. **Теория** — сценарий с работы, таблицы, антипаттерны.
2. **Лаба** — `mockctl` + `deploy/gitops`; манифесты в Git должны быть **запушены** в remote, который видит Argo CD.
3. После правки в Git — дождаться auto-sync или `argocd app sync`.

**Время:** ~**45–60 мин** на пару «теория + лаба»; [финал](10-final-project.md) — **2–3 ч**. Весь курс — **~8–10 ч**.

## Программа

### Принципы и установка (01–03)

1. [GitOps: desired state в Git](01-gitops-principles.md)
2. [Argo CD: компоненты и поток sync](02-argocd-architecture.md)
3. [Лаба: установка Argo CD](03-lab-install.md)

### Application (04–05)

4. [Application CR: source, destination, syncPolicy](04-application-spec.md)
5. [Лаба: первый Application](05-lab-first-application.md)

### Drift и политики (06–07)

6. [Synced / OutOfSync, selfHeal, prune](06-sync-drift.md)
7. [Лаба: self-heal и prune](07-lab-self-heal.md)

### Операции (08–10)

8. [UI, CLI, diff и health](08-ui-cli.md)
9. [GitOps vs kubectl apply в CI](09-vs-ci-apply.md)
10. [Финальный проект: demo из Git](10-final-project.md)

## Что должно получиться

- Объясняете, почему **Git** — source of truth для кластера.
- Устанавливаете Argo CD на **mockctl** и входите в UI.
- Создаёте **Application** на `deploy/gitops/manifests/hello-gitops`.
- Демонстрируете **OutOfSync** после `kubectl scale` и откат через **selfHeal**.
- Читаете **Diff** в UI / `argocd app diff`.
- Не смешиваете `kubectl apply` из CI и Argo на одни манифесты.

## Связанные материалы

| Курс | Связь |
|------|--------|
| [kuber-advanced/16–17](../kuber-advanced/16-argocd.md) | краткий обзор |
| [gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md) | split CI/CD |
| [deploy/gitops](../../deploy/gitops/README.md) | манифесты и скрипты |
