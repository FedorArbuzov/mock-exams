# 10. Deployment

## What it is

**Deployment** is the object you'll reach for most often to run stateless applications. It:

- Creates and manages a **ReplicaSet**.
- Keeps the right **number of replicas** running.
- Performs **rolling updates** (gradual rollout) and **rollbacks**.
- Can be **paused** and resumed mid-rollout.

The hierarchy:

```
Deployment  -->  ReplicaSet  -->  Pods
```

Change the template in a Deployment, and it creates a **new ReplicaSet** for the new version and gradually shifts Pods over to it.

## A minimal Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels:
    app: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          ports:
            - containerPort: 80
```

```bash
kubectl apply -f deploy.yaml
kubectl get deploy
kubectl get rs
kubectl get pods -l app=web
```

## Update strategies

Set in `spec.strategy.type`:

- **RollingUpdate** (the default) — gradually brings up new Pods and retires old ones. Controlled by:
  - `maxSurge` — how many Pods *above* `replicas` are allowed temporarily.
  - `maxUnavailable` — how many can be unavailable during the rollout.
- **Recreate** — kills all the old Pods first, then creates the new ones. Simple, but causes downtime.

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

## Updating the image and rolling back

Change the image:

```bash
kubectl set image deploy/web nginx=nginx:1.27.1
kubectl rollout status deploy/web
```

Rollout history:

```bash
kubectl rollout history deploy/web
kubectl rollout history deploy/web --revision=2
```

Rolling back:

```bash
kubectl rollout undo deploy/web                 # back to the previous revision
kubectl rollout undo deploy/web --to-revision=1
```

Pause / resume:

```bash
kubectl rollout pause deploy/web
kubectl rollout resume deploy/web
```

## Scaling

```bash
kubectl scale deploy/web --replicas=5
```

or just change `replicas` in the YAML and `kubectl apply -f` again.

## Commands worth knowing

```bash
kubectl get deploy
kubectl describe deploy web
kubectl get rs -l app=web         # you'll see both the old and the new RS
kubectl get pods -l app=web -o wide
kubectl logs deploy/web           # logs from a random Pod in the Deployment
```

## When Deployment isn't the right tool

- For stateful apps (databases, queues — anything needing stable names/storage) — use a **StatefulSet**.
- For "one agent per node" workloads (log shippers, monitoring) — use a **DaemonSet**.
- For one-off tasks — a **Job**; for scheduled tasks — a **CronJob**.
