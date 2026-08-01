# 11. GitLab CI + Argo CD: separating CI and CD

## Real-world scenario

The platform team adopted Argo CD. The application's DevOps engineer **still** keeps `kubectl apply` in GitLab CI "for speed." A week later the Argo UI is red: **OutOfSync**. The HPA was changed manually — Argo selfHeal reverted it. CI applies again — an endless war between two sources of truth.

**Solution:** a clear separation of **CI (GitLab)** and **CD (Argo CD)**. The central idea of phase 4 and [gitops-intermediate](../gitops-intermediate/README.md).

---

## What you'll learn

- The split CI/CD principle and areas of responsibility.
- The pattern for bumping gitops from CI.
- Argo Application and anti-patterns.
- Staging vs production and Image Updater trade-offs.

---

## The separation principle

| | CI (GitLab) | CD (Argo CD) |
|---|-------------|--------------|
| **Responsibility** | compile, test, scan, build image | deploy, sync, health, rollback |
| **Artifact** | Docker image + git commit to gitops | Git as the desired state |
| **Trigger** | push, MR, schedule | a change in the gitops repo |
| **Tool** | `.gitlab-ci.yml` | Application CR |
| **Cluster write** | **no** *(target model)* | yes, via the controller |

```text
App repo (GitLab CI) ──build/push──► Container Registry
         │ bump tag/commit
         ▼
GitOps repo ──watch/sync──► Argo CD ──► Kubernetes
```

---

## Why a separate gitops repo

| Reason | Explanation |
|---------|-----------|
| RBAC | App devs don't change prod manifests |
| Audit | Every deploy = a git commit |
| Rollback | `git revert` + Argo sync |
| Blast radius | The CI token doesn't need cluster admin |
| Multi-cluster | One chart, values per env |

A monorepo `deploy/gitops` in mock-exams is acceptable — [`deploy/gitops`](../../deploy/gitops/README.md).

---

## Updating the gitops repo from CI

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

A deploy token or `CI_JOB_TOKEN` with write access to the gitops project.

### Image tag vs digest

| | Tag (`sha`) | Digest |
|---|-------------|--------|
| Readability | high | low |
| Immutability | a tag can be overwritten | immutable |
| GitOps | usually tag | highest security |

Recommendation: tag = `CI_COMMIT_SHA` + a registry immutable tags policy.

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

Installation: [kuber-advanced/16-argocd.md](../kuber-advanced/16-argocd.md), [17-lab-argocd.md](../kuber-advanced/17-lab-argocd.md).

---

## Argo CD Image Updater

```yaml
metadata:
  annotations:
    argocd-image-updater.argoproj.io/image-list: hello=registry.example.com/platform/hello-ci
    argocd-image-updater.argoproj.io/hello.update-strategy: newest-build
```

**Trade-off:** less CI glue, one more component. For mock-exams — an **explicit bump in CI** (more transparent for auditing).

---

## Environments: staging vs production

```text
merge main → bump staging → Argo auto-sync staging
manual approval → bump production → Argo sync prod
```

GitLab `environment: production` + `when: manual` on the bump job, not on `kubectl`.

---

## Anti-patterns

| Anti-pattern | Consequence |
|-------------|-------------|
| `kubectl apply` + Argo on the same manifests | Drift, OutOfSync |
| CI changes live objects | SelfHeal reverts |
| GitOps repo without review | prod commit without an MR |
| Latest tag in values | unclear what's in prod |

Choose **one** CD mechanism. CI ends at a **git commit** to gitops.

---

## Relation to the GitOps courses

| Course | Topic |
|------|------|
| [gitops-basic](../gitops-basic/README.md) | Desired state |
| [gitops-intermediate/09](../gitops-intermediate/09-split-ci-cd.md) | Split pattern |
| [kuber-advanced/16](../kuber-advanced/16-argocd.md) | Argo components |
| [deploy/gitops](../../deploy/gitops/README.md) | Stand |

---

## Security in the split model

- CI job token — write only to the gitops repo
- Argo repo credentials read-only on app repos
- Container scan **before** bump
- OIDC AWS for terraform infra separate from app CD

---

## Observability

Argo UI: Sync, Health, History. Alert on `Degraded` / `OutOfSync` — [kuber-advanced/14-observability](../kuber-advanced/14-observability.md).

**GitLab pipeline success ≠ deploy success** — check Argo after a bump.

---

## Self-check

1. Who owns the desired state?
2. Why a separate gitops repo?
3. Image tag vs digest?
4. Why can't you use kubectl and Argo?
5. Image Updater vs CI bump?

---

## Summary

GitLab CI produces a **verified artifact** and updates the **git declaration**; Argo CD is the only writer to the cluster. Lab: [12-lab-split-ci-cd.md](12-lab-split-ci-cd.md).
