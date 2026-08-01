# 13. EKS: control plane and node groups

## EKS architecture

```text
AWS managed control plane (API server, etcd, scheduler)
        │
        ▼
Worker nodes (EC2 managed node group / Fargate profile)
        │
        ▼
Pods (your workloads)
```

You do **not** manage the master nodes. You pay for the control plane (~$0.10/hour) + workers.

## Components

| Component | Role |
|---|---|
| Cluster | EKS resource in a region |
| Node group | ASG with EC2, bootstraps into the cluster |
| Fargate profile | serverless pods, selector by namespace/labels |
| Add-ons | VPC CNI, kube-proxy, CoreDNS, EBS CSI |
| OIDC provider | for IRSA |

## Networking

- Each pod gets an IP from the VPC CIDR (**VPC CNI**).
- Subnets: private is recommended for nodes, public only for LB.
- **Cluster security group** — control plane ↔ nodes.

## Comparison with mockctl/minikube

| | minikube (mockctl) | EKS |
|---|---|---|
| Control plane | local | AWS managed |
| Cost | free | paid |
| IRSA | no | yes |
| ALB Ingress | simulation | native AWS LB |

## When to use EKS

- You already have Kubernetes expertise (your kuber courses).
- Multi-tenant platform, CRD, operators.
- Hybrid cloud portable workloads.

## Checklist

- Who patches the control plane?
- Why an OIDC provider on the cluster?
- Fargate vs managed nodes?
- VPC CNI — why plan IPs?

Next lesson: [14-lab-eks.md](14-lab-eks.md).
