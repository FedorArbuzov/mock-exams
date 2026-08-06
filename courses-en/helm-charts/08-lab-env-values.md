# 08. Lab: `values-dev` / `values-prod`

## Setup

```bash
cd ~/helm-work
kubectl create namespace lab-helm-values
kubectl config set-context --current --namespace=lab-helm-values
helm create catalog
```

## Task 1. Defaults stay boring

Confirm `catalog/values.yaml` has modest `replicaCount` (usually 1).

## Task 2. Overlay files

Create `values-dev.yaml`:

```yaml
replicaCount: 2
image:
  tag: 1.27-alpine
resources:
  requests:
    cpu: 50m
    memory: 64Mi
```

Create `values-prod.yaml`:

```yaml
replicaCount: 4
image:
  tag: 1.27-alpine
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi
```

## Task 3. Diff via template

```bash
helm template cat ./catalog -f values-dev.yaml  | grep -E 'replicas:|cpu:|memory:' | head
helm template cat ./catalog -f values-prod.yaml | grep -E 'replicas:|cpu:|memory:' | head
```

**Check:** prod shows higher replicas and limits.

## Task 4. Install “dev”, then promote

```bash
helm upgrade --install cat ./catalog -f values-dev.yaml
kubectl get deploy cat-catalog -o jsonpath='{.spec.replicas}{"\n"}'

helm upgrade cat ./catalog -f values-prod.yaml
kubectl get deploy cat-catalog -o wide
kubectl get deploy cat-catalog -o jsonpath='{.spec.template.spec.containers[0].resources}{"\n"}'
```

## Task 5. Precedence

```bash
helm upgrade cat ./catalog -f values-prod.yaml --set replicaCount=1
kubectl get deploy cat-catalog -o jsonpath='{.spec.replicas}{"\n"}'
```

**Check:** `--set` wins → 1 replica.

```bash
helm uninstall cat
kubectl delete namespace lab-helm-values
kubectl config set-context --current --namespace=default
```

## Self-check

1. Why keep `values.yaml` inside the chart conservative?
2. Order of `-f a.yaml -f b.yaml --set x=y`?

Next: [09-dependencies.md](09-dependencies.md).
