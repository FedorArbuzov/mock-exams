# 15. Optional: Vault Injector after GitOps

Argo CD does **not** deliver passwords. It syncs YAML. The password stays in Vault; Git only has **annotations** and a ServiceAccount.

```text
Git: Deployment + vault.hashicorp.com/* annotations
        │  Argo sync
        ▼
   Pod created  →  Injector mutates it
        │  Agent logs into Vault (Kubernetes auth)
        ▼
   /vault/secrets/db   ←  not in Git, not a Kubernetes Secret you wrote
```

This page is **one loop** for interviews. The full Vault course is [`kuber-vault`](../kuber-vault/README.md).

**Time:** ~1–1.5 h. **RAM:** keep Argo; give Docker **8 GB** if you can. Delete leftover Applications from earlier labs if pods sit Pending.

Paste **one command per line**. PowerShell does not treat `\` as a line break.

## Prerequisites

- Argo CD still installed ([03](03-lab-install.md)). **Do not** run the cleanup in [14](14-final-project.md) yet.
- Public `gitops-lab` from [05](05-lab-first-app.md)
- Helm 3

## Task 1. Helm: Vault dev + Injector

```powershell
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update
```

If `unexpected EOF`, retry or `$env:GODEBUG = "http2client=0"` (same class of failure as the Argo repo).

```powershell
helm upgrade --install vault hashicorp/vault --namespace vault --create-namespace --set server.dev.enabled=true --set server.dev.devRootToken=root --set injector.enabled=true --set csi.enabled=false
```

```powershell
kubectl -n vault get pods -w
```

Wait until `vault-0` and `vault-agent-injector-*` are Ready. Ctrl+C.

Dev mode: data in memory, token `root`. Fine for a laptop, not production.

## Task 2. Bootstrap Vault (not Git)

These commands run **inside** `vault-0`. Ignore `path is already in use` if you already ran [`kuber-vault`](../kuber-vault/README.md).

KV (often already on in dev):

```powershell
kubectl -n vault exec vault-0 -- vault secrets enable -path=secret kv-v2
kubectl -n vault exec vault-0 -- vault kv put secret/shop/db password=shop-pass-2026 user=shop
```

Policy:

```powershell
@"
path "secret/data/shop/*" {
  capabilities = ["read"]
}
path "secret/metadata/shop/*" {
  capabilities = ["read", "list"]
}
"@ | kubectl -n vault exec -i vault-0 -- vault policy write shop-vault -
```

Kubernetes auth + role bound to SA `shop-vault` in `lab-argocd-vault`. Single quotes keep `$(cat …)` for the **container** shell, not PowerShell:

```powershell
kubectl -n vault exec vault-0 -- vault auth enable kubernetes
kubectl -n vault exec vault-0 -- sh -c 'vault write auth/kubernetes/config kubernetes_host="https://kubernetes.default.svc:443" token_reviewer_jwt="$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt disable_iss_validation=true'
kubectl -n vault exec vault-0 -- vault write auth/kubernetes/role/shop-vault bound_service_account_names=shop-vault bound_service_account_namespaces=lab-argocd-vault policies=shop-vault ttl=1h
```

There is still **no** password in Git.

## Task 3. Workload YAML in Git

In `~/gitops-lab` create **`apps/shop-vault/app.yaml`**. No `password` field. Do **not** `kubectl apply` this file.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: shop-vault
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shop-vault
  labels:
    app: shop-vault
spec:
  replicas: 1
  selector:
    matchLabels:
      app: shop-vault
  template:
    metadata:
      labels:
        app: shop-vault
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "shop-vault"
        vault.hashicorp.com/agent-inject-secret-db: "secret/data/shop/db"
        vault.hashicorp.com/agent-inject-template-db: |
          {{- with secret "secret/data/shop/db" -}}
          password={{ .Data.data.password }}
          user={{ .Data.data.user }}
          {{- end -}}
    spec:
      serviceAccountName: shop-vault
      containers:
        - name: app
          image: busybox:1.36
          command: ["sh", "-c", "while true; do echo alive; sleep 30; done"]
```

```powershell
Set-Location $HOME\gitops-lab
git add apps/shop-vault
git commit -m "lab: shop-vault annotations only"
git push
```

Confirm the website does **not** contain `shop-pass-2026`.

## Task 4. Application CR (local)

Create **`~/kuber-argocd/shop-vault.yaml`**. Put **your** HTTPS URL in `repoURL`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: shop-vault
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOU/gitops-lab.git
    targetRevision: HEAD
    path: apps/shop-vault
  destination:
    server: https://kubernetes.default.svc
    namespace: lab-argocd-vault
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

```powershell
kubectl apply -f $HOME\kuber-argocd\shop-vault.yaml
```

```powershell
kubectl -n argocd get application shop-vault
kubectl -n lab-argocd-vault get deploy,sa,pods
```

Expect an init container `vault-agent-init` (and often a `vault-agent` sidecar). The `app` container is Ready when inject succeeded.

## Task 5. Prove the file, not Git

```powershell
$pod = kubectl -n lab-argocd-vault get pod -l app=shop-vault -o jsonpath="{.items[0].metadata.name}"
kubectl -n lab-argocd-vault exec $pod -c app -- cat /vault/secrets/db
```

You should see `password=shop-pass-2026`. That string is **not** in the gitops repo.

```powershell
kubectl -n lab-argocd-vault get secret
```

No Secret you created for the DB password. Injector wrote a file into the Pod.

## Success criteria

- [ ] `vault-0` and injector Ready  
- [ ] Application `shop-vault` Synced  
- [ ] Deployment `shop-vault` Ready  
- [ ] `/vault/secrets/db` has the password  
- [ ] Git has annotations, not `shop-pass-2026`  
- [ ] Interactive Check passes  

## If it fails

| Symptom | Try |
|---------|-----|
| Injector / `vault-0` Pending | Raise Docker RAM; delete unused lab namespaces |
| Pod stuck `Init: vault-agent-init` | Role name, SA name, namespace must match Task 2; `kubectl -n lab-argocd-vault logs <pod> -c vault-agent-init` |
| `permission denied` in Agent logs | policy path `secret/data/shop/*`; KV put was `secret/shop/db` |
| ComparisonError | public HTTPS repo, path `apps/shop-vault` |
| File missing, Pod Running | annotations on the **Pod template**, not only Deployment metadata |

## Interview line

«Argo syncs the Deployment. Vault Agent Injector injects the file. Git never had the password.»

The more common GitOps pattern is **External Secrets** — do that next: [16](16-optional-eso.md). Keep Vault and Argo installed. Table-only comparison: [`kuber-vault` 10](../kuber-vault/10-delivery-patterns.md).

## Cleanup

Only when you skip 16. If you continue, **do not** uninstall Vault/Argo. Full teardown is at the end of [16](16-optional-eso.md).
