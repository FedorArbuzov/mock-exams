# 07. Kustomize and Helm as source

## Plain path

`source.path: deploy/gitops/manifests/hello-gitops` — YAML as is. Kustomize via a `kustomization.yaml` in the same directory ([hello-gitops](../../deploy/gitops/manifests/hello-gitops/kustomization.yaml)).

## Kustomize in Argo

```yaml
source:
  repoURL: https://github.com/...
  path: deploy/gitops/manifests/hello-gitops
  # Argo detects kustomization.yaml automatically
```

Overlays per env:

```text
manifests/hello-gitops/
  base/
  overlays/staging/
  overlays/prod/
```

Application staging → `path: .../overlays/staging`.

## Helm in Argo

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

The repo-server runs `helm template`; Git stores the chart + values, not the generated YAML (recommended).

## Comparison

| | Kustomize | Helm |
|---|-----------|------|
| Templating | patches, bases | Go templates |
| Ecosystem | K8s-native | charts hub |
| In the mock-exams course | hello-gitops, sync-waves | kuber-intermediate/07 |

## Checklist

- When should you not commit rendered YAML?
- How do staging and prod share one chart?

Next lesson: [08-flux-vs-argo.md](08-flux-vs-argo.md).
