# 01. Why GitOps

## Scenario

Your GitLab job ends with `kubectl apply -f deploy/`. A weekend hotfix is `kubectl scale` in production. Monday the pipeline reapplies Git and **undoes** the hotfix — or worse, Git is stale and nobody knows which replica count is “real.”

**GitOps** picks one source of truth: **desired cluster state lives in Git**. A controller (here: **Argo CD**) continuously compares Git to the live cluster and **reconciles**.

## What you will learn in this course

| Topic | Why it matters |
|-------|----------------|
| Application CR | The unit Argo syncs (repo + path → namespace) |
| Sync vs Health | OutOfSync is not the same as CrashLoop |
| selfHeal / prune | Drift and leftover objects |
| Helm / directory source | How repo-server renders manifests |
| ApplicationSet | Many Applications from one template |
| Troubleshooting | ComparisonError, bad path, git auth |
| Optional Vault Injector / ESO | Git has annotations or ExternalSecret; the password is not in Git |

## CI vs CD

```text
App repo ──CI──► build, test, push image
                 │  commit new tag into gitops repo
                 ▼
Gitops repo ──Argo CD──► Kubernetes
```

| | CI (GitLab / GitHub Actions) | CD (Argo CD) |
|--|------------------------------|--------------|
| Job | compile, test, scan, **build image** | **sync** Git → cluster |
| Writes cluster? | **No** (target model) | Yes, via the controller |
| Rollback | new pipeline | `git revert` + sync (or Argo history) |

`kubectl apply` in CI **and** Argo on the same objects = two sources of truth. Pick **Argo** for deploy.

## Mental model

```text
Git (manifests / Helm / Kustomize)
        │  clone + render
        ▼
   Argo CD Application
        │  diff + apply
        ▼
   Kubernetes API  →  live objects
```

Benefits: review in a merge request, audit via git log, rollback via git, drift is visible.

## What GitOps does **not** replace

- Image builds and unit tests — still CI  
- Secrets in plaintext Git — optional [15](15-optional-vault-inject.md) (Injector) and [16](16-optional-eso.md) (ESO), or the full [`kuber-vault`](../kuber-vault/README.md) track  
- Database contents — backups, not `git revert` on a Deployment  

## When **not** to force GitOps

- A throwaway namespace you will delete in ten minutes  
- You cannot expose a Git remote Argo can clone  
- The team still requires `kubectl apply` in the same pipeline (fix the process first)

## Checklist

- [ ] You can say where desired state lives  
- [ ] You know why CI should not `kubectl apply` the same YAML Argo owns  
- [ ] This course needs Docker Desktop K8s + a **public Git repo**  

Next: [02. Argo CD overview](02-argocd-overview.md).
