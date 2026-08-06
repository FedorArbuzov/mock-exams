# 1. Kubernetes Cluster Architecture

## What a cluster actually is

A **cluster** is a group of machines — physical or virtual — that run containerized applications together. Kubernetes treats these machines as a single system.

The machines split into two roles:

- **Control plane** — the "brain" of the cluster; makes the decisions.
- **Worker nodes** — the "hands"; this is where your applications actually run.

On Docker Desktop Kubernetes, the control plane and (if enabled) a worker are separate nodes — for example `desktop-control-plane` and `desktop-worker`. On many small local clusters they can also share one machine.

## Control plane components

| Component | What it's for |
|-----------|--------|
| **kube-apiserver** | The single entry point into the cluster. Every request — from `kubectl`, controllers, nodes — goes through it. A REST API. |
| **etcd** | A distributed key-value store. Holds **all** cluster state: objects, configs, secrets. |
| **kube-scheduler** | Decides **which node** a new Pod should run on (based on resources, constraints, affinity). |
| **kube-controller-manager** | A bundle of controllers that keep nudging the cluster toward its desired state — e.g. the ReplicaSet controller makes sure the right number of Pods exist. |
| **cloud-controller-manager** | Integration with a cloud provider (load balancers, volumes, nodes). Usually not needed on local Docker Desktop clusters or bare metal. |

## Worker node components

| Component | What it's for |
|-----------|--------|
| **kubelet** | The agent running on every node. Takes instructions from the API server and starts containers through the runtime. |
| **container runtime** | The thing that actually runs containers: **containerd**, CRI-O, etc. |
| **kube-proxy** | Sets up the network rules (iptables/ipvs) that make Services work — routes traffic to the right Pods. |

## How a Pod actually gets created

1. `kubectl apply -f pod.yaml` → the request lands on **kube-apiserver**.
2. apiserver writes the object into **etcd**.
3. The **scheduler** notices an unassigned Pod and picks a node for it.
4. **kubelet** on that node picks up the instruction and starts the container through the **container runtime** (containerd).
5. **kube-proxy** updates the network rules if a Service is involved.

## Checking this on your own cluster

```bash
kubectl get nodes
kubectl get pods -n kube-system
kubectl cluster-info
```

`kube-system` is exactly where you'll see the control plane components: api-server, scheduler, controller-manager, etcd, coredns, and so on.
