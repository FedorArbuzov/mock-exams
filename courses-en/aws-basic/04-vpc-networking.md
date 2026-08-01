# 04. VPC and networking in AWS

## Why VPC

**VPC (Virtual Private Cloud)** is your **isolated network** inside AWS. Anything that should communicate privately (EC2, RDS, Lambda in a VPC) lives in a VPC.

Without a VPC you don't control:

- Which subnets are public and which are private.
- Who can reach the database from the internet.
- Routing between services.

By default, every region has a **default VPC** for experiments; in production you create a **custom VPC**.

## Basic components

```text
VPC 10.0.0.0/16
├── Public Subnet 10.0.1.0/24 (AZ-a)  → Internet Gateway
├── Public Subnet 10.0.2.0/24 (AZ-b)  → Internet Gateway
├── Private Subnet 10.0.10.0/24 (AZ-a) → NAT Gateway (in public)
└── Private Subnet 10.0.20.0/24 (AZ-b) → NAT Gateway
```

| Component | Role |
|---|---|
| **Subnet** | A range of IP addresses in a single AZ |
| **Internet Gateway (IGW)** | Internet access for a public subnet |
| **NAT Gateway** | Outbound internet for a private subnet (no inbound from outside) |
| **Route Table** | Rules: where to send traffic (`0.0.0.0/0` → IGW or NAT) |
| **Security Group (SG)** | Stateful firewall at the ENI level (instance, ALB) |
| **NACL** | Stateless firewall at the subnet level (changed less often) |

## Public vs Private subnet

**Public** — a `0.0.0.0/0` route → **Internet Gateway**, and the resource has a **public IP** (or an Elastic IP).

**Private** — no direct path from the internet; for package updates it uses a **NAT Gateway** in a public subnet.

```text
Internet
    │
    ▼
Internet Gateway
    │
Public Subnet ──► EC2 (bastion / ALB)
    │
NAT Gateway ◄── Private Subnet ──► EC2 app, RDS
```

**Rule:** databases and internal APIs go in **private** only. The ALB is **public** (or an internal ALB).

## Security Groups

- **Stateful**: if you allowed an inbound reply on an established connection, the outbound is already allowed.
- Rules are **Allow** only (no Deny).
- Reference to another SG: "allow port 5432 from SG `app-servers`".

Example for a web application:

| SG | Inbound | Outbound |
|---|---|---|
| `alb-sg` | 443 from 0.0.0.0/0 | all |
| `app-sg` | 8080 from `alb-sg` | all |
| `db-sg` | 5432 from `app-sg` | — |

## Elastic Load Balancer (ALB / NLB)

| Type | Layer | Typical use |
|---|---|---|
| **ALB** | L7 (HTTP/HTTPS) | Microservices, path-based routing |
| **NLB** | L4 (TCP/UDP) | Low latency, static IP |
| **CLB** | Legacy | Don't use in new projects |

An ALB across **multiple AZs** → health checks → traffic only to healthy targets.

## DNS in a VPC

- **Route 53** — public DNS and private hosted zones.
- **Private DNS** inside a VPC: `db.internal`, `api.svc.cluster.local` (in EKS).

## VPC Endpoints (briefly)

To let Lambda/EC2 in a **private subnet** reach S3 **without NAT** (cheaper and safer):

- **Gateway Endpoint** — for S3, DynamoDB (free).
- **Interface Endpoint** — for other services (a paid ENI).

## Related to Kubernetes

| AWS | Kubernetes |
|---|---|
| VPC | The cluster network |
| Subnet | The AZ where the scheduler places a Pod (via CNI) |
| Security Group | Often on the node group / ENI |
| ALB + Ingress | AWS Load Balancer Controller |

In minikube there's no VPC — it emulates a single node. On EKS a VPC is mandatory.

## Checklist

- Why put RDS in a private subnet?
- How does a Security Group differ from a NACL?
- Why a NAT Gateway if there's already an IGW?
- At which layer does an ALB operate?
- Why aren't databases placed in a public subnet?

Next lesson: [05-ec2-compute.md](05-ec2-compute.md).
