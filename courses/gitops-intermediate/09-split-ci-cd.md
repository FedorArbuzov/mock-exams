# 09. Split CI/CD с GitLab

## Разделение ответственности

| | CI (GitLab) | CD (Argo CD) |
|---|-------------|--------------|
| Build image | да | нет |
| Unit/E2E test | да | нет |
| SAST/Trivy | да | нет |
| `kubectl apply` | **нет** | sync из Git |
| Rollback prod | bump tag в gitops repo | sync / revert |

Полный текст: [gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md).

## Поток bump tag

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

Argo на `apps/hello-ci` подхватывает commit.

## Monorepo vs gitops repo

| Модель | Плюс |
|--------|------|
| Monorepo (`deploy/` в app) | проще для учебных проектов mock-exams |
| Отдельный gitops repo | чистые права, отдельный lifecycle |

В mock-exams: `deploy/gitops` в том же репо — достаточно для курса; на работе часто отдельный repo.

## Argo CD Image Updater

Автобамп tag из registry без CI commit — удобно, но **digest** и policy review настраивайте осознанно.

## Лаба в gitlab-advanced

[12-lab-split-ci-cd.md](../gitlab-advanced/12-lab-split-ci-cd.md) — после прохождения intermediate.

## Чек-лист

- Почему CI не должен делать `kubectl apply` на prod?
- Image digest vs tag в gitops?

Финал: [10-final-project.md](10-final-project.md).
