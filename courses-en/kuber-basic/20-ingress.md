# 20. Ingress

## Why it exists

A `Service` of type **NodePort** or **LoadBalancer** gives you "one port per app." Once you have more than a couple of apps, that gets awkward:

- Provisioning a load balancer per Service gets expensive.
- You'd like to route **by hostname** and **by path** (`/api`, `/admin`).
- You'd like to configure TLS once, in one place.

That's the job of **Ingress** plus an **Ingress Controller**.

## Two different things, same name

- **Ingress** is an *object* in the cluster describing routing rules — hosts, paths, backend Services.
- **Ingress Controller** is an *application* (a Pod or set of Pods) that reads all the Ingress objects and actually implements the routing. Without a controller, an Ingress object does nothing at all.

Common controllers: **ingress-nginx**, Traefik, HAProxy, or cloud-managed ones (AWS ALB, GCE Ingress).

## How the traffic actually flows

```
[browser] → how the controller is exposed → Ingress Controller (Pod) → Service → app Pod
```

Two layers people mix up:

1. **Your apps** usually stay behind **ClusterIP** Services. Clients do not hit them directly from outside.
2. **The Ingress Controller** is itself a Deployment/Pod. Something must expose *it* to the outside world — that “something” is almost always a Service in front of the controller.

Until that second piece exists, Ingress objects do nothing useful for browsers.

## How the Ingress Controller is exposed

The Ingress *object* only describes routes. The controller Pod still needs an entry point. Common options:

### 1. NodePort (bare metal, labs, Docker Desktop)

A Service of type **NodePort** opens the same high port (30000–32767) on **every node**. Traffic:

```
client → <any-node-IP>:<nodePort> → kube-proxy → controller Pod → your Ingress rules → app Service
```

On Docker Desktop, node ports are also reachable as `http://127.0.0.1:<nodePort>/`.

Example shape of the controller Service:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
  type: NodePort
  selector:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/component: controller
  ports:
    - name: http
      port: 80
      targetPort: http
      nodePort: 32080   # fixed; otherwise Kubernetes picks a random port
    - name: https
      port: 443
      targetPort: https
      # nodePort for 443 can stay automatic
```

Pros: works everywhere without a cloud LB.  
Cons: ugly ports; you must know a node IP (or use localhost on Docker Desktop).

In the [final project](24-final-project.md) you install the controller with a **fixed** NodePort `32080` and curl `http://127.0.0.1:32080/`.

### 2. LoadBalancer (cloud / MetalLB)

Same idea as NodePort, but the cloud (or MetalLB) also allocates an **EXTERNAL-IP**:

```
client → EXTERNAL-IP:80 → controller Service (type LoadBalancer) → controller Pod → …
```

Pros: looks like a normal website (`http://a.b.c.d/` or a DNS name).  
Cons: needs a provider that can create LBs; on plain Docker Desktop you usually do **not** get a real EXTERNAL-IP without extra tooling.

Cloud controllers (AWS ALB Ingress, GCE Ingress) often skip “nginx in a Pod” and program the cloud LB from Ingress objects directly — same *idea* (one entry, many routes), different implementation.

### 3. hostNetwork (less common)

The controller Pod shares the **node’s network namespace** and binds ports **80/443 on the node** itself. No NodePort needed for those ports.

Pros: classic ports without a cloud LB.  
Cons: only one such Pod per node; harder networking/security story; awkward with many nodes.

### 4. Edge proxy / LB outside the cluster

In production you often have a cloud LB or a reverse proxy **outside** Kubernetes that forwards to the controller’s NodePort (or to node IPs). Conceptually:

```
browser → localhost:8080 (edge nginx / cloud LB)
       → nodeIP:32080 (Ingress Controller NodePort)
       → Ingress Controller Pod
       → Ingress rules → ClusterIP Services → app Pods
```

The edge piece is **not** an Ingress object. It only solves “how do I reach the controller from outside?” Path routing (`/`, `/api`, `/admin`) still belongs to Ingress.

On Docker Desktop for this course we skip a separate edge proxy and hit the NodePort on **localhost** directly.

### Quick comparison

