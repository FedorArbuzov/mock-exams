# 09. GitOps vs kubectl apply in CI

## Two approaches to CD

| | GitOps (Argo/Flux) | Imperative CI |
|---|---------------------|----------------|
| Deploy trigger | commit to gitops repo | job `kubectl apply` |
| Audit | git history | job log (weaker link to YAML) |
| Drift | visible in UI | often unnoticed |
| Rollback | revert + sync | re-apply old YAML |

## Correct split

```text
App repo (GitLab CI)  →  build/test/push image
                      →  commit new tag to gitops repo

GitOps repo           →  Argo CD sync
```

Details: [gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md), lab [12](../gitlab-advanced/12-lab-split-ci-cd.md).

## Anti-patterns

- CI writes to the cluster **and** Argo reads the same files — races.
- Secrets in plain text in Git.
- `kubectl set image` on prod without a commit — drift.

## Helm in CI vs in Argo

| Approach | Where `helm template` runs |
|----------|----------------------------|
| Argo `source.helm` | Argo repo-server |
| CI renders and commits YAML | CI (worse for drift review) |

Course recommendation: **Helm/Kustomize in Argo source**; CI only changes `values` or the image tag.

## Checklist

- Who owns desired state for production?
- Why is it better to commit the image tag to gitops than set it manually in a ConfigMap?

Final: [10-final-project.md](10-final-project.md).
