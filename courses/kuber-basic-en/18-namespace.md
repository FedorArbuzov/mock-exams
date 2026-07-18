# 18. Namespace

## What it is

A **Namespace** is a "folder" inside a cluster for grouping objects. It's how a single cluster gets divided up between:

- different teams or applications;
- environments (`dev`, `staging`, `prod`) — though for production it's usually a separate cluster, not just a separate namespace;
- temporary sandboxes for experiments.

Within one namespace, **object names must be unique**; across namespaces, names can repeat freely (`web` in `team-a` and `web` in `team-b` are **completely different** objects).

## What a Namespace gives you

- **Name isolation** for most objects (Pod, Deployment, Service, ConfigMap, Secret, etc.).
- A place to attach **RBAC** rules (grant access scoped to just this namespace).
- A place to attach **ResourceQuota** (CPU/memory/object-count limits) and **LimitRange** (defaults for containers that don't set their own). These get their own hands-on treatment in [`kuber-intermediate`](../kuber-intermediate/README.md) — here, just know they exist and that a Namespace is where they attach.
- A scope for **NetworkPolicy** — rules about which Pods can talk to which. Also covered properly in `kuber-intermediate`.

## What does *not* get scoped by Namespace

Cluster-scoped resources: `Node`, `PersistentVolume`, `ClusterRole`, `Namespace` itself, and so on.

```bash
kubectl api-resources --namespaced=true
kubectl api-resources --namespaced=false
```

## The built-in namespaces

- **`default`** — where objects land if you don't specify one.
- **`kube-system`** — Kubernetes' own system components (api-server, coredns, etc.).
- **`kube-public`** — publicly readable cluster info.
- **`kube-node-lease`** — node heartbeats.

## Commands

Creating one:

```bash
kubectl create namespace dev
# or
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Namespace
metadata:
  name: dev
EOF
```

Looking at them:

```bash
kubectl get ns
kubectl get pods -n dev
kubectl get all -n dev
```

Applying a manifest into a specific namespace:

```bash
kubectl apply -f deploy.yaml -n dev
```

or just set `metadata.namespace: dev` directly in the manifest (then it lands there even without `-n`).

Switching your "current" namespace in the context, so you don't have to type `-n` every time:

```bash
kubectl config set-context --current --namespace=dev
kubectl config view --minify | grep namespace
```

Deleting a namespace (and everything in it):

```bash
kubectl delete ns dev
```

## DNS and Services across namespaces

- Inside the same namespace — just `web`.
- From another namespace — `web.dev`, or the fully qualified `web.dev.svc.cluster.local`.

## When you *don't* need a new namespace

- When the cluster really only has one app and one team — `default` is fine.
- When you need **full isolation** (network quotas, resource limits, security boundaries) — a separate cluster is the better call, not just another namespace.
