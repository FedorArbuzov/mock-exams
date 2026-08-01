# 01. Control plane architecture

## Request path: from `kubectl apply` to `Pod Running`

```text
kubectl apply -f deploy.yaml
        │
        ▼
┌───────────────────┐
│   kube-apiserver  │  ← the single entry point to the API
└─────────┬─────────┘
          │ authn (who are you?) → authz (RBAC, what's allowed?)
          │ admission (mutating → validating webhooks)
          │ write to etcd
          ▼
┌───────────────────┐
│       etcd        │  ← the single source of truth for cluster state
└─────────┬─────────┘
          │ watch events
          ▼
┌───────────────────┐     ┌───────────────────┐
│ kube-scheduler    │     │ controller-manager│
│ (assign a node)   │     │ (maintain the     │
└─────────┬─────────┘     │  desired state)   │
          │               └─────────┬─────────┘
          │                         │
          └────────────┬────────────┘
                       ▼
              ┌───────────────────┐
              │     kubelet       │  on each node
              │  + container      │
              │    runtime (CRI)  │
              └─────────┬─────────┘
                        ▼
                   Pod Running
```

## Control plane components

### kube-apiserver

- REST API for everything (`/api/v1`, `/apis/apps/v1`, …).
- The only component that **writes to etcd** (the rest read through the apiserver).
- Horizontal scaling: several apiserver replicas behind a load balancer (in production).

```bash
kubectl get --raw /healthz          # is the API alive
kubectl get --raw /readyz           # ready to accept traffic
kubectl get --raw /livez
```

### etcd

- Distributed key-value store (Raft consensus).
- Stores **all** Kubernetes objects as JSON.
- Loss of etcd quorum = the cluster is "frozen" (read only, no writes).

etcd backup is a mandatory CKA skill (see [02-etcd.md](02-etcd.md), [03-lab-etcd.md](03-lab-etcd.md)).

### kube-scheduler

- Watches pods in `Pending` status (without `spec.nodeName`).
- Filters nodes (enough resources? taints? affinity?).
- Scores the remaining ones and picks the best.
- Writes `spec.nodeName` into the pod.

It doesn't start containers — it only **assigns** a node.

### kube-controller-manager

A set of controllers in a single process. Each is an endless loop of "compare desired vs actual → act":

| Controller | What it does |
|---|---|
| Deployment | Creates/updates a ReplicaSet |
| ReplicaSet | Maintains the number of pods |
| Node | Monitors nodes, taints on unavailability |
| Service / EndpointSlice | Updates endpoints for a Service |
| Job | Completes a Job by completions |
| Namespace | Deletes objects when a namespace is deleted |

### cloud-controller-manager (optional)

In the cloud (AWS/GCP/Azure): LoadBalancer Service, routes, attaching disks to nodes. **Not present** in minikube.

## Components on a node (worker)

### kubelet

- An agent on each node.
- Receives the list of pods assigned to this node.
- Creates/kills containers via CRI (containerd).
- Reports status (Ready/NotReady), runs probes.
- Mounts volumes.

### kube-proxy

- Watches Service and EndpointSlice.
- Configures routing rules (iptables / ipvs / eBPF) on the node.
- Implements `ClusterIP` — a virtual IP that balances to backend pods.

More details — [08-network-internals.md](08-network-internals.md).

## Static Pods

On "real" clusters, some control plane components are **static pods**: the kubelet reads manifests from `/etc/kubernetes/manifests/` and starts them directly, without the apiserver.

In minikube the control plane lives **inside** the node's docker container:

```bash
minikube -p mock-exams ssh
ls /etc/kubernetes/manifests/
# kube-apiserver.yaml, etcd.yaml, ...
```

## Useful CKA commands

```bash
# Control plane components as pods (if static → in kube-system):
kubectl get pods -n kube-system

# apiserver logs:
kubectl logs -n kube-system -l component=kube-apiserver

# Scheduling events:
kubectl get events --field-selector reason=Scheduled

# Why a pod is Pending:
kubectl describe pod <name> | grep -A10 Events
```

## Checklist

- Who is the only writer to etcd?
- How does the scheduler differ from the kubelet?
- What does the Deployment controller do?
- Where in minikube can you view static pod manifests?
- Name the order: authn → authz → admission → etcd on `kubectl apply`.

Next lesson: [02-etcd.md](02-etcd.md) — backup and restore.
