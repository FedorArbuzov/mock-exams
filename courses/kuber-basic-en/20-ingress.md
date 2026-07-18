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
[browser] -> the controller's NodePort/LoadBalancer -> Ingress Controller (Pod) -> Service -> Pod
```

So a Service still sits at the end of the chain — Ingress is really "a router that sits in front of your Services."

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

## Ingress on minikube

minikube ships with a ready-made **ingress-nginx** addon:

```bash
minikube -p mock-exams addons enable ingress
kubectl get pods -n ingress-nginx
```

Once that's running, `ingressClassName: nginx` will work.

For the hostname `app.local` to resolve to minikube's IP, add a line to your hosts file:

- Windows: `C:\Windows\System32\drivers\etc\hosts`
- macOS / Linux: `/etc/hosts`

```
<minikube ip>   app.local
```

Get that IP with:

```bash
minikube -p mock-exams ip
```

## Commands worth knowing

```bash
kubectl get ingress
kubectl describe ingress web
kubectl get ingressclass
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller
```
