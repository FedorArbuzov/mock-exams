# AWS + Terraform

A course on **Infrastructure as Code** for AWS. All labs run on **LocalStack** or **MiniStack** — a paid AWS account is not required.

**Prerequisites:** [`aws-basic`](../aws-basic/README.md) (AWS theory).

## Requirements

| Tool | Version | Installation |
|---|---|---|
| Docker | 20+ | Docker Desktop / engine |
| Terraform | ≥ 1.5 | [terraform.io](https://developer.hashicorp.com/terraform/install) |
| AWS CLI v2 | any | optional, for verification |
| Python 3 | 3.10+ | for `tflocal` and building the Lambda zip |
| pip | — | `pip install terraform-local` |

Start the emulator from the repository root (**no minikube**):

```bash
mockctl localstack up
# fallback: docker compose -f deploy/localstack/docker-compose.yml up -d
```

Verification: `mockctl localstack status` or `curl -s http://localhost:4566/_localstack/health | head`

Stop when finished: `mockctl localstack down` (does not affect a Kubernetes profile).

## Curriculum

### Terraform basics

1. [Terraform: HCL, provider, plan/apply](01-terraform-intro.md)
2. [Lab: your first S3 bucket](02-lab-terraform-intro.md)
3. [State, variables, outputs](03-state-and-variables.md)
4. [Lab: variables and outputs](04-lab-state-and-variables.md)

### LocalStack

5. [The AWS provider and endpoints](05-aws-provider-localstack.md)
6. [Lab: LocalStack + provider](06-lab-aws-provider-localstack.md)
7. [tflocal: one codebase for local and prod](07-tflocal.md)
8. [Lab: workflow with tflocal](08-lab-tflocal.md)

### AWS services in Terraform

9. [IAM in Terraform: role, policy attachment](09-iam-terraform.md)
10. [Lab: execution role for Lambda](10-lab-iam-terraform.md)
11. [S3: bucket, encryption, notifications](11-s3-terraform.md)
12. [Lab: bucket and object upload](12-lab-s3-terraform.md)
13. [Lambda: zip, permissions, log group](13-lambda-terraform.md)
14. [Lab: function and invoke](14-lab-lambda-terraform.md)
15. [DynamoDB: table, keys, TTL](15-dynamodb-terraform.md)
16. [Lab: table and put_item](16-lab-dynamodb-terraform.md)

### Integration

17. [Pipeline: S3 → Lambda → DynamoDB](17-s3-lambda-pipeline.md)
18. [Lab: build the pipeline manually](18-lab-s3-lambda-pipeline.md)
19. [Terraform modules](19-modules.md)
20. [Lab: extract S3 into a module](20-lab-modules.md)
21. [CI: terraform plan in GitHub Actions](21-ci-terraform.md)
22. [Lab: workflow for the repository](22-lab-ci-terraform.md)

### Finale

23. [Final project: image platform](23-final-project.md) — S3/Lambda/DynamoDB **plus** DLQ, API Gateway, Secrets, modules, GSI/TTL, …
24. [How we verify](24-verification.md)

Starter / core reference: [`projects/image-pipeline/`](projects/image-pipeline/) (extend it; do not stop at the minimal pipeline).

## What you should end up with

- You write and apply Terraform for S3, IAM, Lambda, DynamoDB, SQS, API Gateway, Secrets Manager.
- You structure IaC with **modules**, `for_each`/`count`, tagging, and a LocalStack↔AWS switch.
- You prove the platform with `mockctl localstack` + `scripts/verify-final.sh`.
- You can explain the design in an interview (events, DLQ, least privilege, state).

## Lab structure

Each lab is a directory `~/aws-labs/lesson-NN/` (you create it yourself). The final project can be cloned from `projects/image-pipeline/`.

## Relation to aws-basic

| aws-basic lesson | aws-terraform lesson |
|---|---|
| 03 IAM | 09–10 |
| 06 S3 | 11–12, 17–18 |
| 07 DynamoDB | 15–16 |
| 08 Lambda | 13–14, 17–18 |
| 10 LocalStack | 05–08 |

## Next

- [`aws-intermediate`](../aws-intermediate/README.md) — VPC, API Gateway, SQS, EventBridge, observability.
- A real AWS dev account + AWS Budgets alert.
- Terraform Cloud / S3 backend for state in a team.
