# 22. Lab: Blue-Green Deployment

The goal: stand up a green version next to a live blue one, flip the Service, and keep blue around for rollback.

> **Before starting:** see [ENVIRONMENT.md](ENVIRONMENT.md). Docker Desktop Kubernetes ready, nodes Ready.

> **Interactive check.** Open this lesson in the courses UI (http://127.0.0.1:8091/). Use the **Interactive lab** panel: **Start lab** creates namespace `lab-bluegreen` and deploys **blue** (`web-blue` + Service `web` → `version=blue`). You build and switch to **green**, then press **Check**. Auto-check target: green Deployment Ready on `nginx:1.28` (2 replicas), Service selector `version=green`, live Endpoints, and blue still present. **Cleanup** deletes the `lab-bluegreen` namespace.

## Setup

Either press **Start lab** in the panel, or do it by hand:

```bash
kubectl create namespace lab-bluegreen
kubectl config set-context --current --namespace=lab-bluegreen
```

After **Start lab**, confirm blue is up:

```bash
kubectl -n lab-bluegreen get deploy,svc,endpoints
kubectl -n lab-bluegreen get pods -l app=web --show-labels
```

**Check:** Deployment `web-blue` is Ready, Service `web` selects `app=web,version=blue`, and Endpoints list the blue pod IPs.

## Task 1. Deploy green (no traffic yet)

Use this `web-green.yaml` example (you can tune replicas later, but start with this for auto-check):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-green
  namespace: lab-bluegreen
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
      version: green
  template:
    metadata:
      labels:
        app: web
        version: green
    spec:
      containers:
        - name: nginx
          image: nginx:1.28
          ports:
            - containerPort: 80
```

```bash
kubectl apply -f web-green.yaml
kubectl -n lab-bluegreen rollout status deploy/web-green
kubectl -n lab-bluegreen get pods -l version=green -o wide
```

Hit green **directly** (not via the Service), so you know it works before the cutover:

```bash
kubectl -n lab-bluegreen port-forward deploy/web-green 8081:80
# in another terminal:
curl -sI http://127.0.0.1:8081/ | head -n 1
```

**Check:** two green pods are `Running` / Ready. The Service `web` still points at **blue** — `kubectl get endpoints web -n lab-bluegreen -o yaml` should not list the green pod IPs yet.

## Task 2. Flip the Service to green

Patch the Service selector:

```bash
kubectl -n lab-bluegreen patch svc web --type=merge -p "{\"spec\":{\"selector\":{\"app\":\"web\",\"version\":\"green\"}}}"
kubectl -n lab-bluegreen get svc web -o yaml | grep -A3 selector
kubectl -n lab-bluegreen get endpoints web -o wide
```

Verify via the Service:

```bash
kubectl -n lab-bluegreen run tmp --rm -it --image=busybox:1.36 --restart=Never -- \
  wget -qO- http://web | head -n 5
```

**Check:** selector shows `version: green`, Endpoints match the green pods, and `wget`/`curl` through `web` succeeds.

Press **Check** in the Interactive lab panel — all items should pass.

## Task 3. Rollback to blue (optional, manual)

```bash
kubectl -n lab-bluegreen patch svc web --type=merge -p "{\"spec\":{\"selector\":{\"app\":\"web\",\"version\":\"blue\"}}}"
kubectl -n lab-bluegreen get endpoints web -o wide
```

**What you'll see:** traffic returns to blue without recreating anything. Then flip back to green if you want the auto-check to pass again.

## Cleanup

Press **Cleanup** in the panel, or:

```bash
kubectl delete namespace lab-bluegreen
kubectl config set-context --current --namespace=default
```

## Self-check questions

1. Why deploy green fully and wait for Ready **before** changing the Service selector?
2. What would happen if the Service selector were only `app=web` (no `version`)?
3. How is this different from a Deployment `RollingUpdate` on a single Deployment?
4. After a successful cutover, when would you delete the blue Deployment?
5. How would you approximate a 10% canary with the same two-Deployment idea?