| Exposure | Who listens for clients | Typical use |
|---|---|---|
| **NodePort** | every node on e.g. `:32080` (or `localhost` on DD) | labs, bare metal |
| **LoadBalancer** | cloud/MetalLB EXTERNAL-IP `:80` | AWS/GCP/Azure, MetalLB on-prem |
| **hostNetwork** | node `:80` / `:443` | small clusters, special setups |
| **Edge LB + NodePort** | `localhost:8080` → nodes `:32080` | production-shaped local stand |

### What to look at in the cluster

```bash
kubectl -n ingress-nginx get deploy,svc
kubectl -n ingress-nginx get svc ingress-nginx-controller -o wide
```

Check `TYPE` (`NodePort` / `LoadBalancer`) and `PORT(S)` (e.g. `80:32080/TCP`). That row is “how the controller is exposed.” Your app Services stay ClusterIP.

## A minimal Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: app.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 80
```

The fields:

- **`ingressClassName`** — which controller should handle this Ingress.
- **`rules[].host`** — the `Host:` header this rule matches (leave it out, and the rule matches any host).
- **`paths[].path`** + **`pathType`** (`Exact` / `Prefix` / `ImplementationSpecific`).
- **`backend.service`** — which Service and port to forward to.

> A quick aside on that `annotations` block: unlike `labels`, which you use to be *found* by selectors, **annotations** attach extra metadata that a specific controller (here, ingress-nginx) reads to change its own behavior — they're not meant to be selected on.

## TLS

```yaml
spec:
  tls:
    - hosts: [app.local]
      secretName: app-tls
  rules:
    - host: app.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port: { number: 80 }
```

The `Secret` (type `kubernetes.io/tls`) holds `tls.crt` and `tls.key`.

## Routing

### By host

```yaml
rules:
  - host: api.local
    http:
      paths:
        - path: /
          pathType: Prefix
          backend: { service: { name: api,  port: { number: 80 } } }
  - host: web.local
    http:
      paths:
        - path: /
          pathType: Prefix
          backend: { service: { name: web,  port: { number: 80 } } }
```

### By path

```yaml
rules:
  - host: app.local
    http:
      paths:
        - path: /api
          pathType: Prefix
          backend: { service: { name: api, port: { number: 80 } } }
        - path: /
          pathType: Prefix
          backend: { service: { name: web, port: { number: 80 } } }
```

## Ingress on Docker Desktop (lab path)

For lessons **20–21** and the [final project](24-final-project.md), install **ingress-nginx** with Helm (same idea as a managed addon, but you control NodePort):

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.service.type=NodePort \
  --set controller.service.nodePorts.http=32080

kubectl get pods -n ingress-nginx
kubectl -n ingress-nginx get svc ingress-nginx-controller
# expect 80:32080/TCP
```

Need Helm? https://helm.sh/docs/intro/install/ — also see [ENVIRONMENT.md](ENVIRONMENT.md).

Once the controller is running, `ingressClassName: nginx` works for Ingress objects.

On Docker Desktop, hit the controller on localhost:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:32080/
# 404 (no Ingress rules yet) means the controller is up
```

For hostname routing (`app.local`), add a line to your hosts file pointing at **127.0.0.1**:

- Windows: `C:\Windows\System32\drivers\etc\hosts`
- macOS / Linux: `/etc/hosts`

```
127.0.0.1   app.local
```

Then curl with an explicit port (or use `--resolve`):

```bash
curl http://app.local:32080/
curl --resolve app.local:32080:127.0.0.1 http://app.local:32080/
```

> **Final project** uses the same Helm install with fixed NodePort `32080`. See [24-final-project.md](24-final-project.md).

## Commands worth knowing

```bash
kubectl get ingress
kubectl describe ingress web
kubectl get ingressclass
kubectl -n ingress-nginx get deploy,svc
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller
```

## Self-check

1. What is the difference between an **Ingress** object and an **Ingress Controller**?
2. Why do app Services stay ClusterIP while the controller Service is often NodePort or LoadBalancer?
3. Name two ways to expose the controller. When would you prefer each?
4. In the traffic path `browser → ? → controller → Service → Pod`, what can sit in the `?` slot?
