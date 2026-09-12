# 16. Optional: External Secrets (the common GitOps answer)

Lesson 15 put the password in a **file inside the Pod**. Teams more often use **External Secrets Operator (ESO)**: Git has a *reference*, ESO writes a normal Kubernetes `Secret`, the app uses `envFrom` as usual.

```text
Git: SecretStore + ExternalSecret   ←  no password
        │  Argo sync
        ▼
   ESO  →  Vault (same vault-0, same KV)
        ▼
   Secret shop-eso-db               ←  lives in etcd
        ▼
   Pod envFrom
```

Argo still does not know the password. ESO does the fetch. Vault still decides **who** may read (`role` + `policy` + SA), same as Injector.

**Time:** ~45–75 min. Vault from [15](15-optional-vault-inject.md) must stay up. Docker **8 GB**.

Paste **one command per line**.

## Prerequisites

- [15](15-optional-vault-inject.md) done: `vault-0` Ready, `secret/shop/db` = `shop-pass-2026`, Kubernetes auth on, policy `shop-vault`
- Argo CD still installed
- Same public `gitops-lab`

If Vault was deleted, redo 15 tasks 1–2, then come here. You do **not** need the Injector app to keep running.

## Task 1. Helm: ESO

```powershell
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
```

If `unexpected EOF`, retry or `$env:GODEBUG = "http2client=0"`.

```powershell
helm upgrade --install external-secrets external-secrets/external-secrets --namespace external-secrets --create-namespace
```

```powershell
kubectl -n external-secrets get pods -w
```

Wait until `external-secrets`, `external-secrets-cert-controller`, `external-secrets-webhook` are Ready. Ctrl+C.

```powershell
kubectl get crd | findstr externalsecrets
```

You should see `externalsecrets.external-secrets.io` and `secretstores.external-secrets.io`.

## Task 2. Vault role for a **different** SA

Reuse policy `shop-vault` (path `secret/data/shop/*`). New role: only SA `shop-eso` in `lab-argocd-eso`.

```powershell
kubectl -n vault exec vault-0 -- vault write auth/kubernetes/role/shop-eso bound_service_account_names=shop-eso bound_service_account_namespaces=lab-argocd-eso policies=shop-vault ttl=1h
```

The Injector app (`shop-vault` / `lab-argocd-vault`) **cannot** use this role. That is the isolation story again.

## Task 3. YAML in Git (still no password)

In `~/gitops-lab` create **`apps/shop-eso/app.yaml`**. Do **not** `kubectl apply`.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: shop-eso
---
apiVersion: external-secrets.io/v1
kind: SecretStore
metadata:
  name: vault-backend
spec:
  provider:
    vault:
      server: "http://vault.vault.svc:8200"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "shop-eso"
          serviceAccountRef:
            name: "shop-eso"
---
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: shop-eso-db
spec:
  refreshInterval: 1m
  secretStoreRef:
    kind: SecretStore
    name: vault-backend
  target:
    name: shop-eso-db
    creationPolicy: Owner
  data:
    - secretKey: password
      remoteRef:
        key: shop/db
        property: password
    - secretKey: user
      remoteRef:
        key: shop/db
        property: user
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shop-eso
  labels:
    app: shop-eso
spec:
  replicas: 1
  selector:
    matchLabels:
      app: shop-eso
  template:
    metadata:
      labels:
        app: shop-eso
    spec:
      serviceAccountName: shop-eso
      containers:
        - name: app
          image: busybox:1.36
          command: ["sh", "-c", "while true; do echo $DB_PASSWORD; sleep 30; done"]
          env:
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: shop-eso-db
                  key: password
```

`remoteRef.key` is `shop/db` — the path **after** the KV mount `secret`. Not `secret/data/shop/db` (that form is Injector).

```powershell
Set-Location $HOME\gitops-lab
git add apps/shop-eso
git commit -m "lab: ExternalSecret reference only"
git push
```

Git must not contain `shop-pass-2026`.

## Task 4. Application CR (local)

Create **`~/kuber-argocd/shop-eso.yaml`**. Your HTTPS URL in `repoURL`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: shop-eso
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOU/gitops-lab.git
    targetRevision: HEAD
    path: apps/shop-eso
  destination:
    server: https://kubernetes.default.svc
    namespace: lab-argocd-eso
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

```powershell
kubectl apply -f $HOME\kuber-argocd\shop-eso.yaml
```

First sync can be `Progressing`: SecretStore exists before the SA token works, or the Pod waits for the Secret. Wait a minute, Refresh if needed.

```powershell
kubectl -n argocd get application shop-eso
kubectl -n lab-argocd-eso get secretstore,externalsecret,secret,deploy,pods
```

`SecretStore` / `ExternalSecret` should become **Valid** / **SecretSynced**.

## Task 5. Prove Secret, not Git

```powershell
kubectl -n lab-argocd-eso get secret shop-eso-db -o jsonpath="{.data.password}"
```

That is **base64**. Decode:

```powershell
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String((kubectl -n lab-argocd-eso get secret shop-eso-db -o jsonpath="{.data.password}")))
```

Expect `shop-pass-2026`. Anyone with `get secret` in this namespace can read it — that is the ESO trade-off (etcd).

```powershell
$pod = kubectl -n lab-argocd-eso get pod -l app=shop-eso -o jsonpath="{.items[0].metadata.name}"
kubectl -n lab-argocd-eso exec $pod -c app -- printenv DB_PASSWORD
```

## Success criteria

- [ ] ESO pods Ready  
- [ ] Application `shop-eso` Synced  
- [ ] Secret `shop-eso-db` exists (ESO created it)  
- [ ] Decoded password is `shop-pass-2026`  
- [ ] Git has `ExternalSecret`, not the password  
- [ ] Interactive Check passes  

## If it fails

| Symptom | Try |
|---------|-----|
| `no matches for kind ExternalSecret` | Helm did not install CRDs; wait, or re-run Task 1 |
| SecretStore `Invalid` / login denied | Role `shop-eso`, SA name, namespace `lab-argocd-eso`; `kubectl -n lab-argocd-eso describe secretstore vault-backend` |
| ExternalSecret `SecretSyncedError` | key `shop/db` + property `password`; Vault `kv get secret/shop/db` |
| Pod `CreateContainerConfigError` | Secret not synced yet — wait; do not `kubectl create secret` by hand |
| `v1` vs `v1beta1` | this lab uses `external-secrets.io/v1` (current chart). If apply fails, `kubectl api-resources \| findstr externalsecret` |

## Interview lines

- Injector: file in the Pod, no Secret you created, harder for `envFrom`.  
- **ESO (more common):** Git has the pointer; cluster has a Secret; Vault still gates the SA.  
- Same isolation: wrong SA → Vault denies, ESO cannot fill the Secret.

## Cleanup (end of the whole course)

```powershell
kubectl -n argocd delete applicationset,application,appproject --all
helm uninstall argocd -n argocd
helm uninstall vault -n vault
helm uninstall external-secrets -n external-secrets
kubectl delete namespace argocd vault external-secrets lab-argocd lab-argocd-helm lab-argocd-staging lab-argocd-prod lab-argocd-fix lab-argocd-final lab-argocd-vault lab-argocd-eso --ignore-not-found
```
