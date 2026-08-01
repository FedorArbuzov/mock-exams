# 21. Lab: Ingress

The goal: stand up an Ingress controller and route two apps behind one host, split by path.

> **Interactive check.** In `mockctl web`, use the **Interactive lab** panel under the title. **Start lab** clears the `web`/`api` Deployments+Services and the `app` Ingress. Auto-check target: **Tasks 1–2** — Deployments `web`/`api` Ready, Services `web`/`api` exist, Ingress `app` exists (routing/TLS behaviour stays a manual `curl` check). **Cleanup** removes all of them.

## Setup

Enable the ingress addon on minikube:

```bash
minikube -p mock-exams addons enable ingress
kubectl get pods -n ingress-nginx
```

Get the cluster's IP:

```bash
minikube -p mock-exams ip
```

Add a line to your hosts file:

```
<that IP>   app.local
```

(Windows: `C:\Windows\System32\drivers\etc\hosts`, macOS/Linux: `/etc/hosts`).

## Task 1. Two applications

Use this `apps.yaml` example with two Deployment + Service pairs (you can change response text, but keep names/selectors):

| App | Deployment name | Label | http-echo text | Service port → container |
|---|---|---|---|---|
| web | `web` | `app=web` | `hello from WEB` | 80 → 5678 |
| api | `api` | `app=api` | `hello from API` | 80 → 5678 |

Use image `hashicorp/http-echo:1.0`, `replicas: 1`, and matching selectors:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: hashicorp/http-echo:1.0
          args: ["-text=hello from WEB APP"]
          ports:
            - containerPort: 5678
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 5678
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: hashicorp/http-echo:1.0
          args: ["-text=hello from API APP"]
          ports:
            - containerPort: 5678
---
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 5678
```

```bash
kubectl apply -f apps.yaml
kubectl get pods,svc
```

## Task 2. An Ingress with two paths

Use this `ingress.yaml` example (same logic as lesson 20, but tweak fields if you want):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: app.local
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 80
```

```bash
kubectl apply -f ingress.yaml
kubectl get ingress
```

Check it:

```bash
curl http://app.local/
curl http://app.local/api
```

**Check:** `/` returns `hello from WEB`, `/api` returns `hello from API`.

## Task 3. Routing by host

Add `web.local` and `api.local` to your hosts file (same IP as before). Rewrite `ingress.yaml` so **each host** has its own rule — `web.local` → Service `web`, `api.local` → Service `api`, both path `/`.

```bash
curl http://web.local
curl http://api.local
```

## Task 4. A broken Ingress

1. Change `service.name: api` to a Service that doesn't exist, say `apii`.
2. Apply it and check:
   ```bash
   kubectl describe ingress app
   kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=50
   ```

**What should happen:** the controller's logs warn about an unknown Service; `/api` starts returning a 503/404 (the exact code depends on the controller version). Put it back the way it was.

## Task 5. TLS

The theory lesson covered `spec.tls` — let's actually use it. Generate a self-signed certificate for `app.local`:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout app-tls.key -out app-tls.crt \
  -subj "/CN=app.local/O=app.local"
```

Turn it into a TLS Secret:

```bash
kubectl create secret tls app-tls --cert=app-tls.crt --key=app-tls.key
```

Add a `spec.tls` block to your Ingress (hosts `[app.local]`, secret `app-tls`) — lesson 20 explains the fields. Example:

```yaml
spec:
  ingressClassName: nginx
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
                port:
                  number: 80
```

```bash
kubectl apply -f ingress.yaml
curl -k https://app.local/
```

**Check:** `curl -k` (skip cert verification, since it's self-signed) gets back `hello from WEB` over HTTPS. Plain `curl https://app.local/` without `-k` fails with a certificate error — that's expected for a self-signed cert.

## Cleanup

```bash
kubectl delete -f ingress.yaml
kubectl delete -f apps.yaml
kubectl delete secret app-tls --ignore-not-found
```

(Remove the hosts file entries too, if you don't need them anymore.)

## Check yourself

1. How does Ingress differ from a Service of type `LoadBalancer`?
2. Why do you need a separate Ingress Controller, on top of the Ingress object itself?
3. What happens when an Ingress rule points at a Service that doesn't exist?
