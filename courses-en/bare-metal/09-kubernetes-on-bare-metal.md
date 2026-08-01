# 09. Kubernetes on bare metal

## Differences from managed Kubernetes

| | EKS / GKE | Self-hosted on metal |
|---|---|---|
| Control plane | managed | you (or Talos) |
| LoadBalancer Service | cloud LB | MetalLB, kube-vip |
| PersistentVolume | EBS | local disk, Ceph, NFS |
| CCM | present | absent — workarounds needed |

## Cluster installation

| Method | Description |
|---|---|
| **kubeadm** | classic: init the control plane + join workers |
| **kops** | IaC for AWS; for metal — rarer |
| **Talos Linux** | immutable OS, API instead of SSH |
| **RKE2 / K3s** | simplified distributions |
| **Metal3** | Kubernetes manages bare metal (IPMI) |

`mockctl`/minikube — **not** a production path, but it teaches the API and the objects.

## MetalLB

A `LoadBalancer` type service on bare metal:

```text
Service LoadBalancer IP (from the MetalLB pool)
    → ARP/BGP announces the IP on a node
    → traffic arrives at the pod
```

In the cloud, the AWS Load Balancer Controller plays this role.

## Storage

| Option | Pro | Con |
|---|---|---|
| **local-path-provisioner** | simple | no replication |
| **Rook/Ceph** | distributed | complexity |
| **Longhorn** | simpler than Ceph | overhead |
| **NFS** | shared | SPOF without HA NFS |

StatefulSet on metal — plan for **node binding** and backups.

## CNI networking

Calico, Cilium — BGP with the TOR (advanced). See `kuber-advanced` NetworkPolicy.

## Relation to aws-advanced

EKS worker nodes are **physically** bare metal in an AWS DC too — you just don't manage them.

## Checklist

- Why MetalLB?
- Why no EBS on metal?
- kubeadm vs Talos?
- local PV — a risk on drain?

Next lesson: [10-when-bare-metal.md](10-when-bare-metal.md).
