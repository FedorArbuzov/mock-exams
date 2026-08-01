# FinOps

Course on **FinOps** and **cloud cost management**: allocation (tags), visibility (Cost Explorer, CUR), **budgets**, **rightsizing**, commitments (Savings Plans / RI / Spot), **EKS/Kubernetes** and **Kubecost** cost, multi-account governance. Theory in English + **two labs** (LocalStack/Terraform and optionally real AWS dev).

**Who it's for:** DevOps / platform / cloud engineers after the AWS track; SREs who need to connect **error budget** with the **cloud bill**; team leads introducing chargeback/showback.

**Prerequisites:**

| Course | Why |
|------|--------|
| [aws-basic](../aws-basic/README.md) | services and billing at a high level |
| [aws-terraform](../aws-terraform/README.md) | budgets/tags in IaC |
| [aws-intermediate](../aws-intermediate/README.md) | VPC, NAT, RDS, ECS — cost drivers |
| [aws-advanced/25–26](../aws-advanced/25-cost-optimization.md) | short intro (here — deeper) |

**Useful:** [kuber-intermediate](../kuber-intermediate/README.md), [observability-advanced/05](../observability-advanced/05-cardinality-cost.md), [sre/15](../sre/15-economics-of-reliability.md).

## How to read

- Chapters **01–12** — theory (~30–50 min each).
- **13–14** — labs after chapters **03–04** and **05–08**.
- **15** — final cost review for a team/service.

**Time:** ~**14–18 hours** + **3–4 hours** of labs; finale — **2–3 hours**.

## Curriculum

### Part I — Discipline and visibility (01–04)

| # | Chapter |
|---|--------|
| 01 | [FinOps: roles, Inform → Optimize → Operate cycle](01-intro-finops.md) |
| 02 | [Unit economics, showback and chargeback](02-unit-economics.md) |
| 03 | [Tags, allocation, Cost Categories](03-tagging-allocation.md) |
| 04 | [Cost Explorer, CUR, Budgets, anomalies](04-aws-cost-tools.md) |

### Part II — Resource optimization (05–08)

| # | Chapter |
|---|--------|
| 05 | [Rightsizing: EC2, RDS, Lambda](05-rightsizing.md) |
| 06 | [EKS, Fargate, idle capacity](06-kubernetes-cost.md) |
| 07 | [Kubecost and allocation in Kubernetes](07-kubecost.md) |
| 08 | [S3, EBS, NAT and data transfer](08-storage-network-cost.md) |

### Part III — Commitments and governance (09–11)

| # | Chapter |
|---|--------|
| 09 | [Savings Plans, Reserved, Spot](09-commitments.md) |
| 10 | [Organizations, budgets, tag policies](10-governance.md) |
| 11 | [FinOps in process: rituals and culture](11-process-culture.md) |

### Part IV — Practice (12–15)

| # | Chapter |
|---|--------|
| 12 | [Observability and platform cost](12-observability-platform-cost.md) |
| 13 | [Lab: budgets, tags, Terraform](13-lab-budgets-tags.md) |
| 14 | [Lab: report and rightsizing plan](14-lab-cost-report.md) |
| 15 | [Synthesis: cost review and checklist](15-synthesis.md) |

## What you should end up with

- Introduce **required tags** and build reports by team/env/service.
- Configure a **Budget** with a forecast alert and understand CUR vs Explorer.
- Draft a **rightsizing plan** for EC2/RDS/EKS without “turn everything off.”
- Explain **Kubecost** allocation (namespace, label) on `mockctl`.
- Run a **monthly cost review** with action items.

## Requirements

| Mode | What you need |
|-------|-----------|
| Theory | reading only |
| Lab 13 | Terraform, [LocalStack](../../deploy/localstack/docker-compose.yml) or an AWS dev account |
| Lab 14 | AWS Cost Explorer (real account) or a practice report from the template |
| Kubecost (chapter 07) | `mockctl up`, Helm, 4+ GB RAM |

**Important:** for training accounts — **budget alert** and **cleanup** after labs ([aws-advanced/optional-aws](../aws-advanced/optional-aws-advanced.md)).

## Related to aws-advanced

| aws-advanced | finops |
|--------------|--------|
| [25-cost-optimization](../aws-advanced/25-cost-optimization.md) | overview → chapters 03–04, 09 |
| [26-lab-cost-budgets](../aws-advanced/26-lab-cost-budgets.md) | expanded in [13](13-lab-budgets-tags.md), [14](14-lab-cost-report.md) |

After FinOps, a natural next step: [aws-advanced/27](../aws-advanced/27-final-project.md) (enterprise) with a cost gate in the PRR.
