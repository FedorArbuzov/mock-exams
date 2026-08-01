# 11. NetworkPolicy

## By default everything is open

In Kubernetes, **by default** any pod can reach any other pod in any namespace. This is convenient for development but bad for production:

- a compromised frontend can go straight to Postgres;
- a "reports" service can knock on the payments cache even though it shouldn't;
- any pod can knock on kube-system.

**NetworkPolicy** is an object that introduces "firewall rules" inside the cluster. It's L3/L4 (IP, port), not L7. For the HTTP level you need a service mesh.

## What's needed for it to work

A NetworkPolicy is a **specification**. It must be enforced by a **CNI plugin**. In minikube the default CNI (`bridge`/`auto`) **does not implement** NetworkPolicy — the rules are created but don't take effect.

For the lab to work, bring up the cluster with calico:

```bash
mockctl down
minikube start -p mock-exams --driver=docker --cni=calico
mockctl kubeconfig
```

(You could make a convenient `mockctl up --cni=calico` command — that's not in the utility yet.)

## Minimal example: "isolate a namespace"

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: secure
spec:
  podSelector: {}              # all pods in the namespace
  policyTypes: [Ingress]
```

`podSelector: {}` = "apply to all pods in namespace `secure`". `policyTypes: [Ingress]` without an `ingress` block = "deny all incoming traffic".

After apply, no pod from outside can open anything in `secure`. Pods inside `secure` also can't reach each other (this is often forgotten).

## Allow only specific clients

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend
  namespace: secure
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes: [Ingress]
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - port: 8080
          protocol: TCP
```

What it says:

- Applies only to pods with `app=backend` in namespace `secure`.
- Incoming TCP on port 8080 is allowed **only** from pods with `app=frontend` in **the same namespace**.
- Everything else is denied.

## Cross-namespace

To allow traffic from another namespace, add a `namespaceSelector`:

```yaml
ingress:
  - from:
      - namespaceSelector:
          matchLabels:
            name: monitoring
```

`name: monitoring` is a **label on the namespace** (not the name). For it to exist, label the namespace in advance:

```bash
kubectl label namespace monitoring name=monitoring
```

You can combine it with `podSelector` (logical AND):

```yaml
ingress:
  - from:
      - namespaceSelector:
          matchLabels:
            name: monitoring
        podSelector:                # AND, not OR
          matchLabels:
            role: scraper
```

This allows traffic only from pods with `role=scraper` in the namespace labeled `name=monitoring`.

**Important:** if `from` is an array of elements, then between elements it's **OR**, and within a single element (as above) it's **AND**.

## Egress (outgoing)

Exactly the same, but `policyTypes: [Egress]`:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-egress
  namespace: secure
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes: [Egress]
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: db
      ports:
        - port: 5432
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

This allows the backend to reach:

1. Postgres (label `app=db`) on 5432;
2. kube-dns on 53 (UDP+TCP) — otherwise DNS won't work!

**Don't forget about DNS** — without explicitly allowing 53/UDP to kube-dns, everything stops resolving in any restricted egress.

## By CIDR (external traffic)

```yaml
egress:
  - to:
      - ipBlock:
          cidr: 0.0.0.0/0
          except:
            - 169.254.169.254/32       # AWS metadata
            - 10.0.0.0/8
    ports:
      - port: 443
```

"You can reach the internet on 443, but not the metadata endpoint or private RFC-1918".

## Behavior logic

To understand what happens to a packet:

1. If **no** NetworkPolicy selects the pod → **everything is allowed** (as it was before any policies).
2. If at least one selects it → only what's **explicitly listed** in its `ingress`/`egress` is allowed.
3. All policies on a pod are combined by **OR** (if at least one allows, the packet passes).

That's why the canonical "zero trust" pattern is:

1. First `default-deny` for the whole namespace.
2. Then "allow-X-from-Y" scoped to the specific pairs you need.

## Useful commands

```bash
kubectl get networkpolicy -n secure
kubectl describe networkpolicy default-deny -n secure

# test — a temporary pod and nslookup/wget/curl:
kubectl run probe --rm -it --image=busybox -- sh
# inside:
wget -qO- http://backend.secure.svc.cluster.local:8080
nslookup backend.secure
```

## Checklist

- What happens after applying a "default-deny" Ingress in a namespace?
- Which two `from` filters, `namespaceSelector`+`podSelector`, form an AND, and which form an OR?
- Why do you almost always need to explicitly allow egress to kube-dns?
- Under which CNI on minikube does NetworkPolicy actually work?

In the lab [12-lab-networkpolicy.md](12-lab-networkpolicy.md) we'll build the "zero trust" pattern inside a namespace.
