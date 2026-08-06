# 2. Docker vs containerd

> For hands-on work with images and compose, see [`containers-basic`](../containers-basic/README.md) ([`deploy/containers`](../../deploy/containers/README.md)). This lesson is only about how it maps onto Kubernetes.

## The short version

- **Docker** is a **toolkit** for developers: the `docker` CLI, a daemon, image building, a registry, networking, and so on.
- **containerd** is a **container runtime** — a low-level engine that actually runs containers.

**Docker uses containerd under the hood.** containerd is the engine; Docker is the dashboard built around it.

## The layers

```
[User] -> docker CLI
            |
            v
         dockerd (the Docker daemon)
            |
            v
         containerd
            |
            v
         runc (starts the process in a Linux namespace/cgroup)
```

## Why this matters for Kubernetes

kubelet used to talk to Docker through a shim called **dockershim**. Starting with **Kubernetes 1.24**, dockershim was removed. Now kubelet talks to the runtime directly through **CRI** (the Container Runtime Interface).

Most clusters today run **containerd** or **CRI-O** as the runtime — not Docker.

| | **Docker** | **containerd** |
|---|------------|-----------------|
| Level | High (CLI, build, registry…) | Low (running containers) |
| CLI | `docker` | `ctr`, `crictl` |
| Used as a Kubernetes runtime? | No longer (only via a shim) | Yes, by default |
| Where you'll run into it | Developer machines, CI | Inside cluster nodes |

## On your cluster

Check the runtime your cluster uses:

```bash
kubectl get nodes -o wide
```

The `CONTAINER-RUNTIME` column will typically show `containerd://...` (common on Docker Desktop Kubernetes).

## What to actually use day to day

- On your own machine you still reach for **Docker** — build an image, push it to a registry, run it locally.
- Inside the cluster, containers are started by **containerd**, and that's completely invisible to you as a cluster user — you work through `kubectl`, not the runtime directly.

Underneath it all: Linux **namespaces** and **cgroups** ([`linux-advanced`](../linux-advanced/01-namespaces.md), [`linux-advanced/03-cgroups`](../linux-advanced/03-cgroups.md)).
