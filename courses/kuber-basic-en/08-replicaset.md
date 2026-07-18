# 8. ReplicaSet

## What it is

A **ReplicaSet (RS)** is a controller that **keeps a fixed number of identical Pods running**. If a Pod dies or gets deleted, the RS creates a replacement. If there are too many, the extras get removed.

The fields that matter:

- **`replicas`** — how many Pods should exist.
- **`selector`** — which labels the RS uses to decide "these Pods are mine."
- **`template`** — the Pod template (identical to a regular Pod manifest, just without `kind: Pod`).

## A minimal example

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: web-rs
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

Apply it:

```bash
kubectl apply -f rs.yaml
kubectl get rs
kubectl get pods -l app=web
```

## How an RS finds "its" Pods

Through the **selector**. Any Pod in the cluster whose labels match `matchLabels` counts as belonging to the RS — even if you created that Pod separately.

That's why the **labels in `selector` and in `template.metadata.labels` need to line up**. Get them out of sync and the cluster will either keep spinning up extra Pods or complain endlessly.

## What a ReplicaSet can do

- Keep the Pod count steady: `kubectl scale rs/web-rs --replicas=5`.
- Self-heal: delete one of its Pods, and it creates a replacement.

## What a ReplicaSet can't do

- **It won't roll out an image update smoothly.** Change `template.spec.containers[].image` and the RS **will not** perform a rolling update — that's a **Deployment**'s job.
- In real life, **you almost never write a ReplicaSet by hand** — you write a Deployment, and it manages the ReplicaSet underneath.

## Commands worth knowing

```bash
kubectl get rs
kubectl describe rs web-rs
kubectl scale rs/web-rs --replicas=5
kubectl delete rs web-rs              # also deletes the Pods it owns
```

Seeing the ownership chain:

```bash
kubectl get pods -o wide
kubectl get pod <pod> -o jsonpath='{.metadata.ownerReferences}'
```
