# 06. Lab: `_helpers.tpl` and stable selectors

## Setup

```bash
cd ~/helm-work
kubectl create namespace lab-helm-helpers
kubectl config set-context --current --namespace=lab-helm-helpers
helm create store
```

## Task 1. Inspect helpers

```bash
sed -n '1,120p' store/templates/_helpers.tpl
```

Find `store.fullname`, `store.labels`, `store.selectorLabels`.

## Task 2. Prove selectors stay aligned

```bash
helm template x ./store | grep -A2 'matchLabels:'
helm template x ./store | grep -A5 'kind: Service' | head -20
```

**Check:** Deployment `matchLabels` and Service `selector` use the same keys (`app.kubernetes.io/name`, `app.kubernetes.io/instance`).

## Task 3. Break and fix (intentionally)

In `templates/service.yaml`, temporarily change the selector to:

```yaml
  selector:
    app: broken
```

```bash
helm lint ./store
helm template x ./store >/dev/null
helm upgrade --install x ./store
kubectl get endpoints x-store -o yaml | head -30
```

**What happens:** Service has no matching pods / empty endpoints (exact name may vary — use `kubectl get svc,ep`).

Restore the Service selector to `include "store.selectorLabels" .`, upgrade again, confirm endpoints fill.

## Task 4. `fullnameOverride`

```bash
helm upgrade x ./store --set fullnameOverride=shopfront
kubectl get deploy,svc
```

**Check:** resources named `shopfront` (truncated rules applied).

```bash
helm uninstall x
kubectl delete namespace lab-helm-helpers
kubectl config set-context --current --namespace=default
```

## Self-check

1. Why must Service selectors match Pod labels exactly?
2. What is dangerous about putting `{{ .Release.Revision }}` into selector labels?

Next: [07-values-and-overrides.md](07-values-and-overrides.md).
