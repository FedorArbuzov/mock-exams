# 07. Kustomize и Helm в source

## Plain path

`source.path: deploy/gitops/manifests/hello-gitops` — YAML как есть. Kustomize через `kustomization.yaml` в том же каталоге ([hello-gitops](../../deploy/gitops/manifests/hello-gitops/kustomization.yaml)).

## Kustomize в Argo

```yaml
source:
  repoURL: https://github.com/...
  path: deploy/gitops/manifests/hello-gitops
  # Argo обнаруживает kustomization.yaml автоматически
```

Overlays для env:

```text
manifests/hello-gitops/
  base/
  overlays/staging/
  overlays/prod/
```

Application staging → `path: .../overlays/staging`.

## Helm в Argo

```yaml
source:
  path: charts/myapp
  helm:
    valueFiles:
      - values-prod.yaml
    parameters:
      - name: replicaCount
        value: "3"
```

Repo-server выполняет `helm template`; в Git хранятся chart + values, не сгенерированный YAML (рекомендуется).

## Сравнение

| | Kustomize | Helm |
|---|-----------|------|
| Шаблоны | patches, bases | Go templates |
| Экосистема | K8s-native | charts hub |
| В курсе mock-exams | hello-gitops, sync-waves | kuber-intermediate/07 |

## Чек-лист

- Когда не коммитить rendered YAML?
- Как staging и prod делят один chart?

Следующий урок: [08-flux-vs-argo.md](08-flux-vs-argo.md).
