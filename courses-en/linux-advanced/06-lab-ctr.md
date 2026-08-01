# 06. Lab: ctr and the runtime on a node

## Lab goal

Observe the chain **image → containerd/crictl → runtime version** on a training machine or K8s node. `ctr` may be absent in the lab image — in that case use the equivalent via **docker on the host** and **kubectl** on the cluster.

## Prerequisites

- [05. containerd](05-containerd.md).
- lab stand; optionally a host with Docker / mockctl.

---

## Preparing the stand

```bash
docker compose exec lab bash
which ctr crictl docker 2>/dev/null
```

---

## Task 1. Checking tools in lab

```bash
ctr version 2>/dev/null || echo "ctr not in lab image"
crictl version 2>/dev/null || echo "crictl not in lab image"
```

**Why:** lab is not a full K8s node; the tools may only be on the host.

---

## Task 2. Docker on the host (pull/run equivalent)

On the **host** (Windows/WSL or Linux), directory `deploy/linux`:

```bash
docker version --format '{{.Server.Version}}'
docker images | head -6
docker run --rm hello-world
```

**What you'll see:** pull/run goes through the same OCI-image model (via dockerd → containerd on modern Docker).

---

## Task 3. ctr pull (if ctr is available)

On a machine with containerd:

```bash
sudo ctr images pull docker.io/library/alpine:latest
sudo ctr images ls | grep alpine
```

In lab, if you install `ctr`:

```bash
sudo apt install -y containerd 2>/dev/null
sudo ctr images pull docker.io/library/alpine:latest
```

---

## Task 4. Runtime version on Kubernetes

On a host with **mockctl** / minikube / kind:

```bash
kubectl get nodes -o wide
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.nodeInfo.containerRuntimeVersion}{"\n"}{end}'
```

**What you'll see:** `containerd://...` or `docker://...`.

---

## Task 5. crictl on a node (optional)

SSH into a worker (if available):

```bash
sudo crictl ps
sudo crictl images | head -10
```

Compare with `kubectl get pods -o wide` — the same containers, a different interface.

---

## Task 6. Short notes

In `/tmp/runtime-notes.txt` on lab (one paragraph):

- how `docker ps` differs from `crictl ps`;
- who calls runc in K8s.

---

## Success criteria

- [ ] You understand the chain kubelet → CRI → containerd → runc
- [ ] You saw `docker images` or `ctr images ls`
- [ ] You saw containerRuntimeVersion on the node **or** noted "no cluster — see theory"

## What to take to work

- On a worker: **`crictl`**, not docker.
- ImagePullBackOff — `crictl pull` / registry auth on the **node**.
- Disk space: `/var/lib/containerd`.

Next lesson: [07. Preparing a K8s node](07-k8s-node-prep.md).
