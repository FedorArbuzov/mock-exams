# 14. Final project: shop from Git

## Story

**Nimbus Shop** must ship from Git only. Platform wants:

- Helm chart `charts/shop` as the source of truth  
- Namespace **`lab-argocd-final`**  
- Application **`shop-final`** with auto-sync, prune, selfHeal  
- Values file **`values-final.yaml`** (`message: nimbus-shop`, `replicaCount: 2`)  
- A **tag bump in Git** (not `kubectl set image`) as the “release”  
- Rollback via **`git revert`** (or revert the values commit)

CI still **builds images**; it does not `kubectl apply`. For this stand you only change **values in Git**.

## Stand

[ENVIRONMENT.md](ENVIRONMENT.md) — Argo CD installed. AppProject **`shop`** from [lab 11](11-lab-appset.md) (apply `appproject-shop.yaml` if you skipped that lab).

## Fixed values

| Item | Value |
|------|--------|
| Application | `shop-final` in `argocd` |
| Project | `shop` |
| Namespace | `lab-argocd-final` |
| Path | `charts/shop` |
| Helm valueFiles | `values-final.yaml` |
| Deployment name | `shop-final` (release name = Application name) |
| Replicas | **2** |

## Suggested layout (gitops repo)

```text
charts/shop/
  Chart.yaml
  values.yaml
  values-final.yaml
  templates/...
```

Start from [examples/](examples/README.md). Copy `application-final.yaml`, replace `YOUR_GITOPS_REPO`.

## Requirements

1. **AppProject** `shop` allows destination `lab-argocd-final`.  
2. **Application** `shop-final` — automated prune + selfHeal, `CreateNamespace=true`.  
3. **Deployment** `shop-final` Ready with **2** replicas.  
4. ConfigMap HTML contains **`nimbus-shop`**.  
5. **Release drill:** change `message` (or `image.tag`) in `values-final.yaml`, push, wait for sync.  
6. **Rollback drill:** `git revert` that commit, push, confirm the old message is back.

## Verification

```bash
kubectl -n argocd get application shop-final
kubectl -n lab-argocd-final get deploy shop-final
kubectl -n lab-argocd-final get cm shop-final -o jsonpath="{.data.index\.html}"; echo

# drift should not last
kubectl -n lab-argocd-final scale deploy/shop-final --replicas=1
# wait — selfHeal → 2
```

Interactive Check on this lesson.

### Manual rubric

- [ ] UI Diff is empty when Synced  
- [ ] No `kubectl apply -f` of shop manifests (only the Application CR)  
- [ ] Revert in Git restores previous values  

## Bonus

- Point `image.tag` at a digest you built in [`gitlab-cicd`](../gitlab-cicd/README.md)  
- Add a Kustomize overlay instead of Helm values (not required)  
- Write 5 bullets: **why CI must not kubectl apply** the same objects  

## Demo script (5 min)

1. UI: Application `shop-final` Synced / Healthy  
2. `kubectl -n lab-argocd-final get deploy shop-final` — 2/2  
3. Show `values-final.yaml` in Git  
4. Scale to 1 → selfHeal back to 2  
5. Interactive Check pass  

## Self-check

- [ ] Where does a production image tag change belong — CI commit to gitops, or `kubectl set image`?  
- [ ] App-of-apps vs ApplicationSet — which did you use here?  
- [ ] What breaks if this Application and a GitLab `kubectl apply` job share the Deployment?  

Optional next (secrets without Git): [15. Vault Injector](15-optional-vault-inject.md). Skip cleanup if you continue — Argo must stay installed.

## Cleanup

Only when you are **done** with optional 15 (or you skip 15). Commands: [15 cleanup](15-optional-vault-inject.md#cleanup-end-of-the-whole-course) or [ENVIRONMENT.md](ENVIRONMENT.md).
