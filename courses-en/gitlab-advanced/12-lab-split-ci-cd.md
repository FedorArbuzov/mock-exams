# 12. Lab: CI build, Argo sync

## Real-world scenario

Release manager: "Show me that the production tag in the cluster matches the git commit in the gitops repo — and that CI **didn't** call kubectl." This lab is E2E proof of the GitOps split.

Yesterday's incident: CI "deployed" v2.3, Argo shows v2.2 — because kubectl apply and Argo CD were competing. Today you remove kubectl from the pipeline.

---

## Lab goal

Remove `kubectl apply` from CI, set up a **bump gitops** after build/scan, deploy via **Argo CD** sync. E2E: merge → new image; rollback via `git revert`.

**Time:** ~150 minutes.  
**Prerequisites:** [11-gitlab-and-argocd.md](11-gitlab-and-argocd.md), [kuber-advanced/17-lab-argocd.md](../kuber-advanced/17-lab-argocd.md).

---

## Setup

- [ ] Argo CD Running in `argocd`
- [ ] App repo with `docker-build`, `container-scan`
- [ ] GitOps repo or `deploy/gitops/apps/hello-ci`
- [ ] Deploy jobs with `kubectl` from intermediate removed

```bash
kubectl get applications -n argocd
```

---

## Task 1. GitOps structure

`gitops/apps/hello-ci/values.yaml`:

```yaml
image:
  repository: registry.example.com/platform/hello-ci
  tag: "initial"
replicaCount: 1
service:
  port: 8080
```

Chart — from [`gitlab-intermediate/examples/k8s-deploy/`](../gitlab-intermediate/examples/k8s-deploy/).

---

## Task 2. Argo Application

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

## Task 3. CI is build + bump only

Remove:

```yaml
# REMOVE
deploy:
  script:
    - kubectl apply ...
```

Add:

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

Configure `CI_JOB_TOKEN` permissions for the gitops project.

---

## Task 4. E2E scenario

1. **MR** → pipeline: test, SAST, build, scan — green, **without deploy**
2. **Merge** main → `bump-gitops` → commit to gitops
3. Argo auto sync
4. Verification:

```bash
kubectl get pods -n hello-ci -o wide
kubectl get deploy hello-ci -n hello-ci -o jsonpath='{.spec.template.spec.containers[0].image}'
```

The image contains the new `CI_COMMIT_SHA`.

5. Argo UI: Revision = the latest gitops commit

---

## Task 5. Rollback

```bash
cd gitops
git revert HEAD
git push
```

Argo sync → the previous tag. **Not** `kubectl rollout undo`.

`docs/rollback.md`:

```markdown
## Production rollback
1. `git revert` bump commit in gitops repo
2. Argo auto-sync (or manual sync)
3. Verify image tag in cluster
```

---

## Task 6. Drift test

```bash
kubectl scale deployment hello-ci -n hello-ci --replicas=3
```

With `selfHeal: true`, Argo will restore `replicaCount` from git. Screenshot the Events in the UI.

---

## Task 7. Staging vs production (optional)

Two values files:

- `values-staging.yaml` — auto bump on main
- `values-production.yaml` — manual bump, `resource_group: production`

Two Argo Applications or kustomize overlays.

---

## Troubleshooting

| Symptom | Action |
|---------|----------|
| bump push 403 | Job token scope, deploy key |
| Argo OutOfSync | A manual kubectl remained |
| ImagePullBackOff | tag not in the registry |
| Sync failed | Helm template error |

---

## Success criteria

- [ ] CI does **not** call kubectl
- [ ] Argo Synced + Healthy
- [ ] New SHA in the cluster after merge
- [ ] Rollback via git revert
- [ ] `docs/rollback.md`

---

## Relation to the final project

The pattern is the core of [15-final-project.md](15-final-project.md).

---

## Summary

GitOps split: CI ends at a git commit; Argo is the only CD. Next lesson: [13-pipeline-reliability.md](13-pipeline-reliability.md).
