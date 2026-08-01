# 05. EC2: virtual servers

## What EC2 is

**EC2 (Elastic Compute Cloud)** provides virtual machines in AWS. You choose the **instance type**, the **AMI** (OS image), the **disk size**, and the **network** (VPC, subnet, SG).

This is classic **IaaS**: you patch the OS, install the Docker/k8s agent, and configure the firewall (SG).

## Instance types (families)

Type name: `m5.large` = family `m5`, size `large`.

| Prefix | Purpose | Example |
|---|---|---|
| **t** | Burstable, cheap, dev | `t3.micro` (Free Tier) |
| **m** | General purpose | `m5.xlarge` |
| **c** | CPU-optimized | batch, compilation |
| **r** | Memory-optimized | caches, in-memory DB |
| **g** / **p** | GPU | ML inference |

Sizes: `nano` < `micro` < `small` < `large` < `xlarge` …

## AMI and lifecycle

- **AMI** — a disk image (Amazon Linux, Ubuntu, Windows).
- **User data** — a script run at first boot (cloud-init): installing packages, joining a cluster.
- **Instance store** — an ephemeral disk on the host (lost on stop); **EBS** — a persistent volume.

```text
Launch template / Launch configuration
    → AMI + instance type + subnet + SG + key pair
    → EC2 instance
```

## EBS volumes

| Type | Characteristic |
|---|---|
| **gp3** | SSD general purpose (default) |
| **io2** | High IOPS |
| **st1** | HDD throughput |

A volume is **tied to an AZ**. A snapshot → lets you create a volume in another AZ/region.

## Keys and access

- **Key pair** — SSH on Linux (the private key stays only with you).
- **SSM Session Manager** — SSH without an open port 22 (requires an IAM role on the instance).

Production: prefer SSM over public SSH.

## Auto Scaling Group (ASG)

```text
ALB
  → Target Group
       → ASG (min=2, max=10, desired=2)
            → EC2 across 2 AZs
```

- **Scaling policy** — by CPU, custom metric, or schedule.
- **Health check** — ALB + EC2 status; unhealthy → replace.

## Spot and Reserved (briefly)

| Model | Gist |
|---|---|
| **On-Demand** | Pay by the hour, no commitment |
| **Reserved / Savings Plans** | Discount for a 1–3 year commitment |
| **Spot** | Up to 90% cheaper, AWS can **interrupt** the instance |

Spot is for stateless workers, batch jobs, CI agents.

## EC2 vs Lambda vs Containers

| Criterion | EC2 | Lambda | ECS/EKS |
|---|---|---|---|
| OS management | You | AWS | Platform / you |
| Scaling | ASG | Automatic | HPA / ASG |
| Long-running tasks | Yes | Time limit | Yes |
| Cost when idle | Yes (unless stopped) | No | Depends |

## Checklist

- How does an AMI differ from an instance type?
- Why an ASG and a minimum of 2 instances across 2 AZs?
- gp3 vs instance store?
- When is Spot not a good fit?
- How does EC2 differ from Lambda in its pricing model?

Next lesson: [06-s3-storage.md](06-s3-storage.md).
