# Python — AWS (boto3)

A deeply detailed course on **boto3** and the AWS SDK for Python: **S3**, **DynamoDB**, **Lambda**, **SQS**, **SNS**, **EventBridge**, **Secrets Manager**, testing with **moto/LocalStack**. **36 lessons** + capstone + interview cheatsheet.

**Does not duplicate** [`aws-basic`](../aws-basic/README.md) (service theory) or [`aws-terraform`](../aws-terraform/README.md) (IaC) — the focus is on **runtime Python code** with boto3.

**Prerequisites:** Python 3.11+, basic AWS ([`aws-basic`](../aws-basic/README.md)). Helpful: [`aws-terraform`](../aws-terraform/README.md), [`python-testing`](../python-testing/README.md), [`python-celery`](../python-celery/README.md) (SQS vs Celery).

**Locally:** [`deploy/python-aws`](../../deploy/python-aws/README.md):

```bash
cd deploy/python-aws
docker compose up -d --build
bash scripts/smoke.sh
```

| Resource | URL |
|--------|-----|
| LocalStack | http://localhost:4566 |
| Lab shell | `docker exec -it mock-python-aws-lab bash` |

## How to read

1. **Theory** → **lab** — code is in [`deploy/python-aws/stack`](../../deploy/python-aws/stack).
2. After **35** — [`interview-cheatsheet.md`](interview-cheatsheet.md).
3. [36-capstone.md](36-capstone.md) — **4–6 hours** (image pipeline).

**Time:** ~50–65 min per "theory + lab" pair; **~22–28 hours** total.

## Curriculum (36 lessons)

### Phase 1. boto3 fundamentals (01–06)
| 01 | [SDK landscape: boto3 vs CLI vs Terraform](01-boto3-landscape.md) |
| 02 | [Session, client vs resource](02-session-client-resource.md) |
| 03 | [Lab: explore LocalStack](03-lab-explore-localstack.md) |
| 04 | [Config, endpoints, credentials](04-config-endpoints-localstack.md) |
| 05 | [Lab: first boto3 call (STS)](05-lab-first-boto3-call.md) |
| 06 | [Errors, retries, paginators](06-errors-retries-paginators.md) |

### Phase 2. S3 (07–12)
| 07 | [S3 boto3: put, get, list, delete](07-s3-boto3-basics.md) |
| 08 | [Lab: S3 upload/download](08-lab-s3-upload.md) |
| 09 | [Presigned URLs, multipart](09-s3-advanced-presigned.md) |
| 10 | [Lab: presigned URL](10-lab-presigned-url.md) |
| 11 | [S3 event notifications](11-s3-events-notifications.md) |
| 12 | [Lab: metadata and tags](12-lab-s3-metadata.md) |

### Phase 3. DynamoDB (13–18)
| 13 | [DynamoDB CRUD boto3](13-dynamodb-boto3-crud.md) |
| 14 | [Lab: items put/get](14-lab-dynamodb-items.md) |
| 15 | [Query, GSI, conditions](15-dynamodb-query-gsi.md) |
| 16 | [Lab: query patterns](16-lab-dynamodb-query.md) |
| 17 | [Batch write, transactions](17-dynamodb-batch-transactions.md) |
| 18 | [Lab: idempotent conditional put](18-lab-idempotent-ddb.md) |

### Phase 4. Lambda (19–24)
| 19 | [Lambda handler: event, context](19-lambda-handler-basics.md) |
| 20 | [Lab: hello handler local](20-lab-hello-lambda.md) |
| 21 | [Deploy: zip, IAM, packaging](21-lambda-deploy-packaging.md) |
| 22 | [Lab: create_function + invoke](22-lab-lambda-invoke-boto3.md) |
| 23 | [S3 trigger event structure](23-lambda-s3-trigger.md) |
| 24 | [Lab: S3 → Lambda → DynamoDB](24-lab-s3-lambda-pipeline.md) |

### Phase 5. Messaging (25–30)
| 25 | [SQS boto3](25-sqs-boto3.md) |
| 26 | [Lab: SQS worker](26-lab-sqs-worker.md) |
| 27 | [SNS boto3](27-sns-boto3.md) |
| 28 | [Lab: SNS notify](28-lab-sns-notify.md) |
| 29 | [EventBridge put_events](29-eventbridge-boto3.md) |
| 30 | [Lab: event pipeline](30-lab-event-pipeline.md) |

### Phase 6. Secrets, testing, capstone (31–36)
| 31 | [Secrets Manager, SSM](31-secrets-ssm.md) |
| 32 | [Lab: secrets in Lambda](32-lab-secrets-lambda.md) |
| 33 | [Testing: moto vs LocalStack](33-testing-moto-localstack.md) |
| 34 | [Lab: pytest AWS](34-lab-pytest-aws.md) |
| 35 | [Interview Q&A (top 40)](35-interview-qa.md) |
| 36 | [Capstone: image pipeline](36-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## What you should end up with

- Writing **boto3** for S3, DynamoDB, Lambda, SQS, SNS, EventBridge.
- Deploying Lambda via the **SDK** (zip + IAM) on LocalStack.
- Building an **event-driven pipeline** S3 → Lambda → DDB.
- Testing with **moto** and **LocalStack**.
- Understanding the **boto3 vs Terraform** boundary.

## Related courses

| Course | Relationship |
|------|-------|
| [`aws-basic`](../aws-basic/README.md) | service theory |
| [`aws-terraform`](../aws-terraform/README.md) | IaC, same pipeline |
| [`aws-intermediate`](../aws-intermediate/README.md) | VPC, API GW, ECS |
| [`python-celery`](../python-celery/README.md) | SQS vs task queue |
| [`python-testing`](../python-testing/README.md) | pytest patterns |

## Reference code

[`deploy/python-aws/stack/shop_aws`](../../deploy/python-aws/stack/shop_aws) — clients, S3, DynamoDB, SQS, lambda handlers.

Lab scripts: `deploy_hello.py`, `pipeline_setup.py`, `sqs_worker.py`, `sns_setup.py`, `eventbridge_setup.py`.
