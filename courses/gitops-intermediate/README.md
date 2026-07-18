# GitOps — Intermediate (app-of-apps, waves, rollback)

Продолжение [gitops-basic](../gitops-basic/README.md): **app-of-apps**, **sync waves**, **история и rollback**, Kustomize/Helm как source, сравнение **Flux CD**, связка с **GitLab CI**.

**Предварительно:** пройден basic или [kuber-advanced/17](../kuber-advanced/17-lab-argocd.md). Кластер: `mockctl up`, Argo CD из [`deploy/gitops`](../../deploy/gitops/README.md).

**Стенд:**

| Компонент | Путь / namespace |
|-----------|------------------|
| Root Application | `deploy/gitops/bootstrap/root-application.yaml` → `apps/` |
| Hello app | `manifests/hello-gitops` → `gitops-demo` |
| Sync waves | `manifests/sync-waves` → `gitops-waves` |
| Flux (справка) | `examples/flux-*.yaml` — не ставить вместе с Argo без плана |

**Время:** ~**8–12 ч**; [финал](10-final-project.md) — платформа из 2+ Application.

## Программа

### App-of-apps (01–02)

1. [App-of-apps и root Application](01-app-of-apps.md)
2. [Лаба: gitops-root и дочерние apps](02-lab-app-of-apps.md)

### Sync waves (03–04)

3. [Sync waves и порядок ресурсов](03-sync-waves.md)
4. [Лаба: ConfigMap → Deploy → Service](04-lab-sync-waves.md)

### Rollback (05–06)

5. [History, rollback, git revert](05-rollback-history.md)
6. [Лаба: откат ревизии](06-lab-rollback.md)

### Источники и экосистема (07–09)

7. [Kustomize и Helm в source](07-kustomize-helm.md)
8. [Flux CD vs Argo CD](08-flux-vs-argo.md)
9. [Split CI/CD с GitLab](09-split-ci-cd.md)

### Финал (10)

10. [Финальный проект: root + staging/prod apps](10-final-project.md)

## Связанные материалы

| Курс | Связь |
|------|--------|
| [gitlab-advanced/12-lab](../gitlab-advanced/12-lab-split-ci-cd.md) | bump image в gitops repo |
| [kuber-advanced/27](../kuber-advanced/27-final-project.md) | capstone платформы |
| [secrets-basic/10](../secrets-basic/10-kubernetes-vault.md) | секреты в Git vs Vault |
