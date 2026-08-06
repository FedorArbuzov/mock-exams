# 19. Lab: Namespace

The goal: split objects across namespaces, reach across them, and switch your "current" namespace.

> **Before starting:** see [ENVIRONMENT.md](ENVIRONMENT.md).

> **Interactive check.** Open this lesson in the courses UI (http://127.0.0.1:8091/). Use the **Interactive lab** panel: **Start lab** removes `team-a`/`team-b` if they exist. Auto-check target: **Tasks 1–2** — namespaces `team-a` and `team-b` exist, each with a Ready `web` Deployment. Press **Check** before Task 6 (which deletes the namespaces). **Cleanup** deletes both namespaces.

## Task 1. Create two namespaces

```bash
kubectl create namespace team-a
kubectl create namespace team-b
kubectl get ns
```

**Check:** both show up in the list.

## Task 2. The same manifest in two namespaces

Reuse the Deployment from lab 11 (`web`, `nginx:1.27.1`, 2 replicas).

```bash
kubectl apply -f deploy.yaml -n team-a
kubectl apply -f deploy.yaml -n team-b

kubectl get deploy -A | grep web
kubectl get pods -n team-a
kubectl get pods -n team-b
```

**Check:** both namespaces have their own `web` Deployment and Pods.

## Task 3. A Service in each namespace

Write `svc.yaml` if you do not have it from lab 17 — ClusterIP Service `web`, selector `app=web`, port 80. Apply it in both namespaces:

```bash
kubectl apply -f svc.yaml -n team-a
kubectl apply -f svc.yaml -n team-b
```

Give each namespace its own distinct page content, so you can tell them apart:

```bash
# bash / zsh
for p in $(kubectl get pods -n team-a -l app=web -o name); do
  kubectl -n team-a exec $p -- sh -c "echo TEAM-A-$p > /usr/share/nginx/html/index.html"
done
for p in $(kubectl get pods -n team-b -l app=web -o name); do
  kubectl -n team-b exec $p -- sh -c "echo TEAM-B-$p > /usr/share/nginx/html/index.html"
done
```

```powershell
# PowerShell
kubectl get pods -n team-a -l app=web -o name | ForEach-Object {
  kubectl -n team-a exec $_ -- sh -c "echo TEAM-A-$_ > /usr/share/nginx/html/index.html"
}
kubectl get pods -n team-b -l app=web -o name | ForEach-Object {
  kubectl -n team-b exec $_ -- sh -c "echo TEAM-B-$_ > /usr/share/nginx/html/index.html"
}
```

## Task 4. Reaching across namespaces

Start a throwaway Pod in `team-a`:

```bash
kubectl -n team-a run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh
```

From inside it:

```sh
wget -qO- http://web                 # same namespace  -> TEAM-A-...
wget -qO- http://web.team-b          # different namespace -> TEAM-B-...
wget -qO- http://web.team-b.svc.cluster.local
```

**Check:** the short name `web` reaches its own namespace; `.team-b` reaches the other one.

## Task 5. Your current namespace

```bash
kubectl config set-context --current --namespace=team-a
kubectl get pods                # no -n needed, shows team-a's Pods
kubectl get pods -n team-b      # explicit namespace still works
```

Switch back to `default`:

```bash
kubectl config set-context --current --namespace=default
```

## Task 6. Deleting a namespace

```bash
kubectl delete ns team-a team-b
kubectl get ns
```

**Check:** both namespaces are gone, along with every Deployment/Service/Pod they contained.

## Check yourself

1. Which objects are **not** scoped to a namespace?
2. What's the difference between `web`, `web.team-b`, and `web.team-b.svc.cluster.local`?
3. Why is `kubectl delete ns ...` a genuinely dangerous command to run in production?
