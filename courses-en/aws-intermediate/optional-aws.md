# Optional: labs on a real AWS dev-account

Some topics in LocalStack are **simplified**. For the full experience — run once in a dev-account with a **Budget alert** ($5–10).

## Prep

1. Create an IAM user or SSO role with permissions: VPC, EC2, ELB, RDS, ECS, IAM (limited).
2. AWS Budgets → email when exceeding $5.
3. `export AWS_PROFILE=course-dev`
4. In Terraform: `use_localstack = false`, remove `endpoints`.

## Labs worth repeating in AWS

| Lesson | Why real AWS |
|---|---|
| 02 VPC | NAT Gateway billing, real route tables |
| 04 ALB | HTTPS + ACM, health checks on EC2/ECS |
| 14 RDS | Multi-AZ, real failover |
| 16 ECS | Fargate scheduling, Service Discovery |

## Cleanup

```bash
terraform destroy -var-file=prod.tfvars
```

Check in the Console: no NAT Gateway, RDS, ALB (they are expensive when idle).

## Free Tier

- RDS `db.t3.micro` — 750 hrs/mo (12 mo)
- Lambda, S3, DynamoDB — within free tier
- **NAT Gateway** — not free; delete after the lab
