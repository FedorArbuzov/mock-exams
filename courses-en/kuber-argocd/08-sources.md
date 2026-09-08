# 08. Directory, Helm, and Kustomize as source

## Three ways `path` is rendered

repo-server clones `targetRevision`, then:

| Layout in Git | What Argo does |
|---------------|----------------|
| Loose YAML | `kubectl apply` equivalent of those files |
| `Chart.yaml` in `path` | `helm template` (Helm source) |
| `kustomization.yaml` in `path` | `kustomize build` |

If both Chart.yaml and kustomization.yaml exist, you must be explicit — don’t do that in labs.

## Directory (lesson 05)

```yaml
source:
  repoURL: https://github.com/YOU/gitops-lab.git
  targetRevision: HEAD
  path: apps/hello
```

Good for tiny apps and for learning Diff. Painful when you need the same app in five environments.

## Helm

```yaml
source:
  path: charts/shop
  helm:
    valueFiles:
      - values-staging.yaml
    # parameters:
    #   - name: replicaCount
    #     value: "2"
```

- Chart + values stay in Git; **do not** commit rendered YAML as the source of truth.  
- `valueFiles` are **relative to `path`**.  
- `helm.parameters` override like `--set` (use sparingly — they hide from `values-*.yaml` review).

Release name defaults to the **Application name**. Our shop templates use `{{ .Release.Name }}` for Deployment/Service, so Application `shop-helm` → Deployment `shop-helm`.

## Kustomize (no extra lab)

```yaml
source:
  path: apps/hello/overlays/prod
```

Overlays per env: `base/` + `overlays/staging` + `overlays/prod`. Same idea as Helm `valueFiles`, different tool. You already practiced overlays in [`helm-charts`](../helm-charts/README.md) / [`kuber-intermediate`](../kuber-intermediate/README.md).

## Multi-source Applications

One Application can list several `sources` (Helm chart + extra YAML). Powerful and easy to make undebuggable. This course stays on **one source**.

## Hooks vs Argo

Helm `pre-install` Jobs run inside Helm’s lifecycle. Argo has **resource hooks** (`argocd.argoproj.io/hook: PreSync`). Prefer **one** mechanism. For this stand, skip hooks unless a lesson says otherwise.

## Checklist

- [ ] Who runs `helm template` — you or repo-server?  
- [ ] Why keep values in Git instead of `helm.parameters` for every knob?  
- [ ] Directory vs Helm — when is a directory enough?  

Next lab: [09. Lab: Helm Application](09-lab-helm.md).
