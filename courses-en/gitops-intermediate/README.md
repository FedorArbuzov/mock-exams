# GitOps — Intermediate (app-of-apps, waves, rollback)

Continuation of [gitops-basic](../gitops-basic/README.md): **app-of-apps**, **sync waves**, **history and rollback**, Kustomize/Helm as source, a comparison with **Flux CD**, integration with **GitLab CI**.

**Prerequisites:** completed basic or [kuber-advanced/17](../kuber-advanced/17-lab-argocd.md). Cluster: `mockctl up`, Argo CD from [`deploy/gitops`](../../deploy/gitops/README.md).

**Stand:**

| Component | Path / namespace |
|-----------|------------------|
| Root Application | `deploy/gitops/bootstrap/root-application.yaml` → `apps/` |
| Hello app | `manifests/hello-gitops` → `gitops-demo` |
| Sync waves | `manifests/sync-waves` → `gitops-waves` |
| Flux (reference) | `examples/flux-*.yaml` — do not install alongside Argo without a plan |

**Time:** ~**8–12 h**; [final](10-final-project.md) — a platform of 2+ Applications.

## Curriculum

### App-of-apps (01–02)

1. [App-of-apps and the root Application](01-app-of-apps.md)
2. [Lab: gitops-root and child apps](02-lab-app-of-apps.md)

### Sync waves (03–04)

3. [Sync waves and resource ordering](03-sync-waves.md)
4. [Lab: ConfigMap → Deploy → Service](04-lab-sync-waves.md)

### Rollback (05–06)

5. [History, rollback, git revert](05-rollback-history.md)
6. [Lab: reverting a revision](06-lab-rollback.md)

### Sources and ecosystem (07–09)

7. [Kustomize and Helm as source](07-kustomize-helm.md)
8. [Flux CD vs Argo CD](08-flux-vs-argo.md)
9. [Split CI/CD with GitLab](09-split-ci-cd.md)

### Final (10)

10. [Final project: root + staging/prod apps](10-final-project.md)

## Related materials

| Course | Relation |
|------|--------|
| [gitlab-advanced/12-lab](../gitlab-advanced/12-lab-split-ci-cd.md) | bump image in the gitops repo |
| [kuber-advanced/27](../kuber-advanced/27-final-project.md) | platform capstone |
| [secrets-basic/10](../secrets-basic/10-kubernetes-vault.md) | secrets in Git vs Vault |
