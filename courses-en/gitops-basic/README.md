# GitOps — Basic (Argo CD on mockctl)

Course for **DevOps / Platform**: **GitOps** principles, the **Argo CD** controller, the **Application** CR, **sync policy**, **drift**, and **self-heal** on a local **mockctl** cluster.

**Prerequisites:** [`kuber-basic`](../kuber-basic/README.md) (Pod, Deployment, Service); preferably [`helm-charts`](../helm-charts/README.md) or [`kuber-intermediate/07-helm`](../kuber-intermediate/07-helm.md). Cluster: Docker Desktop Kubernetes — see [`kuber-basic/ENVIRONMENT.md`](../kuber-basic/ENVIRONMENT.md) and [QUICKSTART.md](../../QUICKSTART.md).

**Lab environment:** [`deploy/gitops`](../../deploy/gitops/README.md):

| Step | Command |
|------|---------|
| Cluster | `mockctl up` |
| Argo CD | `cd deploy/gitops && bash scripts/install-argocd.sh` |
| UI | `kubectl port-forward svc/argocd-server -n argocd 8080:443` → https://localhost:8080 |
| First app | `cp config/repo.env.example config/repo.env` → push to fork → `bash scripts/apply-hello-direct.sh` |

Overview in other courses (brief): [kuber-advanced/16](../kuber-advanced/16-argocd.md), [gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md). **Deep dive** — this track and [gitops-intermediate](../gitops-intermediate/README.md).

**Next:** app-of-apps, sync waves, rollback — [gitops-intermediate](../gitops-intermediate/README.md).

## How to read the chapters

1. **Theory** — workplace scenario, tables, anti-patterns.
2. **Lab** — `mockctl` + `deploy/gitops`; manifests in Git must be **pushed** to a remote that Argo CD can see.
3. After a Git change — wait for auto-sync or run `argocd app sync`.

**Time:** ~**45–60 min** per theory + lab pair; [final](10-final-project.md) — **2–3 h**. Full course — **~8–10 h**.

## Curriculum

### Principles and install (01–03)

1. [GitOps: desired state in Git](01-gitops-principles.md)
2. [Argo CD: components and sync flow](02-argocd-architecture.md)
3. [Lab: installing Argo CD](03-lab-install.md)

### Application (04–05)

4. [Application CR: source, destination, syncPolicy](04-application-spec.md)
5. [Lab: first Application](05-lab-first-application.md)

### Drift and policies (06–07)

6. [Synced / OutOfSync, selfHeal, prune](06-sync-drift.md)
7. [Lab: self-heal and prune](07-lab-self-heal.md)

### Operations (08–10)

8. [UI, CLI, diff, and health](08-ui-cli.md)
9. [GitOps vs kubectl apply in CI](09-vs-ci-apply.md)
10. [Final project: demo from Git](10-final-project.md)

## What you should end up with

- Explain why **Git** is the source of truth for the cluster.
- Install Argo CD on **mockctl** and sign into the UI.
- Create an **Application** pointing at `deploy/gitops/manifests/hello-gitops`.
- Demonstrate **OutOfSync** after `kubectl scale` and recovery via **selfHeal**.
- Read **Diff** in the UI / `argocd app diff`.
- Do not mix `kubectl apply` from CI and Argo on the same manifests.

## Related materials

| Course | Relation |
|--------|----------|
| [kuber-advanced/16–17](../kuber-advanced/16-argocd.md) | brief overview |
| [gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md) | CI/CD split |
| [deploy/gitops](../../deploy/gitops/README.md) | manifests and scripts |
