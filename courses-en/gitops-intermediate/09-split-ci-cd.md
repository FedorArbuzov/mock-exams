# 09. Split CI/CD with GitLab

## Separation of responsibilities

| | CI (GitLab) | CD (Argo CD) |
|---|-------------|--------------|
| Build image | yes | no |
| Unit/E2E test | yes | no |
| SAST/Trivy | yes | no |
| `kubectl apply` | **no** | sync from Git |
| Rollback prod | bump tag in the gitops repo | sync / revert |

Full text: [gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md).

## The bump-tag flow

```yaml
bump-gitops:
  stage: deploy
  script:
    - git clone "$GITOPS_REPO_URL" gitops
    - cd gitops/apps/hello-ci
    - yq -i '.image.tag = strenv(CI_COMMIT_SHA)' values.yaml
    - git commit -am "ci: bump $CI_COMMIT_SHA"
    - git push
```

Argo on `apps/hello-ci` picks up the commit.

## Monorepo vs gitops repo

| Model | Upside |
|--------|------|
| Monorepo (`deploy/` in the app) | simpler for the mock-exams learning projects |
| Separate gitops repo | clean permissions, separate lifecycle |

In mock-exams: `deploy/gitops` in the same repo — enough for the course; at work it is often a separate repo.

## Argo CD Image Updater

Auto-bumps the tag from the registry without a CI commit — convenient, but configure the **digest** and policy review deliberately.

## Lab in gitlab-advanced

[12-lab-split-ci-cd.md](../gitlab-advanced/12-lab-split-ci-cd.md) — after completing intermediate.

## Checklist

- Why shouldn't CI run `kubectl apply` on prod?
- Image digest vs tag in gitops?

Final: [10-final-project.md](10-final-project.md).
