# 09. RBAC: ServiceAccount, Role, RoleBinding

## What RBAC is

**Role-Based Access Control** is a model in which permissions are granted not to a "person" but to a **role**. A role = a set of permissions; you bind the role to a subject (a user, group, or ServiceAccount).

In Kubernetes, RBAC is built from four objects:

| Object | Level | What it does |
|---|---|---|
| `Role` | namespace | A list of permissions within a single namespace |
| `ClusterRole` | cluster | A list of permissions across the whole cluster (or for cluster-scoped resources) |
| `RoleBinding` | namespace | Binds a Role or ClusterRole to a subject within a namespace |
| `ClusterRoleBinding` | cluster | Binds a ClusterRole to a subject globally |

## Who the "subjects" are

In Kubernetes there are three types of subjects:

1. **User** — an external user (for example, via a certificate, OIDC). The `User` object itself is **not stored** in k8s, it's just a string.
2. **Group** — a group of such external users.
3. **ServiceAccount** — an "account" for **pods**. It's a real object (`ServiceAccount`) in a namespace.

When a pod talks to the API, it does so **as its ServiceAccount**. By default this is `default` in its namespace.

## Minimal Role and RoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ServiceAccount
metadata:
  name: reader
  namespace: dev
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: dev
rules:
  - apiGroups: [""]            # core API group ("" = pods, services, configmaps, ...)
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: reader-can-read-pods
  namespace: dev
subjects:
  - kind: ServiceAccount
    name: reader
    namespace: dev
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

After apply:

- ServiceAccount `reader` in namespace `dev`.
- Any pod running with `serviceAccountName: reader` can read pods in `dev`. Nothing else.

## How `rules` work

Each entry in `rules` means "you can do `verbs` on `resources` in `apiGroups`". You can list several in an array:

```yaml
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "statefulsets"]
    verbs: ["*"]                  # all verbs
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames: ["my-secret"]  # scoped: you can only work with this Secret
    verbs: ["get"]
```

Standard `verbs`: `get`, `list`, `watch`, `create`, `update`, `patch`, `delete`, `deletecollection`. The special verb `impersonate` is about delegation; `bind` and `escalate` are about creating roles.

## How to find `apiGroups` and `resources`

```bash
kubectl api-resources
```

You'll see a table:

```text
NAME              SHORTNAMES   APIVERSION       NAMESPACED   KIND
pods              po           v1               true         Pod
services          svc          v1               true         Service
deployments       deploy       apps/v1          true         Deployment
storageclasses    sc           storage.k8s.io/v1   false     StorageClass
```

`apiGroups`: for core objects (Pod, Service) it's the empty string `""`. For `apps/v1` it's `"apps"`. For `storage.k8s.io/v1` it's `"storage.k8s.io"`.

## ClusterRole + RoleBinding

Sometimes you want to define a **set of permissions** once globally and apply it in different namespaces. In that case:

- `ClusterRole` — describes the permissions (like a Role, but not tied to a namespace).
- A `RoleBinding` in a namespace **can reference a ClusterRole** — the permissions will apply **only in that namespace**.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: pod-reader-everywhere
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: reader-in-staging
  namespace: staging
subjects:
  - kind: ServiceAccount
    name: reader
    namespace: staging
roleRef:
  kind: ClusterRole          # ← reference to a ClusterRole
  name: pod-reader-everywhere
  apiGroup: rbac.authorization.k8s.io
```

A `ClusterRoleBinding` is only needed when the permissions are truly global (for cluster-scoped resources or for all namespaces at once).

## Built-in roles

Out of the box, Kubernetes provides these ClusterRoles:

- `cluster-admin` — everything in the world.
- `admin` — almost everything in a namespace, except quotas.
- `edit` — editing objects in a namespace.
- `view` — read only.

They're often used via a RoleBinding:

```yaml
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io
```

## Checking permissions: `kubectl auth can-i`

```bash
kubectl auth can-i create deploy
kubectl auth can-i get pod -n kube-system
kubectl auth can-i '*' '*' --all-namespaces        # am I cluster-admin?

# Checking as a ServiceAccount:
kubectl auth can-i list pods --as=system:serviceaccount:dev:reader -n dev
```

## Useful commands

```bash
kubectl get sa,roles,rolebindings -n dev
kubectl get clusterroles,clusterrolebindings
kubectl describe rolebinding reader-can-read-pods -n dev
kubectl auth can-i ... --as=...
```

## Checklist

- What's the difference between a Role and a ClusterRole?
- What happens if you bind a ServiceAccount to a ClusterRole via a RoleBinding (not a ClusterRoleBinding) in namespace `dev`?
- Which ServiceAccount does a pod use by default if you specify nothing?
- How does "scoped access" (`resourceNames`) differ from "all pods"?
- How do you check "can pod X do Y" without running the pod itself?

In the lab [10-lab-rbac.md](10-lab-rbac.md) we'll give a pod kubectl access and restrict it strictly to a single namespace.
