# AWS Advanced

Advanced level for DevOps / Platform / Cloud Engineer. Assumes [`aws-basic`](../aws-basic/README.md), [`aws-terraform`](../aws-terraform/README.md), and [`aws-intermediate`](../aws-intermediate/README.md).

Goal — **manage AWS at the organization level**: multi-account, enterprise networking, EKS+IRSA, security tooling, DR, and cost.

For the EKS block, it's recommended to complete [`kuber-intermediate`](../kuber-intermediate/README.md) or [`kuber-advanced`](../kuber-advanced/README.md).

## Path by phases

Go **phase by phase**; file numbers are a guideline, not a strict order within a phase.

### Phase 1 — Multi-account and governance

| # | Lesson |
|---|---|
| 01 | [AWS Organizations](01-organizations.md) |
| 02 | [Lab: cross-account role](02-lab-cross-account.md) |
| 03 | [SCP and guardrails](03-scp-governance.md) |
| 04 | [Lab: SCP in Organizations](04-lab-scp.md) |
| 05 | [Landing Zone and Control Tower](05-landing-zone.md) |
| 06 | [Lab: OIDC for CI in prod account](06-lab-oidc-ci.md) |

### Phase 2 — Enterprise network

| # | Lesson |
|---|---|
| 07 | [Transit Gateway and peering](07-transit-gateway.md) |
| 08 | [Lab: hub-spoke VPC](08-lab-transit-gateway.md) |
| 09 | [Route 53 and PrivateLink](09-route53-privatelink.md) |
| 10 | [Lab: health check and failover](10-lab-route53.md) |
| 11 | [WAF and Shield](11-waf-shield.md) |
| 12 | [Lab: WAF on ALB](12-lab-waf.md) |

### Phase 3 — EKS and Kubernetes on AWS

| # | Lesson |
|---|---|
| 13 | [EKS: control plane and node groups](13-eks-architecture.md) |
| 14 | [Lab: minimal EKS / comparison with mockctl](14-lab-eks.md) |
| 15 | [IRSA: IAM Roles for Service Accounts](15-irsa.md) |
| 16 | [Lab: Pod → S3 via IRSA](16-lab-irsa.md) |
| 17 | [AWS Load Balancer Controller](17-alb-ingress.md) |
| 18 | [Lab: Ingress for Image Platform](18-lab-alb-ingress.md) |

### Phase 4 — Security operations

| # | Lesson |
|---|---|
| 19 | [KMS, rotation, organizational secrets](19-kms-advanced.md) |
| 20 | [Lab: rotation and encryption](20-lab-kms-secrets.md) |
| 21 | [GuardDuty, Config, CloudTrail](21-guardduty-config-trail.md) |
| 22 | [Lab: Config rule and trail](22-lab-guardduty-config.md) |

### Phase 5 — DR, backup, cost

| # | Lesson |
|---|---|
| 23 | [Backup, CRR, RTO/RPO](23-backup-dr.md) |
| 24 | [Lab: S3 cross-region replication](24-lab-s3-crr.md) |
| 25 | [Cost: tags, budgets, Savings Plans](25-cost-optimization.md) — overview; deep dive → [`finops`](../finops/README.md) |
| 26 | [Lab: budget alert](26-lab-cost-budgets.md) |

### Phase 6 — Final

| # | Lesson |
|---|---|
| 27 | [Final project: Image Platform Enterprise](27-final-project.md) |

Reference and template: [`projects/image-platform-enterprise/`](projects/image-platform-enterprise/).

## Optional (self-study)

| Topic | Where |
|---|---|
| Step Functions for pipeline | AWS docs + extending `image-platform` |
| Kinesis instead of SQS | high-throughput track |
| Full TGW in AWS | [optional-aws-advanced.md](optional-aws-advanced.md) |

## Requirements

| Tool | Purpose |
|---|---|
| Terraform ≥ 1.5 | IaC |
| AWS CLI v2 | org, eks, waf |
| `kubectl` + cluster | phase 3 (mockctl or EKS) |
| Docker / LocalStack | part of the intermediate-level labs |

**Real AWS:** phases 1–2, 4–5, and EKS — dev-account + [optional-aws-advanced.md](optional-aws-advanced.md) + Budget alert.

## Relation to other courses

```text
aws-intermediate (image-platform)
        ↓
aws-advanced (enterprise + EKS + org)
        ↕
kuber-advanced (EKS operations, GitOps, security)
```

## Suitable for preparing for

- **AWS Solutions Architect Professional** (architecture patterns)
- **AWS Security Specialty** (phase 4)
- Platform role "AWS + Kubernetes"
