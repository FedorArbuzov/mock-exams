# 11. Lab: Deployment

The goal: walk through the full lifecycle — create, update, roll back, scale.

> **Before starting:** see [ENVIRONMENT.md](ENVIRONMENT.md).

> **Interactive check.** Open this lesson in the courses UI (http://127.0.0.1:8091/). Use the **Interactive lab** panel: **Start lab** clears leftovers; then press **Check**. Auto-check target: **Task 1 state** — Deployment `web`, 2 replicas of `nginx:1.27.1`, all Ready (image after the Task 3 rollback). Later tasks scale/break the Deployment, so run Check while it's on 2× `nginx:1.27.1`. **Cleanup** removes this lab's resources.

## Task 1. Create a Deployment

Use this `deploy.yaml` example. It intentionally differs from theory (2 replicas and `nginx:1.27.1`):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.27.1
          ports:
            - containerPort: 80
```

Apply it:

```bash
kubectl apply -f deploy.yaml
kubectl get deploy
kubectl get rs
kubectl get pods -l app=web
```

**Check:** one Deployment, one ReplicaSet, two Pods, all `Running`.

## Task 2. Rolling update

1. Update the image:
   ```bash
   kubectl set image deploy/web web=nginx:1.28
   ```
2. Right away:
   ```bash
   kubectl rollout status deploy/web
   kubectl get rs -l app=web
   ```

**Check:** a new ReplicaSet appears, the old one drops to `0` replicas, and the Pods now run the new image:

```bash
kubectl get pods -l app=web -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[0].image}{"\n"}{end}'
```

## Task 3. History and rollback

```bash
kubectl rollout history deploy/web
kubectl rollout undo deploy/web
kubectl rollout status deploy/web
```

**Check:** the Deployment is back on the previous revision, the image is `nginx:1.27.1` again.

## Task 4. A broken release

1. Deploy an image that clearly doesn't exist:
   ```bash
   kubectl set image deploy/web web=nginx:does-not-exist
   ```
2. Check the status:
   ```bash
   kubectl rollout status deploy/web --timeout=30s
   kubectl get pods -l app=web
   ```

**What should happen:** you'll see Pods stuck in `ImagePullBackOff`. Under the default `RollingUpdate` strategy, the old Pods stick around so the service doesn't go down entirely.

3. Roll it back:
   ```bash
   kubectl rollout undo deploy/web
   ```

## Task 5. Scaling

1. Scale up to 6 replicas:
   ```bash
   kubectl scale deploy/web --replicas=6
   ```
2. Scale down to 2.

**Check:** `kubectl get pods -l app=web` shows the matching number of Pods.

## Task 6. The Recreate strategy

1. Copy `deploy.yaml` to `deploy-recreate.yaml`, rename the Deployment to `web-recreate`, and add:
   ```yaml
   spec:
     strategy:
       type: Recreate
   ```
2. Apply it, then update the image. Compare the behavior with `RollingUpdate`.

**What you'll see:** with `Recreate`, every old Pod dies first, and only then do the new ones come up.

## Cleanup

```bash
kubectl delete -f deploy.yaml
kubectl delete deploy web-recreate --ignore-not-found
```

## Check yourself

1. What's the difference in responsibility between a Deployment and a ReplicaSet?
2. What happens if you change `template.metadata.labels` without touching `selector.matchLabels`?
3. In plain terms, what does `maxSurge=1, maxUnavailable=0` actually mean?
