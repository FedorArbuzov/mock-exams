# 02. Argo CD overview (and Flux in one page)

## Why Argo CD for this stand

On **Docker Desktop** you want a GitOps controller that:

- installs with Helm in minutes,
- has a usable UI for Diff / Sync / Health,
- still teaches **Application, selfHeal, Helm source, ApplicationSet**.

**Argo CD** fits. **Flux** is the other common answer in interviews — pull-based, GitOps Toolkit, no first-class UI like Argo’s. Learn the **Application** model here; map it to Flux `Kustomization` / `HelmRelease` later.

## Components

| Piece | Role |
|-------|------|
| **argocd-server** | UI + API |
| **application-controller** | Compare Git vs cluster, sync |
| **repo-server** | `git clone`, `helm template`, kustomize build |
| **redis** | Cache |
| **applicationset-controller** | Generate Applications from a template |
| **dex / notifications** | SSO / alerts — **off** in this course to save RAM |

Fixed names:

- Install namespace: **`argocd`**
- Application CRs live in **`argocd`**
- Workloads live in the **destination** namespace (`lab-argocd`, …)

```text
Git
 │
 ▼
repo-server  ──rendered manifests──►  application-controller  ──►  kube-apiserver
                                            ▲
UI / API  ◄──── argocd-server ──────────────┘
```

## Argo CD vs Flux (cheat sheet)

| | Argo CD | Flux |
|--|---------|------|
| Unit of deploy | Application / ApplicationSet | Kustomization, HelmRelease |
| UI | first-class | mainly CLI + Git; UIs exist as add-ons |
| Multi-env | ApplicationSet generators | `GitRepository` + many Kustomizations |
| Interview value | very common in platform teams | common in “pure GitOps” shops |

Same problem: **Git is desired state**. Different CRDs and ops.

## Image tags (not Image Updater)

Production pattern: CI builds `shop:gitsha`, **commits** `image.tag` (or a values file) into the gitops repo. Argo syncs. **Argo Image Updater** exists; it is extra moving parts and easy to make non-reviewable. This course does **not** install it.

## Install path (preview)

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm upgrade --install argocd argo/argo-cd -n argocd --create-namespace \
  --set dex.enabled=false \
  --set notifications.enabled=false \
  --set configs.params."server.insecure"=true
```

Full steps: [ENVIRONMENT.md](ENVIRONMENT.md) and [03-lab-install.md](03-lab-install.md).

## Common mistakes

| Mistake | Result |
|---------|--------|
| Point Application at a **local** folder | Argo never sees it — Git only |
| Private repo, no credentials | ComparisonError / authentication |
| `kubectl apply` the same Deployment | fight with selfHeal |
| Expect SSO/Dex in this lab | we disabled it |

## Checklist

- [ ] Name four components (server, controller, repo-server, redis)  
- [ ] Application lives in `argocd`; Pods live in destination NS  
- [ ] One reason we use Argo rather than Flux on this laptop  

Next lab: [03. Lab: install Argo CD](03-lab-install.md).
