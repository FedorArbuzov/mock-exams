# 27. Final project: a platform on minikube

> Do this **after** phases 1–3 and preferably 14–15 (Prometheus). It brings everything together into one picture.

## Goal

Deploy a "minimal platform":

- **Argo CD** — GitOps from the `mock-exams` repo
- **kube-prometheus-stack** — metrics and Grafana
- **PSA restricted** on the app namespace
- **Kyverno** — forbid `:latest`
- **Audit** — understanding where to look at logs

## Component checklist

```bash
# 1. Cluster
mockctl up

# 2. Monitoring (phase 4, optional)
helm install kube-prom prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  --set grafana.adminPassword=admin

# 3. Argo CD (phase 3)
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 4. Kyverno (phase 2)
helm install kyverno kyverno/kyverno -n kyverno --create-namespace

# 5. App namespace with PSA
kubectl create namespace platform-apps
kubectl label namespace platform-apps \
  pod-security.kubernetes.io/enforce=restricted

# 6. Application in Argo → path deploy/argocd-demo (from lab 17)

# 7. ClusterPolicy disallow-latest (from lab 11)
```

## Verifying "everything works"

| Check | Command |
|---|---|
| Apps synced | `kubectl get application -n argocd` |
| Pods running | `kubectl get pods -n platform-apps` |
| Grafana | `kubectl port-forward -n monitoring svc/kube-prom-grafana 3000:80` |
| PSA blocks bad pod | `kubectl run bad --image=nginx:latest -n platform-apps` → Forbidden |
| Latest blocked | Kyverno policy |
| Metrics | Grafana dashboard Kubernetes / Views |

## A document for the project README

Add to the repository `deploy/README.md`:

```markdown
## Platform stack
- mockctl up
- helm: monitoring, kyverno, argocd
- Application: deploy/argocd-demo
```

## What you've proven

You've gone from "bring up a pod" to "a platform with GitOps, observability, policy, and security" — on a single laptop.

## Next

- [`mock-ckad`](../mock-ckad/README.md) — timed exams
- Production: managed Kubernetes (EKS/GKE/AKS) — the same patterns, a different scale
