# Optional: advanced labs on real AWS

The `aws-advanced` course **does not require** ongoing paid AWS, but some topics are only fully realized in the cloud.

## Budget

- AWS Budgets: a $10/month alert on the account
- After each lab: `terraform destroy`
- The most expensive: **NAT Gateway**, **EKS control plane**, **ALB**

## "Real AWS only" labs

| Lesson | Resources | Cost estimate |
|---|---|---|
| 04 SCP | Organizations (management account) | free |
| 08 TGW | Transit Gateway + attachments | $/hour |
| 12 WAF | WAF + ALB | $ + requests |
| 14 EKS | EKS cluster + 2 nodes | $/hour |
| 24 CRR | 2-region S3 + replication | storage + transfer |

## Organizations sandbox

1. Management account (root) — only org admin, no workloads.
2. Member account `course-dev` — all labs.
3. Do not use the company's production account.

## EKS minimum

```bash
eksctl create cluster --name course-adv --region eu-central-1 \
  --nodes 2 --node-type t3.medium --managed
# after the lab:
eksctl delete cluster --name course-adv
```

An alternative without an EKS bill: run phase 3 on **mockctl** + an IRSA analog via an annotated ServiceAccount (limited) — see [14-lab-eks.md](14-lab-eks.md).

## Post-lab checklist

- [ ] `terraform destroy` or `eksctl delete`
- [ ] NAT Gateway deleted
- [ ] No dangling EBS/RDS
- [ ] Budget the next day — $0 increase
