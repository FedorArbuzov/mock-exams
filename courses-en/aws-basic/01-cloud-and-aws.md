# 01. The cloud and AWS: why and how it works

## What "the cloud" is

**Cloud computing** is a model in which you **rent** IT resources (servers, storage, databases, networks) from a provider and pay for **actual usage** rather than buying hardware for a data center.

Three main models (per NIST):

| Model | Who manages what | Examples |
|---|---|---|
| **IaaS** | You — OS, applications; provider — hardware, network | AWS EC2, GCP Compute |
| **PaaS** | You — code; provider — runtime, OS | AWS Elastic Beanstalk, Heroku |
| **SaaS** | You — just use it | Gmail, Salesforce |

AWS is primarily **IaaS** plus a set of managed services on top of it (RDS, Lambda, S3).

## Why AWS

- **A huge catalog of services** — from virtual machines to ML and satellites.
- **Global infrastructure** — regions on every continent.
- **A mature ecosystem** — documentation, certifications, Terraform, LocalStack.
- **Pay-as-you-go** — you don't pay for idle servers (if you shut them down).

Downsides: complexity, the risk of **misconfiguring billing**, and vendor lock-in at the API level.

## Shared Responsibility Model

AWS splits responsibility with the customer:

```text
┌─────────────────────────────────────────┐
│  Customer: data, configuration,         │
│  encryption (in the application), IAM,  │
│  security groups, OS patches on EC2     │
├─────────────────────────────────────────┤
│  AWS: hardware, hypervisor, physical    │
│  data-center security, managed services │
│  (RDS engine patches, Lambda infra)     │
└─────────────────────────────────────────┘
```

**Rule:** AWS is responsible **for the cloud**, you are responsible **in the cloud**. A leaked S3 bucket with public access is your responsibility.

## How AWS is structured "from the top"

```text
                    AWS Account (root boundary for billing and IAM)
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
    Region: eu-central-1   us-east-1          ap-southeast-1
         │                    │
    ┌────┴────┐          ┌────┴────┐
    AZ-a     AZ-b         AZ-a     AZ-b
         │                    │
    VPC, EC2, RDS,      S3 (global namespace,
    Lambda, ...          but data lives in the region)
```

- **Account** — an isolated container: its own billing, its own IAM users, its own resources.
- **Region** — a geographic cluster of data centers (you choose it when creating most resources).
- **Service** — an AWS product (S3, EC2, Lambda). Each has its own API endpoint.

## Main service categories

| Category | Examples | On-premises analog |
|---|---|---|
| Compute | EC2, Lambda, ECS, EKS | Servers, containers |
| Storage | S3, EBS, EFS | Disks, file storage |
| Database | RDS, DynamoDB, ElastiCache | Postgres, Redis |
| Networking | VPC, ALB, Route 53, CloudFront | LAN, DNS, CDN |
| Security | IAM, KMS, Secrets Manager | LDAP, vault |
| Integration | SQS, SNS, EventBridge | Queues, pub/sub |

In this course we'll cover compute, storage, networking, IAM, serverless, and messaging.

## Console, CLI, API, IaC

The same AWS is available in four ways:

| Method | Who it's for |
|---|---|
| **AWS Console** (web) | Learning, one-off actions |
| **AWS CLI** (`aws s3 ls`) | Scripts, automation |
| **SDK** (boto3, aws-sdk-go) | Applications |
| **IaC** (Terraform, CloudFormation) | Production, GitOps, courses |

**Production:** almost always IaC + CI. The Console is for debugging.

## Free Tier and billing

- A card is linked at sign-up.
- **Free Tier** — 12-month limits plus always-free offerings (for example, Lambda invocations).
- Without controls, it's easy to run up a bill: an open S3 bucket, a forgotten EC2 `t2.large`, a NAT Gateway.

For learning in our repository, we use **LocalStack / MiniStack** ([10-local-emulation.md](10-local-emulation.md)), not real AWS.

## Related to Kubernetes

If you've taken the `kuber-*` courses:

| AWS concept | Kubernetes |
|---|---|
| AWS Account | — |
| Region | — (a cluster is tied to a region) |
| VPC | The network the nodes live in |
| EKS | Managed control plane + your worker nodes |
| IAM Role for Service Account (IRSA) | ServiceAccount + RBAC |
| ALB Ingress Controller | Ingress → AWS Load Balancer |

EKS is Kubernetes **on** AWS, not a replacement for AWS.

## Checklist

- How does IaaS differ from SaaS?
- What is the Shared Responsibility Model?
- What makes up the hierarchy: Account → Region → AZ?
- Name 3 ways to manage AWS besides the Console.
- Why do we recommend local emulation for this course?

Next lesson: [02-regions-and-availability.md](02-regions-and-availability.md).
