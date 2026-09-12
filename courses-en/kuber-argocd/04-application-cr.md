# 04. Application CR: source, destination, syncPolicy

## What CR means

Kubernetes ships with built-in kinds: Pod, Deployment, Service, ConfigMap. The API server understands those without extra installs.

A **CR (Custom Resource)** is an object of a kind Kubernetes did **not** ship with. Somebody registered a new type, then you create instances of it — the same `kubectl apply` / `get` / `describe` path as a Deployment.

| Term | What it is | Analogy |
|------|------------|---------|
| **CRD** (Custom Resource Definition) | Registers a new kind (`Application`, `ApplicationSet`, …) | A blank form: which fields exist |
| **CR** (Custom Resource) | One filled-in object of that kind | The form with `hello` written on it |

Helm install in lesson 03 applied the CRD `applications.argoproj.io`. Until that exists, `kind: Application` fails with *no matches for kind "Application"*.

Argo needs a CR because the stock API has no idea what a Git repo or a Sync button is. The chart also runs **controllers** (Pods in `argocd`). They watch Application objects and do the work: clone Git, diff against the cluster, apply.

```text
You apply Application CR  →  application-controller reads it  →  Deployments appear
```

`kind: Application` is **not** the app. It is a note for Argo: *this Git path goes to that namespace*. The real Deployment/Pod show up later, in the **destination** namespace.

**Namespaced** means the CR lives in a namespace (like a ConfigMap), not cluster-wide (like a Node). Application CRs almost always sit in `argocd`, where the controller looks by default.

| Where | What |
|-------|------|
| `metadata.namespace: argocd` | The note (the Application CR) |
| `spec.destination.namespace: lab-argocd` | The workload Argo creates from Git |

## The unit of deploy

An Application CR answers three questions:

| Field | Question |
|-------|----------|
| `spec.source` | Which Git, revision, path (and Helm/Kustomize options)? |
| `spec.destination` | Which cluster and namespace? |
| `spec.syncPolicy` | Auto or manual? prune? selfHeal? |

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: hello
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOU/gitops-lab.git
    targetRevision: HEAD
    path: apps/hello
  destination:
    server: https://kubernetes.default.svc
    namespace: lab-argocd
  syncPolicy:
    automated:
      prune: false
      selfHeal: false
    syncOptions:
      - CreateNamespace=true
```

Chicken-and-egg: you **`kubectl apply` the Application once**. After that, **workloads** change only via Git.

## source

| Field | Meaning |
|-------|---------|
| `repoURL` | HTTPS (this course) or SSH |
| `targetRevision` | branch, tag, or commit SHA (`HEAD` = default branch) |
| `path` | directory of YAML, a chart, or a kustomize root |
| `helm` / `kustomize` | render options (lesson 08) |

Argo does **not** read `~/kuber-argocd` on your laptop.

## destination

On Docker Desktop the in-cluster API is:

```text
https://kubernetes.default.svc
```

`namespace` is where Deployments/Services land — **not** where the Application CR lives.

## syncPolicy

| Knob | Effect |
|------|--------|
| omit `automated` | you click **Sync** (or `argocd app sync`) |
| `automated` | new Git revision → sync |
| `selfHeal: true` | undo live drift (`kubectl scale`, edit) |
| `prune: true` | delete objects removed from Git |
| `CreateNamespace=true` | create destination NS on first sync |

Lesson 05 starts with **automated off for prune/selfHeal** so you can see OutOfSync. Lesson 07 turns them on.

## project

`project: default` is unrestricted. Real platforms use **AppProject** (allowed repos, destinations, cluster-scoped resources) — lesson 10.

## Status you will stare at

| Sync | Health |
|------|--------|
| Synced / OutOfSync / Unknown | Healthy / Progressing / Degraded / Missing / Suspended |

A Deployment can be **Synced** (matches Git) and **Degraded** (CrashLoop). Fix the app, not only the sync button.

## Checklist

- [ ] CR vs CRD — which one is the `Application` YAML you apply?  
- [ ] Why is the Application in `argocd` while the Pod is in `lab-argocd`?  
- [ ] What happens if `path` does not exist in Git?  
- [ ] Why `CreateNamespace=true` on a laptop lab?  

Next lab: [05. Lab: first Application](05-lab-first-app.md).
