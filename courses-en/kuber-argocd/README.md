# Kubernetes Argo CD (GitOps)

Hands-on course: **GitOps with Argo CD** on **Docker Desktop Kubernetes** — install, Application CR, auto-sync / selfHeal / prune, Helm as a source, ApplicationSet for staging/prod, and troubleshooting.

**Time:** ~10–14 hours + **3–4 hours** final project.  
**Prerequisites:** [`kuber-basic`](../kuber-basic/README.md) + [`kuber-intermediate`](../kuber-intermediate/README.md). Helpful: [`helm-charts`](../helm-charts/README.md) and [`gitlab-cicd`](../gitlab-cicd/README.md).

> This is **not** Flux-from-zero and **not** Argo Rollouts / Workflows / Events. For GitOps ideas on the older mockctl stand see [`gitops-basic`](../gitops-basic/README.md). Here the focus is **Argo CD in the cluster**: Git is the desired state; the controller reconciles.

Setup: **[ENVIRONMENT.md](ENVIRONMENT.md)** · UI: **http://127.0.0.1:8091/kuber-argocd/README.md**

---

## How to take this course

1. **Read** the theory page.
2. **Do** the lab — Helm install, Application CRs, commits to **your public Git repo**.
3. **Check** — **Interactive Check** when `*.lab.json` exists (namespaces, Applications, Deployments). UI health, Diff, and selfHeal timing you verify yourself.

**Tip:** keep the Argo CD UI (port-forward) open next to the courses UI and a terminal with `kubectl` + `git`.

---

## Local stand

| Component | How | Note |
|-----------|-----|------|
| Courses UI | QUICKSTART | http://127.0.0.1:8091/ |
| Kubernetes | Docker Desktop | context `docker-desktop` |
| Argo CD | Helm `argo/argo-cd` | namespace `argocd` |
| Desired state | **your public Git repo** | copy `examples/apps` + `examples/charts` |
| UI | port-forward `argocd-server` | http://127.0.0.1:8080 |

**RAM:** **6+ GB** free for Docker recommended (Argo CD + a few apps). Disable Dex/notifications in the install (lesson 03) to keep it light.

**Git:** Argo CD clones **HTTPS**. A public GitHub/GitLab repo is enough. Local GitLab from [`gitlab-cicd`](../gitlab-cicd/ENVIRONMENT.md) is optional, not required.

---

## Curriculum

### Foundations (01–03)

1. [Why GitOps (not kubectl apply from CI)](01-why-gitops.md)
2. [Argo CD overview (and Flux in one page)](02-argocd-overview.md)
3. [Lab: install Argo CD](03-lab-install.md)

### First Application (04–05)

4. [Application CR: source, destination, syncPolicy](04-application-cr.md)
5. [Lab: first Application](05-lab-first-app.md)

### Drift (06–07)

6. [Sync vs Health, selfHeal, prune](06-sync-drift.md)
7. [Lab: self-heal and prune](07-lab-self-heal.md)

### Sources (08–09)

8. [Directory, Helm, and Kustomize as source](08-sources.md)
9. [Lab: Helm Application](09-lab-helm.md)

### Multi-app (10–11)

10. [AppProject, app-of-apps, ApplicationSet](10-appset-projects.md)
11. [Lab: staging + prod with ApplicationSet](11-lab-appset.md)

### Ops and finale (12–14)

12. [Troubleshooting Argo CD](12-troubleshooting.md)
13. [Lab: fix a broken Application](13-lab-troubleshooting.md)
14. [Final project: shop from Git](14-final-project.md)

---

## What you should end up with

- Install Argo CD with Helm and open the UI.
- Point an **Application** at a Git path and sync it into a namespace.
- Explain **Synced vs Healthy**, and demonstrate **selfHeal** / **prune**.
- Deploy a **Helm** chart from Git with per-env values.
- Generate staging + prod with an **ApplicationSet** (list generator).
- Debug ComparisonError, bad path, and stuck sync.
- Keep **CI** (build image, bump tag in Git) separate from **CD** (Argo syncs).

## Related

| Course | Relation |
|--------|----------|
| [gitops-basic](../gitops-basic/README.md) | Older mockctl draft — prefer this course |
| [helm-charts](../helm-charts/README.md) | Chart authoring; here you only consume a chart |
| [gitlab-cicd](../gitlab-cicd/README.md) | CI builds the image; Argo deploys the tag |
| [kuber-advanced/16](../kuber-advanced/16-argocd.md) | Short overview |
| [kuber-vault](../kuber-vault/README.md) | Secrets — do not put them in Git |
