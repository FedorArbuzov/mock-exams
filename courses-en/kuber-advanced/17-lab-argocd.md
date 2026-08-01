# 17. Lab: GitOps on the mock-exams repository

> **Recommended:** the manifests and scripts in [`deploy/gitops`](../../deploy/gitops/README.md), the [gitops-basic](../gitops-basic/README.md) course. Below is a simplified "from scratch in a fork" variant.

## Task 1. Prepare manifests in the repo

Use the ready-made directory [`deploy/gitops/manifests/hello-gitops`](../../deploy/gitops/manifests/hello-gitops/) **or** create `deploy/argocd-demo/`:

`deploy/argocd-demo/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-gitops
spec:
  replicas: 2
  selector:
    matchLabels: { app: hello-gitops }
  template:
    metadata:
      labels: { app: hello-gitops }
    spec:
      containers:
        - name: c
          image: nginx:1.27-alpine
          ports: [{ containerPort: 80 }]
---
apiVersion: v1
kind: Service
metadata:
  name: hello-gitops
spec:
  selector: { app: hello-gitops }
  ports: [{ port: 80 }]
```

Commit and push to GitHub.

## Task 2. Install Argo CD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=available deploy/argocd-server -n argocd --timeout=300s
```

## Task 3. Create an Application

`app.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: mock-exams-demo
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/FedorArbuzov/mock-exams.git
    targetRevision: master
    path: deploy/argocd-demo
  destination:
    server: https://kubernetes.default.svc
    namespace: gitops-demo
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

```bash
kubectl apply -f app.yaml
kubectl get application -n argocd
kubectl get pods -n gitops-demo
```

**What you'll see:** Argo pulled the manifests, the namespace was created, 2 pods Running.

## Task 4. Self-heal

```bash
kubectl scale deploy hello-gitops -n gitops-demo --replicas=5
sleep 30
kubectl get deploy hello-gitops -n gitops-demo
```

**What you'll see:** replicas went back to 2 (git = source of truth).

## Task 5. Git-driven change

In the repo, change to `replicas: 3`, push. Wait ~3 min (or click Sync in the UI).

```bash
kubectl get deploy hello-gitops -n gitops-demo
```

## Task 6. UI

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Open https://localhost:8080 — look at the Application, Diff, History.

## Cleanup

```bash
kubectl delete application mock-exams-demo -n argocd
kubectl delete namespace gitops-demo argocd
```

## Self-check questions

1. What happens on a manual `kubectl scale` if selfHeal is enabled?
2. What does `prune: true` do?
3. Why `CreateNamespace=true`?
