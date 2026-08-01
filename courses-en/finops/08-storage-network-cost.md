# 08. S3, EBS, NAT and data transfer

## Intro

AWS “hidden” costs are **traffic** and **NAT**. After VPC/EKS labs the bill often grows from **GB through NAT**, not from vCPU.

Related: [networking-deep/06-nat](../networking-deep/06-nat.md), [aws-intermediate VPC](../aws-intermediate/01-vpc-custom.md).

---

## NAT Gateway

| Line item | Model |
|--------|--------|
| Hourly | ~$0.045/hour/AZ (region-dependent) |
| Data processing | $/GB processed |

**Two NATs in two AZs** for HA — **2× hourly** even at night.

Mitigation:

- **VPC Gateway Endpoint** S3/DynamoDB — **no NAT** for that traffic
- **Interface endpoints** for ECR, STS — less egress (you pay for endpoint ENI)
- **NAT instance** (self-managed) — cheaper, more ops (rarely in prod)
- **Delete NAT** in dev when not needed

---

## Data transfer

| Type | Typical pricing (logic) |
|-----|------------------------|
| In to internet | often free |
| Out to internet | $/GB tiered |
| Cross-AZ same region | $/GB both directions |
| Cross-region | $/GB + replication |
| To CloudFront origin | can optimize |

**Anti-pattern:** chatty microservices cross-AZ without need.

---

## S3

| Lever | Effect |
|-------|--------|
| Storage class | Standard → IA → Glacier |
| Lifecycle rules | auto transition/delete |
| Incomplete MPU | abort multipart uploads |
| Request pricing | LIST in a loop, millions of tiny objects |
| Replication CRR | storage + transfer ([aws-advanced/24](../aws-advanced/24-lab-s3-crr.md)) |

---

## EBS

- **gp3** default — cheaper than io1 at the same IOPS if configured.
- **Snapshots** — incremental, but they accumulate; lifecycle policy.
- **Orphan volumes** — after deleting an instance, Cost Explorer → EBS.

---

## CloudFront (briefly)

Caching cuts **origin egress** and improves UX — cost can **drop** under high public traffic.

---

## In mock-exams

In [14-lab-cost-report](14-lab-cost-report.md) — a separate line for **NAT + DataTransfer**. Image pipeline S3: [aws-terraform image-pipeline](../aws-terraform/projects/image-pipeline/README.md).

---

## Summary

Network FinOps optimization is **architecture**: endpoints, AZ placement, NAT count. S3/EBS — lifecycle and orphan hunting.

---

## Checklist

- [ ] S3 endpoint on the private route table?
- [ ] How many NAT GWs in the account and why each?
- [ ] Lifecycle on buckets with logs?

**Next:** [09. Savings Plans and Spot](09-commitments.md).
