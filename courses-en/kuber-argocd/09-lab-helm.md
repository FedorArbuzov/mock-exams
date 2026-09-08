# 09. Lab: Helm Application

## Goal

Sync the **`charts/shop`** Helm chart from Git into **`lab-argocd-helm`** with `values-staging.yaml`.

## Prerequisites

- Argo CD installed  
- `charts/shop` **pushed** to your gitops repo (includes `values-staging.yaml`)

## Task 1. Apply the Application

```bash
sed "s|YOUR_GITOPS_REPO|$GITOPS_REPO|" \
  courses-en/kuber-argocd/examples/argocd/application-shop-helm.yaml \
  | kubectl apply -f -
```

Application name **`shop-helm`** becomes the Helm **release name**, so the Deployment is named **`shop-helm`**.

## Task 2. Confirm render

```bash
kubectl -n argocd get application shop-helm
kubectl -n lab-argocd-helm get deploy,svc,cm,pods
```

```bash
kubectl -n lab-argocd-helm get cm shop-helm -o jsonpath="{.data.index\.html}"
# should contain <h1>staging</h1>
```

UI → **shop-helm** → **Manifest** (or **Diff**) — Helm-rendered YAML, not the chart templates.

## Task 3. Change Git, watch sync

In the gitops repo, edit `charts/shop/values-staging.yaml` — set `message: "staging-v2"` — commit and push. Refresh the Application. ConfigMap HTML should update (Pod may restart because the volume is a ConfigMap).

## Success criteria

- [ ] Application `shop-helm` Synced  
- [ ] Namespace `lab-argocd-helm`  
- [ ] Deployment `shop-helm` Ready  
- [ ] ConfigMap shows the staging message  
- [ ] Interactive Check passes  

## If it fails

| Symptom | Try |
|---------|-----|
| Helm template error | `values-staging.yaml` must sit next to `Chart.yaml` |
| Deployment name is `shop` | Release name = Application name `shop-helm` |
| Empty namespace | wait / Sync; `CreateNamespace=true` |

Leave this Application; later labs use other namespaces.

Next: [10. AppProject and ApplicationSet](10-appset-projects.md).
