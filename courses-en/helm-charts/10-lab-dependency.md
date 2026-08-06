# 10. Lab: app + Bitnami PostgreSQL subchart

## Setup

```bash
cd ~/helm-work
kubectl create namespace lab-helm-deps
kubectl config set-context --current --namespace=lab-helm-deps
helm create shop
```

## Task 1. Declare a dependency

Edit `shop/Chart.yaml` and add:

```yaml
dependencies:
  - name: postgresql
    version: "15.5.32"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled
```

(If that version is gone from the repo, run `helm search repo bitnami/postgresql --versions | head` and pick a current `15.x`.)

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm dependency update ./shop
ls shop/charts
```

**Check:** a `.tgz` appears under `shop/charts/` and `Chart.lock` exists.

## Task 2. Parent values

Append to `shop/values.yaml` (or create `shop/ci-values.yaml`):

```yaml
postgresql:
  enabled: true
  auth:
    postgresPassword: "ShopPass123"
    database: shop
  primary:
    persistence:
      enabled: false
```

Disable the scaffold ingress if it fights your cluster:

```yaml
ingress:
  enabled: false
```

## Task 3. Install

```bash
helm upgrade --install shop ./shop -f shop/values.yaml --wait --timeout 5m
kubectl get pods
kubectl get secret
```

**Check:** nginx (or scaffold) pod(s) plus a postgres primary pod become Ready.

## Task 4. Disable subchart

```bash
helm upgrade shop ./shop --set postgresql.enabled=false --wait
kubectl get pods
```

**Check:** postgres workload removed (PVC/Secrets behavior depends on chart; for this lab persistence was off).

```bash
helm uninstall shop
kubectl delete namespace lab-helm-deps
kubectl config set-context --current --namespace=default
```

## Self-check

1. What does `helm dependency update` write?
2. Why `condition: postgresql.enabled`?
3. Where do subchart values sit in the parent `values.yaml`?

Next: [11-hooks-and-tests.md](11-hooks-and-tests.md).
