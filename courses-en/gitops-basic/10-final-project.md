# 10. Final project: demo from Git

## Task

On mockctl, deploy an application **from your fork** end-to-end:

1. Fork `mock-exams`, branch `gitops-basic-final`.
2. In `deploy/gitops/manifests/hello-gitops/deployment.yaml` — label `course: gitops-basic-final`, `replicas: 2`.
3. `config/repo.env` → fork URL; `apply-hello-direct.sh`.
4. Prove Synced + 2 Pods; screenshot or `argocd app get` output.
5. Create **drift** (`kubectl scale` → 5), show OutOfSync and return to 2.
6. Change replicas in Git to **3**, push, sync — History screenshot.
7. Short README in the fork (5–10 lines): Application URL, what you did.

## Success criteria

| # | Criterion |
|---|-----------|
| 1 | Argo CD installed, UI accessible |
| 2 | Application with no repo errors |
| 3 | selfHeal demonstrated |
| 4 | Git-driven change (replicas 3) |
| 5 | No `kubectl apply` of app manifests bypassing Git |

## Optional

- Install the `argocd` CLI and include `app diff` in the report.
- Add `metadata.labels` for tracking in Prometheus (future course).

## Next

[gitops-intermediate](../gitops-intermediate/README.md) — app-of-apps, sync waves, rollback.
