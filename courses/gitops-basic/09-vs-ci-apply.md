# 09. GitOps vs kubectl apply в CI

## Два подхода к CD

| | GitOps (Argo/Flux) | Imperative CI |
|---|---------------------|----------------|
| Триггер deploy | commit в gitops repo | job `kubectl apply` |
| Аудит | git history | лог job (хуже связь с YAML) |
| Drift | виден в UI | часто незаметен |
| Rollback | revert + sync | повторный apply старого YAML |

## Правильный split

```text
App repo (GitLab CI)  →  build/test/push image
                      →  commit нового tag в gitops repo

GitOps repo           →  Argo CD sync
```

Подробнее: [gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md), лаба [12](../gitlab-advanced/12-lab-split-ci-cd.md).

## Антипаттерны

- CI пишет в кластер **и** Argo читает те же файлы — гонки.
- Секреты в plain text в Git.
- `kubectl set image` на prod без коммита — drift.

## Helm в CI vs в Argo

| Вариант | Где `helm template` |
|---------|---------------------|
| Argo `source.helm` | repo-server Argo |
| CI рендерит и коммитит YAML | CI (хуже для drift review) |

Рекомендация курса: **Helm/Kustomize в source Argo**, CI только меняет `values` или image tag.

## Чек-лист

- Кто владеет desired state для production?
- Почему image tag лучше коммитить в gitops, а не в ConfigMap вручную?

Финал: [10-final-project.md](10-final-project.md).
