# 10. Final project: a GitOps platform

## Task

On **mockctl**, assemble a minimal "platform":

1. **Argo CD** installed.
2. **gitops-root** (app-of-apps) syncs at least **2** child Applications:
   - `hello-gitops` → `gitops-demo`
   - `sync-waves` → `gitops-waves`
3. Add a third child `apps/echo.yaml` to the fork (create it yourself):
   - path: a new directory `deploy/gitops/manifests/echo/` (Deployment nginx + Service)
   - namespace: `gitops-echo`
4. Demonstrate a **rollback** after an intentionally bad image ([lab 06](06-lab-rollback.md)).
5. A `GITOPS.md` document in the fork:
   - app-of-apps diagram (ascii or mermaid)
   - repository URL, branch
   - port-forward commands for the UI
   - who does CI vs CD

## Success criteria

| # | Criterion |
|---|----------|
| 1 | Root + 3 child Applications Synced |
| 2 | sync-waves: waves 0→1→2 without errors |
| 3 | Rollback/revert documented |
| 4 | No secrets in plain text in Git |
| 5 | Integration with GitLab split described (1 paragraph) |

## Relation to the capstone

- [kuber-advanced/27](../kuber-advanced/27-final-project.md) — Argo + Prometheus + policy
- [gitlab-advanced/15](../gitlab-advanced/15-final-project.md) — CI → gitops → Argo staging

## Cleanup

```bash
cd deploy/gitops && bash scripts/uninstall.sh
```
