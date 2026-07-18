# 23. Lambda S3 trigger: event structure и process_s3_upload

## Введение: «upload прошёл, metadata в DynamoDB нет»

S3 notification настроена на prefix `uploads/`, файл положили в `images/photo.jpg` — **тишина**. Или handler падает на `record["s3"]["object"]["key"]` потому что key URL-encoded. S3 → Lambda — **контракт event Records[]**, не ваш custom JSON.

Handler стека: [`process_s3_upload`](../../deploy/python-aws/stack/shop_aws/lambda_handlers/handlers.py).

## Что вы узнаете

- Wiring: bucket notification + Lambda permission.
- Полная структура S3 event record.
- Разбор `process_s3_upload` построчно.
- Idempotency и batch Records.

---

## Wiring overview

```text
1. Lambda function (zip + role)
2. lambda.add_permission — S3 may invoke
3. s3.put_bucket_notification_configuration — event → Lambda ARN
4. s3:PutObject → async invoke Lambda
```

| Step | API |
|------|-----|
| Permission | `lambda.add_permission` Principal `s3.amazonaws.com` |
| Notification | `s3.put_bucket_notification_configuration` |
| Filter | prefix/suffix in LambdaConfig |

Terraform reference: [aws-terraform/17-s3-lambda-pipeline](../aws-terraform/17-s3-lambda-pipeline.md).

---

## Event envelope

```json
{
  "Records": [{
    "eventVersion": "2.1",
    "eventSource": "aws:s3",
    "eventName": "ObjectCreated:Put",
    "s3": {
      "bucket": {"name": "shop-uploads", "arn": "arn:aws:s3:::shop-uploads"},
      "object": {"key": "uploads/photo.jpg", "size": 2048, "eTag": "..."}
    }
  }]
}
```

| Field | Handler use |
|-------|-------------|
| `eventName` | `ObjectCreated:*` vs delete events |
| `s3.bucket.name` | cross-bucket guard |
| `s3.object.key` | **unquote_plus** before get_object |
| `s3.object.size` | metadata; verify if billing-critical |

Keys with spaces → `hello%20world.jpg` без decode — 404 на GetObject.

---

## process_s3_upload walkthrough

```python
def process_s3_upload(event, context):
    table = DynamoDBRepository()
    s3 = S3Service()
    processed = 0
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
        size = record["s3"]["object"].get("size", 0)
        body_preview = s3.get_bytes(key)[:32]
        table.put_item(
            pk=f"file:{key}",
            data={
                "bucket": bucket,
                "key": key,
                "size": int(size),
                "preview_hex": body_preview.hex(),
            },
        )
        processed += 1
    return {"statusCode": 200, "processed": processed}
```

| Design choice | Rationale |
|---------------|-----------|
| `pk=file:{key}` | idempotent upsert same file |
| preview 32 bytes | cheap fingerprint without full scan |
| loop all Records | S3 may batch |
| S3Service in Lambda | same code as lab scripts |

---

## Manual event test (local)

```python
event = {
    "Records": [{
        "s3": {
            "bucket": {"name": "shop-uploads"},
            "object": {"key": "uploads/test.bin", "size": 11},
        }
    }]
}
# seed file first via S3Service.put_bytes
process_s3_upload(event, None)
```

`context=None` ok для unit test if handler doesn't use context.

---

## Notification configuration (boto3 sketch)

```python
from shop_aws.clients import client
from shop_aws.config import settings

s3 = client("s3")
lam = client("lambda")
fn_arn = lam.get_function(FunctionName="shop-s3-processor")["Configuration"]["FunctionArn"]

s3.put_bucket_notification_configuration(
    Bucket=settings.shop_bucket,
    NotificationConfiguration={
        "LambdaFunctionConfigurations": [{
            "LambdaFunctionArn": fn_arn,
            "Events": ["s3:ObjectCreated:*"],
            "Filter": {"Key": {"FilterRules": [
                {"Name": "prefix", "Value": "uploads/"},
            ]}},
        }],
    },
)
```

LocalStack: notification → invoke may lag seconds.

---

## Delivery semantics

| Property | Value |
|----------|-------|
| Delivery | at-least-once |
| Order | not guaranteed |
| Duplicate | same key, multiple events possible |
| Failure | retries; configure DLQ in prod |

Связь с [18-lab-idempotent-ddb](18-lab-idempotent-ddb.md) — conditional put если business logic не idempotent.

---

## Recursive loop trap

Lambda writes `processed/` в **тот же** bucket без filter → infinite invoke chain. Filter prefix или separate bucket.

---

## S3 vs SQS destination

| Lambda direct | S3 → SQS → worker |
|---------------|-------------------|
| simple | buffer + scale |
| 15 min limit | long poll workers |
| sync failure visible | DLQ on queue |

[`SQSService`](../../deploy/python-aws/stack/shop_aws/sqs_service.py) — альтернатива ([25-sqs-boto3](25-sqs-boto3.md)).

---

## Типичные ошибки

| Ошибка | Symptom |
|--------|---------|
| Missing add_permission | S3 silent fail / access denied |
| Encoded key | NoSuchKey |
| Handler timeout on large file | partial DDB rows |
| No filter | cost explosion |

## Резюме

S3 trigger шлёт **`Records[]`** с bucket/key/size. **Decode key**, iterate batch, **idempotent** DynamoDB pk. `process_s3_upload` — эталон pipeline metadata. Следующая лаба — end-to-end upload → Lambda → DDB.

Далее: [24-lab-s3-lambda-pipeline](24-lab-s3-lambda-pipeline.md).
