# Image Pipeline (core starter for the final project)

Minimal S3 `uploads/*.jpg` → Lambda (resize) → S3 `thumbs/` + DynamoDB metadata.

The **full finale** requirements (DLQ, API Gateway, Secrets, modules, GSI/TTL, …) are in [`../../23-final-project.md`](../../23-final-project.md). Treat this directory as a **starting point**, not the finished platform.

## Quick start

```bash
# from the root of mock-exams
mockctl localstack up

cd courses-en/aws-terraform/projects/image-pipeline
cp terraform.tfvars.example terraform.tfvars
# edit bucket_name

./scripts/build-lambda.sh   # Windows: .\scripts\build-lambda.ps1

tflocal init
tflocal apply
```

Verify (from mock-exams root): see [`../../24-verification.md`](../../24-verification.md) and `../../scripts/verify-final.sh`.

## Cleanup

```bash
tflocal destroy
# optional: mockctl localstack down
```

## Requirements

- Docker + LocalStack via `mockctl localstack up` (or `deploy/localstack/docker-compose.yml`)
- Terraform ≥ 1.5
- Python 3 + pip (Lambda build)
- Optional: `pip install terraform-local` → `tflocal`
- Optional: AWS CLI v2 for tests / `scripts/verify-final.sh`

## Test

```bash
BUCKET=$(tflocal output -raw bucket_name)
TABLE=$(tflocal output -raw dynamodb_table_name)

# any jpg
aws --endpoint-url=http://localhost:4566 s3 cp test.jpg s3://$BUCKET/uploads/test.jpg

sleep 10
aws --endpoint-url=http://localhost:4566 s3 ls s3://$BUCKET/thumbs/
aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name $TABLE
```

## Real AWS

`terraform.tfvars`:

```hcl
use_localstack = false
bucket_name    = "unique-prod-bucket-name"
```

```bash
export AWS_PROFILE=your-dev-profile
terraform apply
```
