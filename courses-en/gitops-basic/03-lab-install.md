# 03. Lab: installing Argo CD

## Goal

Bring up Argo CD on **mockctl** and sign into the UI.

## Prerequisites

```bash
mockctl up
export KUBECONFIG="$(pwd)/output/kubeconfig.yaml"   # from the repository root
kubectl get nodes
```

## Steps

```bash
cd deploy/gitops
bash scripts/install-argocd.sh
bash scripts/get-admin-password.sh
```

In another terminal:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Open https://localhost:8080 — user **`admin`**, password from the script. Accept the TLS warning (self-signed).

Optional CLI:

```bash
argocd login localhost:8080 --username admin --password '<pwd>' --insecure
argocd version
```

## Expected result

```bash
kubectl get pods -n argocd
# argocd-server, application-controller, repo-server, redis — Running
```

## Success criteria

- [ ] All core pods in `argocd` are Running
- [ ] UI opens; admin login succeeds
- [ ] `argocd version` (if CLI is installed) responds

## Common mistakes

| Symptom | Solution |
|---------|----------|
| `connection refused` to the API | `mockctl status` / `mockctl kubeconfig` |
| Pods Pending | Docker Desktop RAM 4+ GB |
| Timeout on install | retry wait; `kubectl get events -n argocd` |

## Cleanup (later)

`bash scripts/uninstall.sh` — at the end of the course.

Next lesson: [04-application-spec.md](04-application-spec.md).
