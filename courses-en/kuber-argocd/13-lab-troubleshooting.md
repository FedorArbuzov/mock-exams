# 13. Lab: fix a broken Application

## Goal

Apply an Application with a **wrong Git path**, read the error, fix `path` to `apps/hello`, and get a Healthy sync in **`lab-argocd-fix`**.

## Prerequisites

- Argo CD installed  
- `apps/hello` still in your gitops repo  

## Task 1. Break it

```bash
sed "s|YOUR_GITOPS_REPO|$GITOPS_REPO|" \
  courses-en/kuber-argocd/examples/argocd/application-broken.yaml \
  | kubectl apply -f -
```

```bash
kubectl -n argocd get application hello-fix
kubectl -n argocd describe application hello-fix | tail -40
```

Expect **ComparisonError** / failed to list directory `apps/hello-missing`.

## Task 2. Confirm dest is empty (or missing)

```bash
kubectl get ns lab-argocd-fix
kubectl -n lab-argocd-fix get all 2>/dev/null || true
```

## Task 3. Fix the path

```bash
kubectl -n argocd patch application hello-fix --type merge -p "{
  \"spec\": { \"source\": { \"path\": \"apps/hello\" } }
}"
```

```bash
kubectl -n argocd annotate application hello-fix \
  argocd.argoproj.io/refresh=hard --overwrite

kubectl -n argocd get application hello-fix
kubectl -n lab-argocd-fix get deploy hello
```

Sync should become **Synced**, Deployment **Ready**.

## Task 4. (Optional) Break Git URL on purpose

Set `repoURL` to a nonsense host, describe the Application, then restore `$GITOPS_REPO`. Same toolkit as [12](12-troubleshooting.md).

## Success criteria

- [ ] You saw ComparisonError with the bad path  
- [ ] `path` is `apps/hello`  
- [ ] Deployment `hello` Ready in `lab-argocd-fix`  
- [ ] Interactive Check passes  

## Cleanup (optional)

```bash
kubectl -n argocd delete application hello-fix
```

Leave Argo CD installed for the final.

Next: [14. Final project](14-final-project.md).
