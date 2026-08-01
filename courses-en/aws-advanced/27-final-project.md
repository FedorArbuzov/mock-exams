# 27. Final project: Image Platform Enterprise

## Goal

Combine all advanced phases into a **platform-level architecture** — an evolution of [`image-platform`](../aws-intermediate/projects/image-platform/).

## Target architecture

```text
Organizations
├── Security account (org CloudTrail, Config aggregator)
├── Workloads-dev
│     └── image-platform (as in intermediate)
└── Workloads-prod
      ├── VPC (TGW or single prod VPC)
      ├── EKS cluster
      │     ├── Namespace images
      │     ├── IRSA → S3 (CMK)
      │     ├── Ingress ALB + WAF
      │     └── Worker Job / optional Lambda
      ├── S3 source + CRR bucket (DR region)
      ├── DynamoDB + optional RDS reports
      ├── EventBridge bus (domain events)
      ├── GuardDuty + Config rules
      └── SNS alerts → on-call

CI: GitHub OIDC → assume role dev → plan
     GitHub Environment prod → apply (manual)
```

## Minimum requirements (submission)

| # | Requirement | Phase |
|---|---|---|
| 1 | Multi-account diagram (even if 1 account — show the target model) | 1 |
| 2 | Cross-account or OIDC CI without long-lived keys | 1, 6 |
| 3 | SCP or tag policy document | 1 |
| 4 | WAF on a public endpoint (ALB or CloudFront) | 2 |
| 5 | EKS + IRSA pod reads S3 | 3 |
| 6 | Ingress ALB to the API | 3 |
| 7 | Config rule or GuardDuty enabled + runbook | 4 |
| 8 | S3 CRR **or** a tabletop DR doc | 5 |
| 9 | Budget + cost tags | 5 |
| 10 | Terraform modules: `network`, `eks`, `data`, `security` | all |

## Recommended repo structure

```text
projects/image-platform-enterprise/
  README.md
  docs/
    architecture.md
    runbook-guardduty.md
    dr-failover.md
  terraform/
    envs/dev/
    envs/prod/
    modules/network/
    modules/eks/
    modules/data/
    modules/security/
  kubernetes/
    base/
    overlays/dev/
    overlays/prod/
```

## Budget tracks

| Track | What you actually stand up |
|---|---|
| **A — Documentation** | Full diagram + Terraform plan + mockctl IRSA analog |
| **B — Hybrid** | LocalStack data plane + EKS in AWS |
| **C — Full** | Everything in AWS dev/prod accounts |

For the course, **track A + one component of track B** (for example, EKS+IRSA) is enough.

## Smoke test (prod-like)

1. Upload `uploads/test.jpg` → SQS → worker → `thumbs/` + DynamoDB.
2. `GET https://api.../images/{id}` via Ingress.
3. WAF blocks an SQLi probe → 403.
4. Intentional DLQ message → alarm fires (or runbook walkthrough).

## Relation to kuber-advanced

| aws-advanced final | kuber-advanced |
|---|---|
| EKS + IRSA | cluster ops, upgrade |
| ALB Ingress | Ingress, NetworkPolicy |
| Platform security | Pod Security, admission |

Optional: Argo CD deploy of `kubernetes/overlays/prod` ([kuber-advanced/17](../kuber-advanced/17-lab-argocd.md)).

## Submission

- PR or gist
- `docs/architecture.md` with a diagram (Mermaid)
- 5-min video or smoke test screenshots
- **destroy checklist** signed off

## After the course

- **mock-saa** — a Solutions Architect exam simulation
- Multi-region active-active
- FinOps deep dive (Kubecost-style for AWS)

---

Congratulations — the track **aws-basic → terraform → intermediate → advanced** is complete.
