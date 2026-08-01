# 05. Lab: first Application

## Goal

Deploy `hello-gitops` from Git via Argo CD.

## Important about Git

Argo CD reads a **remote** repository. **Fork** `mock-exams`, commit changes (if you edited anything), and **push**. In `config/repo.env` set the fork URL and branch (`main` / `master`).

```bash
cd deploy/gitops
cp config/repo.env.example config/repo.env
# edit MOCK_GITOPS_REPO, MOCK_GITOPS_REVISION
```

In `apps/*.yaml`, if the URL differs — replace `repoURL` with your fork (or use only the direct apply below).

## Steps

```bash
bash scripts/apply-hello-direct.sh
kubectl get application -n argocd
kubectl get application hello-gitops-direct -n argocd -o jsonpath='{.status.sync.status}{"\n"}'
kubectl get pods -n gitops-demo
```

In the UI: Applications → `hello-gitops-direct` → Sync Status **Synced**, Health **Healthy**.

Traffic check:

```bash
kubectl port-forward svc/hello-gitops -n gitops-demo 8888:80
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8888/
# 200
```

## Expected result

- Namespace `gitops-demo` created
- Deployment `hello-gitops` — 2 replicas Running
- Application — Synced

## Success criteria

- [ ] Application with no repo access error
- [ ] 2 Pods Running
- [ ] Resource tree visible in the UI

## Errors

| Symptom | Action |
|---------|--------|
| `repository not accessible` | URL, branch, fork visibility |
| `path not found` | path `deploy/gitops/manifests/hello-gitops` exists in remote |
| OutOfSync for a long time | click Sync; check Application Events |

Next lesson: [06-sync-drift.md](06-sync-drift.md).
