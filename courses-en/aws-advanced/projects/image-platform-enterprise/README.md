# Image Platform Enterprise (aws-advanced final project)

An evolution of [`image-platform`](../../aws-intermediate/projects/image-platform/).

## What to add on top of intermediate

| Component | Module / doc |
|---|---|
| Multi-account diagram | `docs/architecture.md` |
| GitHub OIDC CI | `docs/oidc-ci.md` |
| WAF | `terraform/modules/security/waf.tf` |
| EKS + IRSA | `terraform/modules/eks/` + `kubernetes/` |
| Org trail / Config | `terraform/modules/security/compliance.tf` |
| S3 CRR | `terraform/modules/data/crr.tf` |
| Budget | `terraform/modules/security/budget.tf` |

## Tracks

| Track | Description |
|---|---|
| A | Documentation + `terraform plan` without a full apply |
| B | EKS + IRSA + Ingress (real AWS) |
| C | Full enterprise (Organizations + TGW) |

See [27-final-project.md](../../27-final-project.md).

## Getting started

1. Copy `image-platform` as the data plane base.
2. Fill in `docs/architecture.md` (template below).
3. Add modules phase by phase as you go through the course.

## architecture.md template

```markdown
# Architecture

## Accounts
- Management: ...
- Workloads-dev: ...
- Workloads-prod: ...

## Data flow
(Mermaid diagram from 27-final-project)

## Security controls
- SCP: ...
- WAF: ...
- IRSA: ...

## DR
- RPO/RTO: ...
- CRR: region B
```
