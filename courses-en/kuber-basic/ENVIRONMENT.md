# Environment for Kubernetes Basic

This course uses **Docker Desktop Kubernetes** and the **courses UI** (`mockctl-web`). You do not need minikube or the `mockctl` CLI.

## One-time setup

Follow [QUICKSTART.md](../../QUICKSTART.md):

1. Install Docker Desktop.
2. Enable Kubernetes (Settings → Kubernetes → Enable → Apply).
3. Run the one-liner for your OS.
4. Open **http://127.0.0.1:8091/** for lessons and interactive labs.

Sanity check:

```bash
kubectl config use-context docker-desktop
kubectl get nodes
```

Nodes should be **Ready** (one control-plane node is enough for this course; a worker is fine too).

## Interactive labs

Open the lesson in the courses UI. Under the title you will see an **Interactive lab** panel:

- **Start lab** — prepare / clear leftovers
- **Check** — auto-verify against the lab target
- **Cleanup** — delete this lab’s resources (cluster keeps running)

## Optional addons

### metrics-server (lessons 14–15)

Needed for `kubectl top`:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

On Docker Desktop, metrics-server may need insecure TLS to the kubelet. If `kubectl top` stays empty, patch:

```bash
kubectl -n kube-system patch deployment metrics-server --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

Wait until the metrics-server Pod is Ready, then retry `kubectl top nodes`.

### ingress-nginx (lessons 20–21, 24)

Install with Helm (not a minikube addon):

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.service.type=NodePort \
  --set controller.service.nodePorts.http=32080
```

Need Helm? https://helm.sh/docs/intro/install/

Verify:

```bash
kubectl -n ingress-nginx get pods,svc
# controller Service should show 80:32080/TCP
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:32080/
# 404 (or similar) means the controller answers; 000 means nothing listens yet
```

On Docker Desktop, NodePorts are reachable on **localhost**.

## Reaching Services from your host

| Method | Example |
|--------|---------|
| port-forward | `kubectl port-forward svc/web 8080:80` → http://127.0.0.1:8080 |
| NodePort | `http://127.0.0.1:<nodePort>/` |

## Cleanup a lab namespace

```bash
kubectl delete namespace <name>
```

Do **not** disable Docker Desktop Kubernetes between labs unless you want a full reset.
