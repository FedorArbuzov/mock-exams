# Environment for Kubernetes Intermediate

Same base as [`kuber-basic/ENVIRONMENT.md`](../kuber-basic/ENVIRONMENT.md): **Docker Desktop Kubernetes** + courses UI. You do not need minikube or the `mockctl` CLI.

## One-time setup

1. Follow [QUICKSTART.md](../../QUICKSTART.md).
2. Open http://127.0.0.1:8091/
3. Sanity check:

```bash
kubectl config use-context docker-desktop
kubectl get nodes
```

A **worker node** (`desktop-worker`) is useful for PDB / drain labs, but not required for most lessons.

## Interactive labs

Open the lesson in the courses UI → **Interactive lab** panel (**Start lab** / **Check** / **Cleanup**).

## Tools this course needs

### Helm (lessons 7–8, final project Ingress)

```bash
# macOS
brew install helm
# Windows
winget install Helm.Helm
# Linux
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

helm version
```

### metrics-server (lessons 16–18, HPA, final project)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

If `kubectl top` stays empty on Docker Desktop:

```bash
kubectl -n kube-system patch deployment metrics-server --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

### ingress-nginx (final project)

Same as basic — fixed NodePort **32080**:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.service.type=NodePort \
  --set controller.service.nodePorts.http=32080
```

Hit apps at `http://127.0.0.1:32080/` (or `http://app.local:32080/` with hosts → `127.0.0.1`).

### StorageClass (lessons 1–4)

Discover what Docker Desktop gives you — do **not** assume minikube’s `standard` / `minikube-hostpath`:

```bash
kubectl get sc
# note the (default) class and its PROVISIONER column
```

When a lab asks for a custom StorageClass, reuse **that provisioner** (copy from the default SC).

```bash
kubectl get sc -o jsonpath='{.items[?(@.metadata.annotations.storageclass\.kubernetes\.io/is-default-class=="true")].provisioner}{"\n"}'
```

### NetworkPolicy / Calico (lessons 11–12, final step 8) — optional

Docker Desktop’s default CNI usually **does not enforce** NetworkPolicy. Objects apply, but traffic is not blocked.

- Treat lessons **11–12** as **optional** unless you have a Calico (or other policy-capable) CNI.
- Final project step 8 already says **skip** without Calico — keep it that way on Docker Desktop.

If you still want a Calico lab cluster, use a separate local tool (e.g. minikube/kind with `--cni=calico`) — that is outside the main Docker Desktop path.

## Drain labs (19–20)

Prefer draining a **worker**, not the control-plane:

```bash
kubectl get nodes
kubectl drain desktop-worker --ignore-daemonsets --delete-emptydir-data --grace-period=30
# when done:
kubectl uncordon desktop-worker
```

On a single-node cluster, drain is only a demo (pods have nowhere to move).
