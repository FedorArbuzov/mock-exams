# Python — AWS (boto3)

Мега-подробный курс по **boto3** и AWS SDK для Python: **S3**, **DynamoDB**, **Lambda**, **SQS**, **SNS**, **EventBridge**, **Secrets Manager**, тесты **moto/LocalStack**. **36 уроков** + capstone + interview cheatsheet.

**Не дублирует** [`aws-basic`](../aws-basic/README.md) (теория сервисов) и [`aws-terraform`](../aws-terraform/README.md) (IaC) — фокус на **runtime Python code** с boto3.

**Предварительно:** Python 3.11+, базовый AWS ([`aws-basic`](../aws-basic/README.md)). Полезно: [`aws-terraform`](../aws-terraform/README.md), [`python-testing`](../python-testing/README.md), [`python-celery`](../python-celery/README.md) (SQS vs Celery).

**Локально:** [`deploy/python-aws`](../../deploy/python-aws/README.md):

```bash
cd deploy/python-aws
docker compose up -d --build
bash scripts/smoke.sh
```

| Ресурс | URL |
|--------|-----|
| LocalStack | http://localhost:4566 |
| Lab shell | `docker exec -it mock-python-aws-lab bash` |

## Как читать

1. **Теория** → **лаба** — код в [`deploy/python-aws/stack`](../../deploy/python-aws/stack).
2. После **35** — [`interview-cheatsheet.md`](interview-cheatsheet.md).
3. [36-capstone.md](36-capstone.md) — **4–6 часов** (image pipeline).

**Время:** ~50–65 мин на пару «теория + лаба»; **~22–28 часов** total.

## Программа (36 уроков)

### Фаза 1. boto3 fundamentals (01–06)
| 01 | [SDK landscape: boto3 vs CLI vs Terraform](01-boto3-landscape.md) |
| 02 | [Session, client vs resource](02-session-client-resource.md) |
| 03 | [Лаба: explore LocalStack](03-lab-explore-localstack.md) |
| 04 | [Config, endpoints, credentials](04-config-endpoints-localstack.md) |
| 05 | [Лаба: первый boto3 call (STS)](05-lab-first-boto3-call.md) |
| 06 | [Errors, retries, paginators](06-errors-retries-paginators.md) |

### Фаза 2. S3 (07–12)
| 07 | [S3 boto3: put, get, list, delete](07-s3-boto3-basics.md) |
| 08 | [Лаба: S3 upload/download](08-lab-s3-upload.md) |
| 09 | [Presigned URLs, multipart](09-s3-advanced-presigned.md) |
| 10 | [Лаба: presigned URL](10-lab-presigned-url.md) |
| 11 | [S3 event notifications](11-s3-events-notifications.md) |
| 12 | [Лаба: metadata и tags](12-lab-s3-metadata.md) |

### Фаза 3. DynamoDB (13–18)
| 13 | [DynamoDB CRUD boto3](13-dynamodb-boto3-crud.md) |
| 14 | [Лаба: items put/get](14-lab-dynamodb-items.md) |
| 15 | [Query, GSI, conditions](15-dynamodb-query-gsi.md) |
| 16 | [Лаба: query patterns](16-lab-dynamodb-query.md) |
| 17 | [Batch write, transactions](17-dynamodb-batch-transactions.md) |
| 18 | [Лаба: idempotent conditional put](18-lab-idempotent-ddb.md) |

### Фаза 4. Lambda (19–24)
| 19 | [Lambda handler: event, context](19-lambda-handler-basics.md) |
| 20 | [Лаба: hello handler local](20-lab-hello-lambda.md) |
| 21 | [Deploy: zip, IAM, packaging](21-lambda-deploy-packaging.md) |
| 22 | [Лаба: create_function + invoke](22-lab-lambda-invoke-boto3.md) |
| 23 | [S3 trigger event structure](23-lambda-s3-trigger.md) |
| 24 | [Лаба: S3 → Lambda → DynamoDB](24-lab-s3-lambda-pipeline.md) |

### Фаза 5. Messaging (25–30)
| 25 | [SQS boto3](25-sqs-boto3.md) |
| 26 | [Лаба: SQS worker](26-lab-sqs-worker.md) |
| 27 | [SNS boto3](27-sns-boto3.md) |
| 28 | [Лаба: SNS notify](28-lab-sns-notify.md) |
| 29 | [EventBridge put_events](29-eventbridge-boto3.md) |
| 30 | [Лаба: event pipeline](30-lab-event-pipeline.md) |

### Фаза 6. Secrets, testing, capstone (31–36)
| 31 | [Secrets Manager, SSM](31-secrets-ssm.md) |
| 32 | [Лаба: secrets in Lambda](32-lab-secrets-lambda.md) |
| 33 | [Testing: moto vs LocalStack](33-testing-moto-localstack.md) |
| 34 | [Лаба: pytest AWS](34-lab-pytest-aws.md) |
| 35 | [Interview Q&A (топ-40)](35-interview-qa.md) |
| 36 | [Capstone: image pipeline](36-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## Что должно получиться

- Пишете **boto3** для S3, DynamoDB, Lambda, SQS, SNS, EventBridge.
- Деплоите Lambda через **SDK** (zip + IAM) на LocalStack.
- Строите **event-driven pipeline** S3 → Lambda → DDB.
- Тестируете с **moto** и **LocalStack**.
- Понимаете границу **boto3 vs Terraform**.

## Связь с курсами

| Курс | Связь |
|------|-------|
| [`aws-basic`](../aws-basic/README.md) | теория сервисов |
| [`aws-terraform`](../aws-terraform/README.md) | IaC тот же pipeline |
| [`aws-intermediate`](../aws-intermediate/README.md) | VPC, API GW, ECS |
| [`python-celery`](../python-celery/README.md) | SQS vs task queue |
| [`python-testing`](../python-testing/README.md) | pytest patterns |

## Эталонный код

[`deploy/python-aws/stack/shop_aws`](../../deploy/python-aws/stack/shop_aws) — clients, S3, DynamoDB, SQS, lambda handlers.

Lab scripts: `deploy_hello.py`, `pipeline_setup.py`, `sqs_worker.py`, `sns_setup.py`, `eventbridge_setup.py`.
