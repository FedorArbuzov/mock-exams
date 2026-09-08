# 11. Lab: staging + prod with ApplicationSet

## Goal

Create AppProject **`shop`**, then an ApplicationSet that generates **`shop-staging`** and **`shop-prod`** from the same chart.

## Prerequisites

- `charts/shop` plus `values-staging.yaml` and `values-prod.yaml` in your gitops repo  
- Argo CD installed  

## Task 1. AppProject

```bash
kubectl apply -f courses-en/kuber-argocd/examples/argocd/appproject-shop.yaml
kubectl -n argocd get appproject shop
```

## Task 2. ApplicationSet

```bash
sed "s|YOUR_GITOPS_REPO|$GITOPS_REPO|" \
  courses-en/kuber-argocd/examples/argocd/applicationset-shop.yaml \
  | kubectl apply -f -
```

```bash
kubectl -n argocd get applicationset shop-envs
kubectl -n argocd get application
# shop-staging, shop-prod
```

## Task 3. Workloads

```bash
kubectl -n lab-argocd-staging get deploy,pods
kubectl -n lab-argocd-prod get deploy,pods
```

Prod values set `replicaCount: 2` — **`shop-prod`** should show **2** Ready replicas.

```bash
kubectl -n lab-argocd-staging get cm shop-staging -o jsonpath="{.data.index\.html}"; echo
kubectl -n lab-argocd-prod get cm shop-prod -o jsonpath="{.data.index\.html}"; echo
```

Expect `staging` vs `prod` in the HTML.

## Task 4. One Git change, two apps

Edit `charts/shop/templates/configmap.yaml` (e.g. add `<p>gitops</p>`), push. **Both** Applications should pick it up (same chart path). Refresh if needed.

Do **not** delete the ApplicationSet until the end of the course (or the final project).

## Success criteria

- [ ] AppProject `shop` exists  
- [ ] ApplicationSet `shop-envs` exists  
- [ ] Applications `shop-staging` and `shop-prod` Synced  
- [ ] Deployments Ready in both namespaces  
- [ ] Interactive Check passes  

## If it fails

| Symptom | Try |
|---------|-----|
| Applications not created | `kubectl -n argocd describe applicationset shop-envs` |
| Permission denied destination | AppProject destinations must include those namespaces |
| Helm values missing | files named `values-staging.yaml` / `values-prod.yaml` under `charts/shop` |
| `{{env}}` not substituted | list generator keys must match placeholders |

Next: [12. Troubleshooting](12-troubleshooting.md).
