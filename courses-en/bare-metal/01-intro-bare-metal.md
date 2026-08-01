# 01. Bare metal, VMs, and cloud

## Three levels of a "server"

```text
Bare metal          Virtualization          Cloud (managed)
──────────          ─────────────           ────────────────
Physical CPU        Hypervisor (KVM/ESXi)   API → VM on someone else's hardware
You install the OS  vCPU / vRAM             EC2, GKE node pool
You own everything  Shared or dedicated     Provider — hardware, you — OS+
```

| | Bare metal | VM on your own hardware | Cloud VM |
|---|---|---|---|
| Startup | days (order, delivery) | minutes | seconds |
| Granularity | whole server | fractions of a CPU | instance type |
| Neighbors | none (one tenant per box) | other VMs on the host | multi-tenant |
| Cost at 100% load | often cheaper | medium | pay-as-you-go |

## Hypervisor

**Type 1** (bare metal hypervisor): VMware ESXi, Xen — the hypervisor OS runs directly on the hardware.

**Type 2**: KVM/QEMU inside Linux — DevOps most often sees this in the cloud and on `minikube` (a VM inside Docker on macOS/Windows).

## Why bare metal in 2026

- **Predictable performance** — no noisy neighbor on the CPU (GPU, HPC, low-latency trading).
- **Licenses** — sometimes cheaper than vCPUs in the cloud.
- **Data and compliance** — on-prem, air-gapped.
- **Kubernetes control plane** or **stateful** workloads with local NVMe.
- **Edge** — a server in a branch office with no cloud.

## Why the cloud still matters

Elasticity, managed DB, global footprint. A typical hybrid: **bare metal / on-prem** for the stable core, **cloud** for burst and managed services.

## Relation to mock-exams

`mockctl` / minikube is **not** bare metal: it's a VM on your laptop. But **worker nodes** in production EKS/self-hosted k8s often run on physical machines or on VMs in a data center.

## Checklist

- How does bare metal differ from EC2?
- Type 1 vs Type 2 hypervisor?
- Name two scenarios where bare metal is justified.
- Is minikube bare metal?

Next lesson: [02-server-hardware.md](02-server-hardware.md).
