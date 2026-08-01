# 23. Lambda S3 trigger: event structure and process_s3_upload

## Intro: "the upload went through, but there's no metadata in DynamoDB"

The S3 notification is configured for the `uploads/` prefix, the file was put into `images/photo.jpg` — **silence**. Or the handler crashes on `record["s3"]["object"]["key"]` because the key is URL-encoded. S3 → Lambda — the **event Records[] contract**, not your custom JSON.

Stack handler: [`process_s3_upload`](../../deploy/python-aws/stack/shop_aws/lambda_handlers/handlers.py).

## What you'll learn

- Wiring: bucket notification + Lambda permission.
- The full structure of an S3 event record.
- A line-by-line breakdown of `process_s3_upload`.
- Idempotency and batch Records.

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

Keys with spaces → `hello%20world.jpg` without decode — 404 on GetObject.

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
| `pk=file:{key}` | idempotent upsert of the same file |
| preview 32 bytes | cheap fingerprint without a full scan |
| loop all Records | S3 may batch |
| S3Service in Lambda | same code as the lab scripts |

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
# seed the file first via S3Service.put_bytes
process_s3_upload(event, None)
```

`context=None` is ok for a unit test if the handler doesn't use context.

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

LocalStack: notification → invoke may lag by seconds.

---

## Delivery semantics

| Property | Value |
|----------|-------|
| Delivery | at-least-once |
| Order | not guaranteed |
| Duplicate | same key, multiple events possible |
| Failure | retries; configure a DLQ in prod |

Related to [18-lab-idempotent-ddb](18-lab-idempotent-ddb.md) — conditional put if the business logic is not idempotent.

---

## Recursive loop trap

Lambda writes `processed/` into the **same** bucket without a filter → an infinite invoke chain. Filter by prefix or use a separate bucket.

---

## S3 vs SQS destination

| Lambda direct | S3 → SQS → worker |
|---------------|-------------------|
| simple | buffer + scale |
| 15 min limit | long poll workers |
| sync failure visible | DLQ on the queue |

[`SQSService`](../../deploy/python-aws/stack/shop_aws/sqs_service.py) — an alternative ([25-sqs-boto3](25-sqs-boto3.md)).

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Missing add_permission | S3 silent fail / access denied |
| Encoded key | NoSuchKey |
| Handler timeout on a large file | partial DDB rows |
| No filter | cost explosion |

## Summary

The S3 trigger sends **`Records[]`** with bucket/key/size. **Decode the key**, iterate the batch, use an **idempotent** DynamoDB pk. `process_s3_upload` — the reference metadata pipeline. The next lab — end-to-end upload → Lambda → DDB.

Next: [24-lab-s3-lambda-pipeline](24-lab-s3-lambda-pipeline.md).
