# AWS Intermediate

Intermediate AWS. Assumes you completed [`aws-basic`](../aws-basic/README.md) and [`aws-terraform`](../aws-terraform/README.md): you understand the services and have already built an S3 → Lambda → DynamoDB pipeline in Terraform.

**Goal:** go from “I know serverless” to “I design a production-ready platform”: networking, APIs, queues, secrets, observability, multi-env IaC.

## Who this is for

- Graduates of `aws-terraform` ready to go deeper.
- DevOps / backend after Kubernetes courses (comparisons with Ingress, RBAC, queues).
- Prep for **Solutions Architect Associate** (practical patterns).

## Requirements

| Tool | Purpose |
|---|---|
| Docker | LocalStack |
| Terraform ≥ 1.5 | all labs |
| `tflocal` or endpoints | local AWS |
| AWS CLI v2 | verifying resources |
| Python 3 | Lambda handlers |

```bash
docker compose -f deploy/localstack/docker-compose.yml up -d
pip install terraform-local
```

**RAM:** LocalStack with Lambda + (optional) ECS — from 4 GB Docker.

## LocalStack vs real AWS

| Block | LocalStack | Real AWS (optional) |
|---|---|---|
| S3, Lambda, DynamoDB, SQS, API GW, EventBridge | ✅ main track | smoke-test |
| Secrets Manager, KMS, CloudWatch | ✅ | ✅ |
| VPC, ALB, RDS, ECS | ⚠️ simplified | labs 02, 04, 14, 16 — [optional-aws.md](optional-aws.md) |

## Curriculum

### Networking

1. [Custom VPC: subnets, routing](01-vpc-custom.md)
2. [Lab: VPC in Terraform](02-lab-vpc-custom.md)
3. [Security Groups and ALB](03-alb-security-groups.md)
4. [Lab: ALB + targets](04-lab-alb-security-groups.md)

### APIs and events

5. [API Gateway HTTP API](05-api-gateway.md)
6. [Lab: REST API → Lambda](06-lab-api-gateway.md)
7. [SQS, DLQ, backpressure](07-sqs-dlq.md)
8. [Lab: S3 → SQS → Lambda](08-lab-sqs-dlq.md)
9. [EventBridge: rules and bus](09-eventbridge.md)
10. [Lab: EventBridge instead of direct S3](10-lab-eventbridge.md)

### Secrets and data

11. [Secrets Manager and KMS](11-secrets-kms.md)
12. [Lab: secrets without passwords in tfvars](12-lab-secrets-kms.md)
13. [RDS in a private subnet](13-rds-private.md)
14. [Lab: RDS + Secrets Manager](14-lab-rds-private.md)

### Compute

15. [ECS Fargate behind ALB](15-ecs-fargate.md)
16. [Lab: containerized API](16-lab-ecs-fargate.md)

### IaC in a team

17. [Remote state and environments](17-remote-state.md)
18. [Lab: S3 backend + workspaces](18-lab-remote-state.md)

### Observability and security

19. [CloudWatch: alarms, dashboard](19-cloudwatch.md)
20. [Lab: alert on Lambda errors](20-lab-cloudwatch.md)
21. [Security CI: tfsec, OIDC](21-security-ci.md)
22. [Lab: scan + GitHub OIDC](22-lab-security-ci.md)

### Capstone

23. [Final project: Image Platform](23-final-project.md)

Reference: [`projects/image-platform/`](projects/image-platform/) (extension of [image-pipeline](../aws-terraform/projects/image-pipeline/)).

## What you should end up with

- You can draw and stand up a VPC with public/private subnets.
- You expose an HTTP API via API Gateway + Lambda.
- You place SQS + DLQ between producer and worker.
- You store passwords in Secrets Manager and encrypt S3 with KMS.
- You know when to use Lambda vs ECS Fargate.
- You configure remote state and a CloudWatch alarm.

## Path

```text
aws-basic → aws-terraform → aws-intermediate → [aws-advanced](../aws-advanced/README.md)
                                    │
                                    └── kuber-advanced (EKS, IRSA) — optional
```

## Relation to Kubernetes

| AWS Intermediate | Kubernetes |
|---|---|
| ALB + Target Group | Ingress + Service |
| ECS Fargate | Deployment (managed nodes) |
| SQS backpressure | HPA + queue workers |
| Private subnet + RDS | StatefulSet + NetworkPolicy |
| IRSA (in advanced) | ServiceAccount |
