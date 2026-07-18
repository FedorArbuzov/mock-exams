# Interview cheatsheet — Python AWS (boto3)

## Quick map

| Topic | Key phrase |
|-------|------------|
| Session | credentials + region |
| Client | low-level dict API |
| Resource | OOP Table/Bucket |
| endpoint_url | LocalStack gateway :4566 |
| ClientError | AWS error code in response |
| Paginator | don't truncate list calls |
| S3 key | flat namespace, decode events |
| Presigned | temp URL without sharing keys |
| S3 event | Records[], at-least-once |
| DDB pk | design avoids hot partitions |
| Query vs Scan | query keys only; scan expensive |
| Conditional put | idempotency / no overwrite |
| Lambda | (event, context) → return |
| API GW return | body must be JSON **string** |
| Cold start | zip size + imports + VPC |
| SQS | send → receive → delete |
| Visibility | hide msg; timeout → redelivery |
| Long poll | WaitTimeSeconds=20 |
| SNS | fan-out pub/sub |
| SNS→SQS | parse wrapped Message |
| EventBridge | rules on source/detail-type |
| put_events | Detail is JSON string |
| Secrets Manager | rotating secrets JSON |
| SSM | config hierarchy / SecureString |
| moto | fast unit, endpoint_url=None |
| LocalStack | Docker integration tests |

## Commands

```bash
cd deploy/python-aws
docker compose up -d --build
docker exec mock-python-aws-lab python lab_cli.py bootstrap
docker exec mock-python-aws-lab python lab_cli.py health
docker exec mock-python-aws-lab pytest tests/ -v

# Host
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
```

## Handler paths (стек)

```text
shop_aws.lambda_handlers.handlers.hello
shop_aws.lambda_handlers.handlers.process_s3_upload
```

## Env (lab)

| Var | Default |
|-----|---------|
| AWS_ENDPOINT_URL | http://localstack:4566 (container) |
| SHOP_BUCKET | shop-uploads |
| SHOP_TABLE | shop-items |
| SHOP_QUEUE | shop-events |

## Debug checklist

1. `endpoint_url` correct (localhost vs localstack hostname)?
2. Bootstrap run? (`lab_cli.py bootstrap`)
3. IAM role trust + permissions?
4. S3 key URL-decoded?
5. SQS message deleted after process?
6. moto tests: `endpoint_url=None`?

## Service pick

| Need | Service |
|------|---------|
| Object storage | S3 |
| Metadata / idempotency | DynamoDB |
| Buffer work | SQS |
| Notify many | SNS |
| Route events | EventBridge |
| Compute on event | Lambda |
| Secrets | Secrets Manager |
| Config | SSM |

Полные ответы: [35-interview-qa](35-interview-qa.md). Capstone: [36-capstone](36-capstone.md).
