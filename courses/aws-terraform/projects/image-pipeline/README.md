# Image Pipeline (финальный проект)

S3 `uploads/*.jpg` → Lambda (resize) → S3 `thumbs/` + DynamoDB metadata.

## Требования

- Docker + LocalStack (`deploy/localstack/docker-compose.yml`)
- Terraform ≥ 1.5
- Python 3 + pip (сборка Lambda)
- Опционально: `pip install terraform-local` → `tflocal`

## Быстрый старт

```bash
# из корня mock-exams
docker compose -f deploy/localstack/docker-compose.yml up -d

cd courses/aws-terraform/projects/image-pipeline
cp terraform.tfvars.example terraform.tfvars
# отредактируйте bucket_name

./scripts/build-lambda.sh   # Windows: .\scripts\build-lambda.ps1

tflocal init
tflocal apply
```

## Тест

```bash
BUCKET=$(tflocal output -raw bucket_name)
TABLE=$(tflocal output -raw dynamodb_table_name)

# любой jpg
aws --endpoint-url=http://localhost:4566 s3 cp test.jpg s3://$BUCKET/uploads/test.jpg

sleep 10
aws --endpoint-url=http://localhost:4566 s3 ls s3://$BUCKET/thumbs/
aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name $TABLE
```

## Уборка

```bash
tflocal destroy
```

## Реальный AWS

`terraform.tfvars`:

```hcl
use_localstack = false
bucket_name    = "unique-prod-bucket-name"
```

```bash
export AWS_PROFILE=your-dev-profile
terraform apply
```
