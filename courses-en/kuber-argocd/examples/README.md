# kuber-argocd examples

**Reference copies** of the YAML you type in the labs. Do not copy these into Git as the lab shortcut — [05](../05-lab-first-app.md) and later labs have you create the files.

| Path | Purpose |
|------|---------|
| [apps/hello/](apps/hello/) | Plain Deployment + Service (labs 05, 07, 13) |
| [charts/shop/](charts/shop/) | Tiny Helm chart (labs 09, 11, 14) |
| [argocd/application-hello.yaml](argocd/application-hello.yaml) | First Application (lives in `~/kuber-argocd`, not in Git) |
| [argocd/application-shop-helm.yaml](argocd/application-shop-helm.yaml) | Helm source |
| [argocd/appproject-shop.yaml](argocd/appproject-shop.yaml) | AppProject for env labs |
| [argocd/applicationset-shop.yaml](argocd/applicationset-shop.yaml) | List generator → staging + prod |
| [argocd/application-broken.yaml](argocd/application-broken.yaml) | Wrong `path` — troubleshooting lab |
| [argocd/application-final.yaml](argocd/application-final.yaml) | Final project Application |

Optional [15](../15-optional-vault-inject.md) / [16](../16-optional-eso.md): type `apps/shop-vault` and `apps/shop-eso` yourself — no example password YAML.

Do **not** commit `argocd/*.yaml` into the gitops repo unless you later adopt app-of-apps. The chicken-and-egg bootstrap is `kubectl apply` of the Application CR.
