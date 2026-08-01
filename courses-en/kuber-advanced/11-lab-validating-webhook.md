# 11. Lab: forbid images with the `latest` tag

We use **Kyverno** — a policy engine that requires no webhook code.

## Task 1. Install Kyverno

```bash
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
helm install kyverno kyverno/kyverno -n kyverno --create-namespace --wait
kubectl get pods -n kyverno
```

## Task 2. ClusterPolicy — forbid latest

`deny-latest.yaml`:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-latest-tag
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: require-image-tag-not-latest
      match:
        any:
          - resources:
              kinds: [Pod]
      validate:
        message: "Using ':latest' tag is not allowed."
        pattern:
          spec:
            containers:
              - image: "!*:latest"
```

```bash
kubectl apply -f deny-latest.yaml
```

## Task 3. Verify

```bash
kubectl create namespace lab-webhook
kubectl run bad --image=nginx:latest -n lab-webhook
# blocked

kubectl run good --image=nginx:1.27-alpine -n lab-webhook
# OK (if PSA doesn't get in the way — use the default ns or a ns without restricted)
```

If PSA `restricted` is on `default` — test in a namespace without PSA:

```bash
kubectl create namespace lab-webhook
kubectl label namespace lab-webhook pod-security.kubernetes.io/enforce=privileged
kubectl run bad --image=nginx:latest -n lab-webhook
```

## Task 4. Policy report

```bash
kubectl get clusterpolicy
kubectl describe clusterpolicy disallow-latest-tag
```

## Task 5. (Optional) require digest

```yaml
validate:
  message: "Image must use digest pin"
  pattern:
    spec:
      containers:
        - image: "*@sha256:*"
```

## Cleanup

```bash
kubectl delete clusterpolicy disallow-latest-tag
helm uninstall kyverno -n kyverno
kubectl delete namespace kyverno lab-webhook --ignore-not-found
```

## Self-check questions

1. How is Kyverno simpler than a hand-written webhook?
2. What does `validationFailureAction: Enforce` do?
3. Where in the admission chain does Kyverno act?
