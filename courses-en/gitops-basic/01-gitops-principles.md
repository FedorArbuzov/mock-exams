# 01. GitOps: desired state in Git

## Intro: “who’s right — the cluster or Git?”

In production you often have two sources of truth: manifests in the repository and “whatever `kubectl get` shows now.” After a late-night `kubectl scale` or a hotfix via `edit`, the cluster **diverges** from Git. GitOps answers: **canonical state lives in Git**; a controller constantly **compares** and **reconciles** the cluster to the commit.

## Model

```text
Developer / CI  →  commit to Git (manifests / helm / kustomize)
                        │
                        ▼
              GitOps controller (Argo CD / Flux)
                        │
                        ▼
                 Kubernetes API
```

| Role | Action |
|------|--------|
| Developer / platform | Changes YAML in Git (MR, review) |
| CI | Builds the image, **updates the tag** in the gitops repo (not `kubectl apply`) |
| CD controller | Sync, diff, rollback |

## What GitOps gives you

- **Audit** — who, when, why (git blame, MR).
- **Rollback** — `git revert` + sync (or roll back a revision in Argo).
- **Consistent envs** — staging/prod from branches or overlays.
- **Drift detection** — manual edits show up as OutOfSync.

## What GitOps does not replace

- Image builds, unit tests — that’s **CI**.
- Secrets in plain text in Git — you need **Sealed Secrets**, **External Secrets**, Vault ([`secrets-basic`](../secrets-basic/README.md)).
- Stateful data — database backups, not “roll back a Deployment.”

## Anti-pattern

`kubectl apply -f` in a GitLab job **and** Argo CD on the same files — two operators, conflicts, “why did it roll back.” Pick **one** CD path.

## Checklist

- Where is desired state stored?
- Who is allowed to change the production namespace directly?
- How do you roll back a release without SSH to the master?

Next lesson: [02-argocd-architecture.md](02-argocd-architecture.md).
