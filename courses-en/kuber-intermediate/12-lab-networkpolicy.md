# 12. Lab: "lock down" a namespace except for one client

## Setup

This lab requires **calico** in minikube. If you don't have it yet:

```bash
mockctl down
minikube start -p mock-exams --driver=docker --cni=calico
mockctl kubeconfig
```

Then:

```bash
kubectl create namespace secure
kubectl create namespace clients
kubectl label namespace clients name=clients
```

## Task 1. Deploy a "victim" and "two clients"

`backend.yaml` (in namespace `secure`):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: secure
spec:
  selector:
    app: backend
  ports:
    - port: 80
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: secure
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: nginx
          image: nginx:1.27-alpine
```

`clients.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ally
  namespace: clients
  labels:
    role: ally
spec:
  containers:
    - name: c
      image: busybox
      command: ["sleep", "3600"]
---
apiVersion: v1
kind: Pod
metadata:
  name: stranger
  namespace: clients
  labels:
    role: stranger
spec:
  containers:
    - name: c
      image: busybox
      command: ["sleep", "3600"]
```

```bash
kubectl apply -f backend.yaml -f clients.yaml
kubectl wait --for=condition=ready pod -l app=backend -n secure
kubectl wait --for=condition=ready pod/ally pod/stranger -n clients
```

## Task 2. Verify that everything is currently open

```bash
kubectl exec -n clients ally     -- wget -qO- --timeout=3 http://backend.secure
kubectl exec -n clients stranger -- wget -qO- --timeout=3 http://backend.secure
```

**What you'll see:** both clients get the nginx page. By default there are no restrictions.

## Task 3. Default-deny

`netpol-deny.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: secure
spec:
  podSelector: {}
  policyTypes: [Ingress]
```

```bash
kubectl apply -f netpol-deny.yaml
kubectl exec -n clients ally     -- wget -qO- --timeout=3 http://backend.secure || echo blocked
kubectl exec -n clients stranger -- wget -qO- --timeout=3 http://backend.secure || echo blocked
```

**What you'll see:** both requests hang until timeout (`blocked`). Ingress into `secure` is closed for everyone.

## Task 4. Allow only `ally`

`netpol-allow-ally.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ally
  namespace: secure
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes: [Ingress]
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: clients
          podSelector:
            matchLabels:
              role: ally
      ports:
        - port: 80
          protocol: TCP
```

Note: `namespaceSelector` and `podSelector` are specified **as a single element** in `from` — this means AND.

```bash
kubectl apply -f netpol-allow-ally.yaml
kubectl exec -n clients ally     -- wget -qO- --timeout=3 http://backend.secure
kubectl exec -n clients stranger -- wget -qO- --timeout=3 http://backend.secure || echo blocked
```

**What you'll see:** `ally` gets the page, `stranger` is blocked.

## Task 5. Experiment with OR

Replace `from` so that there are two **separate** elements:

```yaml
ingress:
  - from:
      - namespaceSelector:
          matchLabels:
            name: clients
      - podSelector:
          matchLabels:
            role: ally
    ports:
      - port: 80
```

This is OR: "either from namespace clients, **or** a pod with label `role=ally` (inside `secure`!)".

Apply and check:

```bash
kubectl exec -n clients stranger -- wget -qO- --timeout=3 http://backend.secure
```

**What should happen:** `stranger` can now also see the backend. Because `namespaceSelector: name=clients` allows **any** pod from that namespace. This illustrates how the logic changes with "two elements" in the `from` array.

Restore the correct config (a single element with two selectors) before the next steps.

## Task 6. Egress + DNS

Let's add an egress policy for the client. In namespace `clients`:

`netpol-clients-egress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ally-egress-only-backend
  namespace: clients
spec:
  podSelector:
    matchLabels:
      role: ally
  policyTypes: [Egress]
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: secure
          podSelector:
            matchLabels:
              app: backend
      ports:
        - port: 80
```

```bash
kubectl label namespace secure name=secure
kubectl apply -f netpol-clients-egress.yaml
kubectl exec -n clients ally -- wget -qO- --timeout=3 http://backend.secure
```

**What you'll see:** the request hangs. Why?

DNS traffic (53/UDP to kube-dns) is also blocked, and `ally` can't resolve `backend.secure` to an IP. Add a rule for DNS:

```yaml
egress:
  - to:
      - namespaceSelector:
          matchLabels:
            name: secure
        podSelector:
          matchLabels:
            app: backend
    ports:
      - port: 80
  - to:
      - namespaceSelector: {}
        podSelector:
          matchLabels:
            k8s-app: kube-dns
    ports:
      - port: 53
        protocol: UDP
      - port: 53
        protocol: TCP
```

```bash
kubectl apply -f netpol-clients-egress.yaml
kubectl exec -n clients ally -- wget -qO- --timeout=3 http://backend.secure
```

**What should happen:** now it works. You just reproduced the classic rake step "restricting egress broke DNS — fix it".

## Cleanup

```bash
kubectl delete namespace secure clients
```

## Self-check questions

1. What does `podSelector: {}` do without `policyTypes`?
2. Why does "default-deny" affect traffic inside the namespace as well?
3. AND or OR — a `from` with a single element that has both `namespaceSelector` and `podSelector`?
4. Which namespace label does k8s set automatically (without your `kubectl label`)?
5. Why, with a restricting egress, must you always explicitly allow the cluster's kube-dns?
