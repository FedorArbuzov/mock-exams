# kuber-argocd examples

Copy **`apps/`** and **`charts/`** into **your public Git repo** (see [ENVIRONMENT.md](../ENVIRONMENT.md)).  
Apply **`argocd/`** YAMLs **on the cluster** after replacing `YOUR_GITOPS_REPO`.

| Path | Purpose |
|------|---------|
| [apps/hello/](apps/hello/) | Plain Deployment + Service (labs 05, 07, 13) |
| [charts/shop/](charts/shop/) | Tiny Helm chart (labs 09, 11, 14) |
| [argocd/application-hello.yaml](argocd/application-hello.yaml) | First Application |
| [argocd/application-shop-helm.yaml](argocd/application-shop-helm.yaml) | Helm source |
| [argocd/appproject-shop.yaml](argocd/appproject-shop.yaml) | AppProject for env labs |
| [argocd/applicationset-shop.yaml](argocd/applicationset-shop.yaml) | List generator → staging + prod |
| [argocd/application-broken.yaml](argocd/application-broken.yaml) | Wrong `path` — troubleshooting lab |
| [argocd/application-final.yaml](argocd/application-final.yaml) | Final project Application |

Do **not** commit `argocd/*.yaml` into the gitops repo unless you later adopt app-of-apps. The chicken-and-egg bootstrap is `kubectl apply` of the Application CR.
