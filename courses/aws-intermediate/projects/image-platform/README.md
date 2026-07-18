# Image Platform (aws-intermediate final project)

Расширение [image-pipeline](../../../aws-terraform/projects/image-pipeline/):

- S3 (KMS) → **SQS** → Lambda worker  
- **API Gateway** → Lambda API → DynamoDB  
- **Secrets Manager** (API key)  
- **VPC** + security groups (foundation for ALB/ECS)  
- **CloudWatch** alarms + SNS  

## Quick start

```bash
docker compose -f ../../../../deploy/localstack/docker-compose.yml up -d

cp terraform.tfvars.example terraform.tfvars
# edit bucket_name

./scripts/build-lambdas.sh   # Windows: .\scripts\build-lambdas.ps1
tflocal init
tflocal apply

./scripts/smoke-test.sh $(tflocal output -raw bucket_name) \
  $(tflocal output -raw api_endpoint) \
  $(tflocal output -raw dynamodb_table_name)
```

Добавьте `fixtures/sample.jpg` для корректного resize-теста.

## API

```bash
KEY=$(aws --endpoint-url=http://localhost:4566 secretsmanager get-secret-value \
  --secret-id course/api-key --query SecretString --output text)
curl -H "X-Api-Key: $KEY" "$(tflocal output -raw api_endpoint)/images/IMAGE_ID"
```

## Destroy

```bash
tflocal destroy
```
