# 23. Final project: Image Platform

## Goal

Build a **production-style** image processing platform — an evolution of [`image-pipeline`](../../aws-terraform/projects/image-pipeline/) from `aws-terraform`.

## Architecture

```text
                         ┌──────────────────┐
                         │  API Gateway     │
                         │  GET /images/{id}│
                         │  POST /upload-url│
                         └────────┬─────────┘
                                  │
┌──────────┐   upload   ┌─────────▼─────────┐   EventBridge/SQS   ┌─────────────┐
│  Client  │───────────►│  S3 uploads/      │────────────────────►│ Lambda      │
└──────────┘            │  (KMS encrypted)  │                     │ worker      │
                        └───────────────────┘                     └──────┬──────┘
                                                                         │
                        ┌───────────────────┐         ┌──────────────────▼──────┐
                        │  S3 thumbs/       │◄────────│  DynamoDB metadata      │
                        └───────────────────┘         └─────────────────────────┘
                        ┌───────────────────┐
                        │  DLQ + SNS alarm  │
                        └───────────────────┘
```

Optional: ECS Fargate API behind ALB, RDS for reports, CloudFront for thumbs.

## Reference code

[`projects/image-platform/`](projects/image-platform/) — Terraform modules:

| File / directory | Contents |
|---|---|
| `network.tf` | VPC, public subnets, SG |
| `data.tf` | S3 KMS, DynamoDB |
| `messaging.tf` | SQS, DLQ, EventBridge |
| `compute.tf` | Lambda worker + API |
| `api.tf` | API Gateway |
| `observability.tf` | Logs, alarms, SNS |
| `lambda/` | worker handler |
| `lambda-api/` | REST handler |

## Requirements (on your own / against the reference)

| # | Criterion |
|---|---|
| 1 | S3: KMS encryption, block public |
| 2 | Upload only to `uploads/`; processing → `thumbs/` |
| 3 | SQS queue + DLQ between event and worker |
| 4 | API Gateway: GET metadata by id |
| 5 | Secrets Manager for API key (header check) |
| 6 | CloudWatch alarm on DLQ or Lambda errors |
| 7 | Terraform modules or separate `.tf` by layer |
| 8 | README: apply, test, destroy |
| 9 | `tfsec` with no HIGH |
| 10 | (Bonus) presigned upload URL |

## Run

```bash
docker compose -f deploy/localstack/docker-compose.yml up -d
cd courses/aws-intermediate/projects/image-platform
cp terraform.tfvars.example terraform.tfvars
./scripts/build-lambdas.sh
tflocal init && tflocal apply
./scripts/smoke-test.sh
```

## Submission

- Link to repo / PR
- Screenshot of `dynamodb scan` + `s3 ls thumbs/` after smoke test
- Short README: what you would change for prod

## Moving to prod

1. Remote state (lesson 18)
2. `use_localstack = false`
3. NAT + RDS — [optional-aws.md](optional-aws.md)
4. Budget alert

## After the course

- **aws-advanced** (planned): Organizations, WAF, multi-region DR, EKS+IRSA
- Tie-in with **kuber-advanced**: the same workload on EKS

Congratulations on finishing **aws-intermediate**.
